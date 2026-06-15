use mp_core::{
    ai::ollama::OllamaBackend,
    classifier::ClassifierEngine,
    db::queries,
};
use tauri::State;
use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn classify_email(state: State<'_, AppState>, email_id: String) -> MpResult<()> {
    let settings = state.settings.read().await.clone();
    let email = queries::get_email(&state.pool, &email_id)
        .await?
        .ok_or_else(|| crate::error::MpError::Other("Email not found".to_string()))?;

    let ai = Box::new(OllamaBackend::new(&settings.ollama_url, &settings.text_model));
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

    let emails = sqlx::query!(
        "SELECT id FROM emails WHERE classification_json IS NULL ORDER BY date_ts DESC LIMIT ?",
        limit.unwrap_or(200) as i64
    )
    .fetch_all(&pool)
    .await?;

    let total = emails.len() as u32;
    let ollama_url = settings.ollama_url.clone();
    let text_model = settings.text_model.clone();

    tokio::spawn(async move {
        let mut done = 0u32;
        for row in emails {
            if let Ok(Some(email)) = queries::get_email(&pool, &row.id).await {
                let ai = Box::new(OllamaBackend::new(&ollama_url, &text_model));
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

#[tauri::command]
pub async fn check_ollama(state: State<'_, AppState>) -> MpResult<bool> {
    let settings = state.settings.read().await.clone();
    let backend = OllamaBackend::new(&settings.ollama_url, &settings.text_model);
    Ok(backend.is_available().await)
}

#[tauri::command]
pub async fn generate_summary(state: State<'_, AppState>, email_id: String) -> MpResult<String> {
    let settings = state.settings.read().await.clone();
    let email = queries::get_email(&state.pool, &email_id)
        .await?
        .ok_or_else(|| crate::error::MpError::Other("Email not found".to_string()))?;

    let backend = OllamaBackend::new(&settings.ollama_url, &settings.text_model);
    if !backend.is_available().await {
        return Err(crate::error::MpError::Other("Ollama not available".to_string()));
    }

    use mp_core::ai::AiBackend;
    let body = email.body_text.as_deref().unwrap_or(&email.subject);
    backend.summarize(body).await.map_err(Into::into)
}
