use mp_core::{
    ai::{claude::ClaudeBackend, AiBackend},
    classifier::ClassifierEngine,
    db::queries,
    imap_client::account_manager,
};
use tauri::{Emitter, State};
use crate::{error::MpResult, state::AppState};

/// API-Key fuer Claude: zuerst System-Keychain (Konto "claude-api-key"),
/// dann die Umgebungsvariable ANTHROPIC_API_KEY (praktisch fuer Testlaeufe).
fn claude_api_key() -> Option<String> {
    account_manager::get_password("claude-api-key")
        .ok()
        .filter(|k| !k.is_empty())
        .or_else(|| std::env::var("ANTHROPIC_API_KEY").ok())
        .filter(|k| !k.is_empty())
}

fn require_key() -> MpResult<String> {
    claude_api_key().ok_or_else(|| {
        crate::error::MpError::Other(
            "Kein Claude API-Key gefunden (System-Keychain 'claude-api-key' oder ANTHROPIC_API_KEY).".to_string(),
        )
    })
}

#[tauri::command]
pub async fn classify_email(state: State<'_, AppState>, email_id: String) -> MpResult<()> {
    let settings = state.settings.read().await.clone();
    let email = queries::get_email(&state.pool, &email_id)
        .await?
        .ok_or_else(|| crate::error::MpError::Other("Email not found".to_string()))?;

    let key = require_key()?;
    let ai = Box::new(ClaudeBackend::new(&key, &settings.claude_model));
    let engine = ClassifierEngine::new(Some(ai));
    let cls = engine.classify(&email).await;

    queries::update_classification(&state.pool, &email_id, &cls).await?;
    Ok(())
}

#[tauri::command]
pub async fn classify_batch(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
    limit: Option<u32>,
) -> MpResult<u32> {
    let settings = state.settings.read().await.clone();
    let pool = state.pool.clone();
    let app_clone = app.clone();

    let key = require_key()?;
    let lim = limit.unwrap_or(200) as i64;
    let emails = sqlx::query!(
        r#"SELECT id AS "id!" FROM emails WHERE classification_json IS NULL ORDER BY date_ts DESC LIMIT ?"#,
        lim
    )
    .fetch_all(&pool)
    .await?;

    let total = emails.len() as u32;
    let model = settings.claude_model.clone();

    tokio::spawn(async move {
        let mut done = 0u32;
        for row in emails {
            if let Ok(Some(email)) = queries::get_email(&pool, &row.id).await {
                let ai = Box::new(ClaudeBackend::new(&key, &model));
                let engine = ClassifierEngine::new(Some(ai));
                let cls = engine.classify(&email).await;
                let _ = queries::update_classification(&pool, &row.id, &cls).await;
                done += 1;
                let _ = app_clone.emit("classify://progress", serde_json::json!({
                    "done": done,
                    "total": total,
                    "email_id": row.id,
                }));
            }
        }
        let _ = app_clone.emit("classify://done", done);
    });

    Ok(total)
}

/// Prueft, ob das Cloud-LLM-Backend (Claude) erreichbar ist. IPC-Name bleibt aus
/// Kompatibilitaetsgruenden `check_ollama`, testet aber das Claude-Backend.
#[tauri::command]
pub async fn check_ollama(state: State<'_, AppState>) -> MpResult<bool> {
    let settings = state.settings.read().await.clone();
    let Some(key) = claude_api_key() else {
        return Ok(false);
    };
    let backend = ClaudeBackend::new(&key, &settings.claude_model);
    Ok(backend.is_available().await)
}

#[tauri::command]
pub async fn generate_summary(state: State<'_, AppState>, email_id: String) -> MpResult<String> {
    let settings = state.settings.read().await.clone();
    let email = queries::get_email(&state.pool, &email_id)
        .await?
        .ok_or_else(|| crate::error::MpError::Other("Email not found".to_string()))?;

    let key = require_key()?;
    let backend = ClaudeBackend::new(&key, &settings.claude_model);
    let body = email.body_text.as_deref().unwrap_or(&email.subject);
    backend.summarize(body).await.map_err(Into::into)
}
