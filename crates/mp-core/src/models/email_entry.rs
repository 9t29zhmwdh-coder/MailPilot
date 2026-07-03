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

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn make_entry(body: &str) -> EmailEntry {
        EmailEntry {
            id: "1".into(),
            account_id: "acc".into(),
            message_id: "<1@test>".into(),
            uid: 1,
            mailbox: "INBOX".into(),
            subject: "Test".into(),
            from: EmailAddress { name: None, address: "a@b.com".into() },
            to: vec![],
            cc: vec![],
            date: Utc::now(),
            body_text: Some(body.into()),
            body_html: None,
            attachments: vec![],
            kind: EmailKind::Plain,
            in_reply_to: None,
            references: vec![],
            is_read: false,
            is_flagged: false,
            size: body.len() as u64,
            hash: None,
            thread_id: None,
            classification: None,
            fetched_at: Utc::now(),
        }
    }

    #[test]
    fn email_address_display_with_name() {
        let addr = EmailAddress { name: Some("Rafael".into()), address: "r@example.com".into() };
        assert_eq!(addr.display(), "Rafael <r@example.com>");
    }

    #[test]
    fn email_address_display_without_name() {
        let addr = EmailAddress { name: None, address: "r@example.com".into() };
        assert_eq!(addr.display(), "r@example.com");
    }

    #[test]
    fn email_address_display_empty_name_falls_back_to_address() {
        let addr = EmailAddress { name: Some("".into()), address: "r@example.com".into() };
        assert_eq!(addr.display(), "r@example.com");
    }

    #[test]
    fn body_preview_short_text_returns_full() {
        let entry = make_entry("Hello World");
        assert_eq!(entry.body_preview(100), "Hello World");
    }

    #[test]
    fn body_preview_truncates_long_text_with_ellipsis() {
        let entry = make_entry("Hello World this is a long email body");
        let preview = entry.body_preview(10);
        assert!(preview.ends_with('…'), "Expected ellipsis at end");
        assert!(preview.len() < 20);
    }

    #[test]
    fn body_preview_empty_body_returns_empty() {
        let mut entry = make_entry("");
        entry.body_text = None;
        assert_eq!(entry.body_preview(100), "");
    }
}
