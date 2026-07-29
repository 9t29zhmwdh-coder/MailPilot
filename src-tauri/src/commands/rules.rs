use mp_core::{
    db::queries,
    models::{
        email_entry::EmailEntry,
        filter_rule::{FilterRule, RuleAction, RuleCondition},
    },
    rules,
};
use tauri::State;

use crate::{error::MpResult, state::AppState};

#[tauri::command]
pub async fn list_rules(state: State<'_, AppState>) -> MpResult<Vec<FilterRule>> {
    queries::list_rules(&state.pool).await.map_err(Into::into)
}

/// Input for creating or editing a rule.
///
/// The id is optional: the frontend sends none when creating, and the existing
/// one when editing, so both paths use the same command.
#[derive(Debug, serde::Deserialize)]
pub struct RuleInput {
    pub id: Option<String>,
    pub name: String,
    pub conditions: Vec<RuleCondition>,
    pub match_all: bool,
    pub actions: Vec<RuleAction>,
    pub enabled: bool,
}

#[tauri::command]
pub async fn save_rule(state: State<'_, AppState>, input: RuleInput) -> MpResult<FilterRule> {
    let name = input.name.trim().to_string();
    if name.is_empty() {
        return Err(crate::error::MpError::Other("Die Regel braucht einen Namen".into()));
    }
    // A rule without conditions would match nothing, and one without actions
    // would do nothing. Both are almost certainly a half-filled form, so they
    // are rejected here rather than silently stored as a rule that never fires.
    if input.conditions.is_empty() {
        return Err(crate::error::MpError::Other("Mindestens eine Bedingung ist nötig".into()));
    }
    if input.actions.is_empty() {
        return Err(crate::error::MpError::Other("Mindestens eine Aktion ist nötig".into()));
    }

    let rule = FilterRule {
        id: input.id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        name,
        conditions: input.conditions,
        match_all: input.match_all,
        actions: input.actions,
        enabled: input.enabled,
        confirmed_by_user: true,
        ai_suggested: false,
        created_at: chrono::Utc::now(),
    };
    queries::upsert_rule(&state.pool, &rule).await?;
    Ok(rule)
}

#[tauri::command]
pub async fn set_rule_enabled(
    state: State<'_, AppState>,
    rule_id: String,
    enabled: bool,
) -> MpResult<()> {
    queries::set_rule_enabled(&state.pool, &rule_id, enabled)
        .await
        .map_err(Into::into)
}

#[tauri::command]
pub async fn delete_rule(state: State<'_, AppState>, rule_id: String) -> MpResult<()> {
    queries::delete_rule(&state.pool, &rule_id).await.map_err(Into::into)
}

/// Runs the enabled rules over every stored email and queues the resulting moves.
///
/// Nothing is carried out here. Matches become pending actions that the user
/// confirms in the organize view, the same path the AI proposals take, so a
/// broadly written rule cannot reshuffle a mailbox on its own.
#[tauri::command]
pub async fn run_rules(state: State<'_, AppState>) -> MpResult<u32> {
    let all_rules = queries::list_rules(&state.pool).await?;
    let active: Vec<FilterRule> = all_rules.into_iter().filter(|r| r.enabled).collect();
    if active.is_empty() {
        return Ok(0);
    }

    // Emails that already have a queued or carried-out action are left alone,
    // so running the rules twice does not stack duplicate moves on one message.
    let existing: std::collections::HashSet<String> =
        sqlx::query!("SELECT DISTINCT email_id FROM organize_actions")
            .fetch_all(&state.pool)
            .await?
            .into_iter()
            .map(|r| r.email_id)
            .collect();

    // Read in batches instead of one large query: a long-running mailbox can
    // hold tens of thousands of messages and there is no reason to hold them
    // all in memory at once.
    const BATCH: u32 = 500;
    let mut offset = 0u32;
    let mut created = 0u32;
    loop {
        let batch: Vec<EmailEntry> =
            queries::list_emails(&state.pool, None, None, BATCH, offset).await?;
        if batch.is_empty() {
            break;
        }
        let fetched = batch.len() as u32;

        for email in batch.iter().filter(|e| !existing.contains(&e.id)) {
            // Only the first matching rule counts. Two rules wanting the same
            // message in different folders would otherwise queue two moves, and
            // the second would fail once the first has moved it away.
            if let Some(action) = rules::actions_for_email(&active, email).into_iter().next() {
                queries::insert_action(&state.pool, &action).await?;
                created += 1;
            }
        }

        if fetched < BATCH {
            break;
        }
        offset += BATCH;
    }
    Ok(created)
}
