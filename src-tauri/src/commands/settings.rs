use mp_core::{db::queries, imap_client::account_manager, models::account::AppSettings};
use tauri::State;
use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn get_settings(state: State<'_, AppState>) -> MpResult<AppSettings> {
    Ok(state.settings.read().await.clone())
}

#[tauri::command]
pub async fn save_settings(state: State<'_, AppState>, settings: AppSettings) -> MpResult<()> {
    queries::save_settings(&state.pool, &settings).await?;
    *state.settings.write().await = settings;
    Ok(())
}

#[tauri::command]
pub async fn set_claude_key(key: String) -> MpResult<()> {
    account_manager::store_password("claude-api-key", &key)?;
    Ok(())
}

#[tauri::command]
pub async fn get_claude_key_status() -> MpResult<bool> {
    let key = account_manager::get_password("claude-api-key").unwrap_or_default();
    Ok(!key.is_empty())
}
