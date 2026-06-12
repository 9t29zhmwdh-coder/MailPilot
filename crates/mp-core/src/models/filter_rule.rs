use serde::{Deserialize, Serialize};
use crate::models::classification::EmailCategory;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleCondition {
    FromContains(String),
    SubjectContains(String),
    BodyContains(String),
    HasAttachment,
    SenderDomain(String),
    HasCategory(EmailCategory),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RuleAction {
    MoveToFolder(String),
    AddTag(String),
    MarkRead,
    MarkSpam,
    SetCategory(EmailCategory),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterRule {
    pub id: String,
    pub name: String,
    pub conditions: Vec<RuleCondition>,
    pub match_all: bool,
    pub actions: Vec<RuleAction>,
    pub enabled: bool,
    pub confirmed_by_user: bool,
    pub ai_suggested: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
