use serde::Serialize;
use std::collections::HashMap;
use tauri::State;
use crate::{error::MpResult, state::AppState};

#[derive(Debug, Serialize)]
pub struct EmailStats {
    pub total_emails: i64,
    pub unread_count: i64,
    pub classified_count: i64,
    pub accounts_count: i64,
    pub by_category: HashMap<String, i64>,
    pub invoices_total: f64,
    pub packages_count: i64,
    pub phishing_count: i64,
    pub subscriptions_count: i64,
    pub follow_up_count: i64,
}

#[tauri::command]
pub async fn get_stats(state: State<'_, AppState>) -> MpResult<EmailStats> {
    let total = sqlx::query_scalar!("SELECT COUNT(*) FROM emails")
        .fetch_one(&state.pool)
        .await?;
    let unread = sqlx::query_scalar!("SELECT COUNT(*) FROM emails WHERE is_read = 0")
        .fetch_one(&state.pool)
        .await?;
    let classified = sqlx::query_scalar!("SELECT COUNT(*) FROM emails WHERE classification_json IS NOT NULL")
        .fetch_one(&state.pool)
        .await?;
    let accounts = sqlx::query_scalar!("SELECT COUNT(*) FROM email_accounts WHERE enabled = 1")
        .fetch_one(&state.pool)
        .await?;

    let category_rows = sqlx::query!(
        "SELECT json_extract(classification_json, '$.category') as cat, COUNT(*) as cnt
         FROM emails WHERE classification_json IS NOT NULL
         GROUP BY cat ORDER BY cnt DESC"
    )
    .fetch_all(&state.pool)
    .await?;

    let mut by_category = HashMap::new();
    for row in category_rows {
        if let Some(cat) = row.cat {
            by_category.insert(cat, row.cnt);
        }
    }

    let phishing = *by_category.get("Phishing").unwrap_or(&0);
    let subscriptions = *by_category.get("Subscription").unwrap_or(&0);
    let packages = *by_category.get("Package").unwrap_or(&0);
    let follow_up = *by_category.get("FollowUp").unwrap_or(&0);

    Ok(EmailStats {
        total_emails: total,
        unread_count: unread,
        classified_count: classified,
        accounts_count: accounts,
        by_category,
        invoices_total: 0.0,
        packages_count: packages,
        phishing_count: phishing,
        subscriptions_count: subscriptions,
        follow_up_count: follow_up,
    })
}
