use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Protocol {
    Imap,
    Pop3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailAccount {
    pub id: String,
    pub label: String,
    pub email_address: String,
    pub imap_host: String,
    pub imap_port: u16,
    pub protocol: Protocol,
    pub username: String,
    pub use_tls: bool,
    pub mailboxes: Vec<String>,
    pub last_sync: Option<chrono::DateTime<chrono::Utc>>,
    pub enabled: bool,
}

impl EmailAccount {
    pub fn new_gmail(label: &str, email: &str, username: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            label: label.to_string(),
            email_address: email.to_string(),
            imap_host: "imap.gmail.com".to_string(),
            imap_port: 993,
            protocol: Protocol::Imap,
            username: username.to_string(),
            use_tls: true,
            mailboxes: vec!["INBOX".to_string()],
            last_sync: None,
            enabled: true,
        }
    }

    pub fn new_outlook(label: &str, email: &str, username: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            label: label.to_string(),
            email_address: email.to_string(),
            imap_host: "outlook.office365.com".to_string(),
            imap_port: 993,
            protocol: Protocol::Imap,
            username: username.to_string(),
            use_tls: true,
            mailboxes: vec!["INBOX".to_string()],
            last_sync: None,
            enabled: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub ollama_url: String,
    pub text_model: String,
    pub vision_model: String,
    pub auto_classify: bool,
    pub auto_sync: bool,
    pub sync_interval_minutes: u32,
    pub default_view: String,
    pub review_before_delete: bool,
    pub max_emails_per_sync: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            ollama_url: "http://localhost:11434".to_string(),
            text_model: "llama3".to_string(),
            vision_model: "llava".to_string(),
            auto_classify: true,
            auto_sync: false,
            sync_interval_minutes: 30,
            default_view: "today".to_string(),
            review_before_delete: true,
            max_emails_per_sync: 500,
        }
    }
}
