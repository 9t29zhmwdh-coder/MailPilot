use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActionKind {
    MoveToFolder,
    AddTag,
    MarkRead,
    MarkSpam,
    MoveToReview,
    Delete,
    Flag,
    Unflag,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ActionStatus {
    Pending,
    Applied,
    Skipped,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrganizeAction {
    pub id: String,
    pub email_id: String,
    pub email_subject: String,
    pub from_address: String,
    pub kind: ActionKind,
    pub target_folder: Option<String>,
    pub tag: Option<String>,
    pub reason: String,
    pub status: ActionStatus,
    pub undoable: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl OrganizeAction {
    pub fn move_to(email_id: &str, subject: &str, from: &str, folder: &str, reason: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            email_id: email_id.to_string(),
            email_subject: subject.to_string(),
            from_address: from.to_string(),
            kind: ActionKind::MoveToFolder,
            target_folder: Some(folder.to_string()),
            tag: None,
            reason: reason.to_string(),
            status: ActionStatus::Pending,
            undoable: true,
            created_at: chrono::Utc::now(),
        }
    }

    pub fn review(email_id: &str, subject: &str, from: &str, reason: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            email_id: email_id.to_string(),
            email_subject: subject.to_string(),
            from_address: from.to_string(),
            kind: ActionKind::MoveToReview,
            target_folder: Some("Review".to_string()),
            tag: None,
            reason: reason.to_string(),
            status: ActionStatus::Pending,
            undoable: true,
            created_at: chrono::Utc::now(),
        }
    }
}
