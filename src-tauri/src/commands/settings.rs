use mp_core::{db::queries, models::account::AppSettings};
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
