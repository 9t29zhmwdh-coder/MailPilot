pub mod claude;
pub mod ollama;
pub mod prompts;

use anyhow::Result;
use async_trait::async_trait;
use crate::models::classification::Classification;

#[async_trait]
pub trait AiBackend: Send + Sync {
    async fn classify_email(&self, context: &str) -> Result<Classification>;
    async fn summarize(&self, body: &str) -> Result<String>;
    async fn suggest_reply(&self, context: &str) -> Result<String>;
    async fn is_available(&self) -> bool;
}
