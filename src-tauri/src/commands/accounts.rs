use mp_core::{
    db::queries,
    imap_client::account_manager,
    models::account::EmailAccount,
};
use tauri::{Emitter, State};
use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn list_accounts(state: State<'_, AppState>) -> MpResult<Vec<EmailAccount>> {
    queries::list_accounts(&state.pool).await.map_err(Into::into)
}

#[tauri::command]
pub async fn add_account(
    state: State<'_, AppState>,
    account: EmailAccount,
    password: String,
) -> MpResult<EmailAccount> {
    account_manager::store_password(&account.id, &password)
        .map_err(|e| crate::error::MpError::Keyring(e.to_string()))?;
    queries::upsert_account(&state.pool, &account).await?;
    Ok(account)
}

#[tauri::command]
pub async fn update_account(
    state: State<'_, AppState>,
    account: EmailAccount,
) -> MpResult<()> {
    queries::upsert_account(&state.pool, &account).await.map_err(Into::into)
}

#[tauri::command]
pub async fn delete_account(state: State<'_, AppState>, id: String) -> MpResult<()> {
    let _ = account_manager::delete_password(&id);
    queries::delete_account(&state.pool, &id).await.map_err(Into::into)
}

#[tauri::command]
pub async fn test_connection(account: EmailAccount, password: String) -> MpResult<Vec<String>> {
    tokio::task::spawn_blocking(move || {
        account_manager::test_connection(&account, &password)
            .map_err(|e| crate::error::MpError::Imap(e.to_string()))
    })
    .await
    .map_err(|e| crate::error::MpError::Other(e.to_string()))?
}

#[tauri::command]
pub async fn sync_account(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
    account_id: String,
) -> MpResult<u32> {
    let pool = state.pool.clone();
    let settings = state.settings.read().await.clone();

    let accounts = queries::list_accounts(&pool).await?;
    let account = accounts.into_iter().find(|a| a.id == account_id)
        .ok_or_else(|| crate::error::MpError::Other("Account not found".to_string()))?;

    let password = account_manager::get_password(&account_id)
        .map_err(|e| crate::error::MpError::Keyring(e.to_string()))?;

    let max = settings.max_emails_per_sync;
    let app_clone = app.clone();

    let count = tokio::task::spawn_blocking(move || {
        mp_core::imap_client::fetch_emails(&account, &password, "INBOX", max)
            .map_err(|e| crate::error::MpError::Imap(e.to_string()))
    })
    .await
    .map_err(|e| crate::error::MpError::Other(e.to_string()))??;

    let fetched = count.len() as u32;
    for email in &count {
        let _ = queries::insert_email(&pool, email).await;
        let _ = app_clone.emit("sync://progress", &email.id);
    }

    let now = chrono::Utc::now().timestamp();
    sqlx::query!("UPDATE email_accounts SET last_sync = ? WHERE id = ?", now, account_id)
        .execute(&pool)
        .await?;

    let _ = app.emit("sync://done", fetched);
    Ok(fetched)
}
