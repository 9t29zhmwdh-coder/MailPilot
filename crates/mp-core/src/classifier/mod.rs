pub mod rules;
pub mod thread;

use crate::models::{
    classification::{Classification, EmailCategory},
    email_entry::EmailEntry,
};
use crate::extractor;
use crate::ai::AiBackend;

pub struct ClassifierEngine {
    pub ai: Option<Box<dyn AiBackend>>,
}

impl ClassifierEngine {
    pub fn new(ai: Option<Box<dyn AiBackend>>) -> Self {
        Self { ai }
    }

    pub async fn classify(&self, entry: &EmailEntry) -> Classification {
        let text = build_classification_context(entry);
        let rule_result = rules::classify_by_rules(entry);

        if rule_result.confidence >= 0.85 {
            return rule_result;
        }

        if let Some(ai) = &self.ai {
            if ai.is_available().await {
                if let Ok(ai_result) = ai.classify_email(&text).await {
                    return ai_result;
                }
            }
        }

        rule_result
    }
}

fn build_classification_context(entry: &EmailEntry) -> String {
    format!(
        "From: {}\nSubject: {}\nBody: {}",
        entry.from.display(),
        entry.subject,
        entry.body_preview(800),
    )
}

fn build_preview(entry: &EmailEntry) -> String {
    entry.body_text
        .as_deref()
        .unwrap_or("")
        .chars()
        .take(800)
        .collect()
}

trait BodyPreview {
    fn body_preview(&self, n: usize) -> String;
}

impl BodyPreview for EmailEntry {
    fn body_preview(&self, n: usize) -> String {
        self.body_text
            .as_deref()
            .unwrap_or("")
            .chars()
            .take(n)
            .collect()
    }
}
