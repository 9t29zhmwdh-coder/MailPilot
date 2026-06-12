use anyhow::Result;
use sqlx::SqlitePool;
use crate::models::email_entry::EmailEntry;
use crate::db::queries;

pub struct SearchQuery {
    pub text: String,
    pub account_id: Option<String>,
    pub category: Option<String>,
    pub has_attachment: Option<bool>,
    pub limit: u32,
    pub offset: u32,
}

impl Default for SearchQuery {
    fn default() -> Self {
        Self {
            text: String::new(),
            account_id: None,
            category: None,
            has_attachment: None,
            limit: 50,
            offset: 0,
        }
    }
}

pub async fn search(pool: &SqlitePool, query: &SearchQuery) -> Result<Vec<EmailEntry>> {
    queries::search_emails(pool, query).await
}
