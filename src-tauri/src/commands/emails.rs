use mp_core::{
    db::queries,
    models::email_entry::EmailEntry,
    search::{search, SearchQuery},
};
use tauri::State;
use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn list_emails(
    state: State<'_, AppState>,
    account_id: Option<String>,
    category: Option<String>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> MpResult<Vec<EmailEntry>> {
    queries::list_emails(
        &state.pool,
        account_id.as_deref(),
        category.as_deref(),
        limit.unwrap_or(100),
        offset.unwrap_or(0),
    )
    .await
    .map_err(Into::into)
}

#[tauri::command]
pub async fn get_email(state: State<'_, AppState>, id: String) -> MpResult<Option<EmailEntry>> {
    queries::get_email(&state.pool, &id).await.map_err(Into::into)
}

#[tauri::command]
pub async fn search_emails(
    state: State<'_, AppState>,
    query: String,
    limit: Option<u32>,
) -> MpResult<Vec<EmailEntry>> {
    let q = SearchQuery {
        text: query,
        limit: limit.unwrap_or(50),
        ..Default::default()
    };
    search(&state.pool, &q).await.map_err(Into::into)
}

#[tauri::command]
pub async fn mark_read(state: State<'_, AppState>, id: String, read: bool) -> MpResult<()> {
    sqlx::query!("UPDATE emails SET is_read = ? WHERE id = ?", read, id)
        .execute(&state.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn mark_flagged(state: State<'_, AppState>, id: String, flagged: bool) -> MpResult<()> {
    sqlx::query!("UPDATE emails SET is_flagged = ? WHERE id = ?", flagged, id)
        .execute(&state.pool)
        .await?;
    Ok(())
}
