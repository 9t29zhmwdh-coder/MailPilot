use mp_core::{
    db::queries,
    models::action::{ActionStatus, OrganizeAction},
};
use tauri::State;
use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn list_actions(state: State<'_, AppState>) -> MpResult<Vec<OrganizeAction>> {
    queries::list_actions(&state.pool).await.map_err(Into::into)
}

#[tauri::command]
pub async fn propose_actions(state: State<'_, AppState>) -> MpResult<u32> {
    let emails = sqlx::query!(
        r#"SELECT id AS "id!", subject, from_json, classification_json FROM emails WHERE classification_json IS NOT NULL"#
    )
    .fetch_all(&state.pool)
    .await?;

    let existing: std::collections::HashSet<String> = sqlx::query!(
        "SELECT DISTINCT email_id FROM organize_actions"
    )
    .fetch_all(&state.pool)
    .await?
    .into_iter()
    .map(|r| r.email_id)
    .collect();

    let mut count = 0u32;
    for row in emails {
        if existing.contains(&row.id) { continue; }
        if let Some(cls_json) = row.classification_json {
            if let Ok(cls) = serde_json::from_str::<mp_core::models::classification::Classification>(&cls_json) {
                let folder = cls.category.folder_name().to_string();
                let from_addr = serde_json::from_str::<mp_core::models::email_entry::EmailAddress>(&row.from_json)
                    .map(|a| a.address)
                    .unwrap_or_default();

                let action = OrganizeAction::move_to(
                    &row.id,
                    &row.subject,
                    &from_addr,
                    &folder,
                    &format!("Kategorie: {}", cls.category.display_name()),
                );
                let _ = queries::insert_action(&state.pool, &action).await;
                count += 1;
            }
        }
    }
    Ok(count)
}

#[tauri::command]
pub async fn apply_action(state: State<'_, AppState>, action_id: String) -> MpResult<()> {
    let applied = serde_json::to_string(&ActionStatus::Applied).unwrap();
    sqlx::query!("UPDATE organize_actions SET status_json = ? WHERE id = ?", applied, action_id)
        .execute(&state.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn apply_all_actions(state: State<'_, AppState>) -> MpResult<u32> {
    let pending = serde_json::to_string(&ActionStatus::Pending).unwrap();
    let applied = serde_json::to_string(&ActionStatus::Applied).unwrap();
    let result = sqlx::query!(
        "UPDATE organize_actions SET status_json = ? WHERE status_json = ?",
        applied, pending
    )
    .execute(&state.pool)
    .await?;
    Ok(result.rows_affected() as u32)
}

#[tauri::command]
pub async fn skip_action(state: State<'_, AppState>, action_id: String) -> MpResult<()> {
    let status = serde_json::to_string(&ActionStatus::Skipped).unwrap();
    sqlx::query!("UPDATE organize_actions SET status_json = ? WHERE id = ?", status, action_id)
        .execute(&state.pool)
        .await?;
    Ok(())
}

#[tauri::command]
pub async fn skip_all_actions(state: State<'_, AppState>) -> MpResult<u32> {
    let pending = serde_json::to_string(&ActionStatus::Pending).unwrap();
    let skipped = serde_json::to_string(&ActionStatus::Skipped).unwrap();
    let result = sqlx::query!(
        "UPDATE organize_actions SET status_json = ? WHERE status_json = ?",
        skipped, pending
    )
    .execute(&state.pool)
    .await?;
    Ok(result.rows_affected() as u32)
}
