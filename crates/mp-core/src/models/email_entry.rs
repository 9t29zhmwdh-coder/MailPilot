use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::models::classification::Classification;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAddress {
    pub name: Option<String>,
    pub address: String,
}

impl EmailAddress {
    pub fn display(&self) -> String {
        match &self.name {
            Some(n) if !n.is_empty() => format!("{} <{}>", n, self.address),
            _ => self.address.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub filename: String,
    pub mime_type: String,
    pub size: u64,
    pub content_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EmailKind {
    Plain,
    Html,
    Multipart,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailEntry {
    pub id: String,
    pub account_id: String,
    pub message_id: String,
    pub uid: u32,
    pub mailbox: String,
    pub subject: String,
    pub from: EmailAddress,
    pub to: Vec<EmailAddress>,
    pub cc: Vec<EmailAddress>,
    pub date: DateTime<Utc>,
    pub body_text: Option<String>,
    pub body_html: Option<String>,
    pub attachments: Vec<Attachment>,
    pub kind: EmailKind,
    pub in_reply_to: Option<String>,
    pub references: Vec<String>,
    pub is_read: bool,
    pub is_flagged: bool,
    pub size: u64,
    pub hash: Option<String>,
    pub thread_id: Option<String>,
    pub classification: Option<Classification>,
    pub fetched_at: DateTime<Utc>,
}

impl EmailEntry {
    pub fn body_preview(&self, max_len: usize) -> String {
        let text = self.body_text.as_deref().unwrap_or("");
        let trimmed = text.trim();
        if trimmed.len() <= max_len {
            trimmed.to_string()
        } else {
            format!("{}…", &trimmed[..max_len])
        }
    }
}
