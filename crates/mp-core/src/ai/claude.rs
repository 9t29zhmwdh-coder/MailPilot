use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::models::classification::{Classification, EmailCategory};
use super::{AiBackend, prompts};

const API_URL: &str = "https://api.anthropic.com/v1/messages";
const API_VERSION: &str = "2023-06-01";

/// Cloud-LLM-Backend gegen die Anthropic Messages API (raw HTTP, kein offizielles Rust-SDK).
pub struct ClaudeBackend {
    api_key: String,
    model: String,
    client: Client,
}

impl ClaudeBackend {
    pub fn new(api_key: &str, model: &str) -> Self {
        Self {
            api_key: api_key.to_string(),
            model: model.to_string(),
            client: Client::new(),
        }
    }

    /// Ein einzelner Messages-API-Call; gibt den Text des ersten Content-Blocks zurück.
    async fn complete(&self, prompt: &str) -> Result<String> {
        #[derive(Serialize)]
        struct Msg<'a> {
            role: &'a str,
            content: &'a str,
        }
        #[derive(Serialize)]
        struct Req<'a> {
            model: &'a str,
            max_tokens: u32,
            messages: Vec<Msg<'a>>,
        }
        #[derive(Deserialize)]
        struct Block {
            #[serde(default)]
            text: String,
        }
        #[derive(Deserialize)]
        struct Resp {
            content: Vec<Block>,
        }

        let resp = self
            .client
            .post(API_URL)
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", API_VERSION)
            .json(&Req {
                model: &self.model,
                max_tokens: 1024,
                messages: vec![Msg { role: "user", content: prompt }],
            })
            .send()
            .await
            .context("Claude API request failed")?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            anyhow::bail!("Claude API error {}: {}", status, body);
        }

        let parsed: Resp = resp.json().await.context("Invalid JSON envelope from Claude")?;
        Ok(parsed
            .content
            .into_iter()
            .map(|b| b.text)
            .collect::<Vec<_>>()
            .join(""))
    }
}

#[async_trait]
impl AiBackend for ClaudeBackend {
    async fn classify_email(&self, context: &str) -> Result<Classification> {
        let prompt = format!(
            "{}{}\n\nReturn ONLY the JSON object, no prose, no markdown fences.",
            prompts::EMAIL_CLASSIFY, context
        );
        let raw = self.complete(&prompt).await?;
        let json = extract_json(&raw);
        let v: Value = serde_json::from_str(json).context("Invalid JSON from Claude")?;
        Ok(parse_classification(&v))
    }

    async fn summarize(&self, body: &str) -> Result<String> {
        let prompt = format!(
            "{}{}",
            prompts::EMAIL_SUMMARIZE,
            body.chars().take(2000).collect::<String>()
        );
        self.complete(&prompt).await
    }

    async fn suggest_reply(&self, context: &str) -> Result<String> {
        let prompt = format!("{}{}", prompts::REPLY_SUGGEST, context);
        self.complete(&prompt).await
    }

    async fn is_available(&self) -> bool {
        if self.api_key.is_empty() {
            return false;
        }
        self.client
            .get("https://api.anthropic.com/v1/models")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", API_VERSION)
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
    }
}

/// Loest JSON aus einer Antwort heraus, falls das Modell Markdown-Fences oder Prosa drumherum setzt.
fn extract_json(raw: &str) -> &str {
    let trimmed = raw.trim();
    let start = trimmed.find('{');
    let end = trimmed.rfind('}');
    match (start, end) {
        (Some(s), Some(e)) if e >= s => &trimmed[s..=e],
        _ => trimmed,
    }
}

fn parse_classification(v: &Value) -> Classification {
    let category = match v["category"].as_str().unwrap_or("Other") {
        "Important"    => EmailCategory::Important,
        "Work"         => EmailCategory::Work,
        "Private"      => EmailCategory::Private,
        "Invoice"      => EmailCategory::Invoice,
        "Newsletter"   => EmailCategory::Newsletter,
        "Social"       => EmailCategory::Social,
        "Ads"          => EmailCategory::Ads,
        "Government"   => EmailCategory::Government,
        "Package"      => EmailCategory::Package,
        "Calendar"     => EmailCategory::Calendar,
        "Subscription" => EmailCategory::Subscription,
        "Spam"         => EmailCategory::Spam,
        "Phishing"     => EmailCategory::Phishing,
        "FollowUp"     => EmailCategory::FollowUp,
        "Review"       => EmailCategory::Review,
        _              => EmailCategory::Other,
    };

    let tags = v["tags"].as_array()
        .map(|a| a.iter().filter_map(|t| t.as_str().map(|s| s.to_string())).collect())
        .unwrap_or_default();

    Classification {
        category,
        confidence: v["confidence"].as_f64().unwrap_or(0.5) as f32,
        tags,
        summary: v["summary"].as_str().map(|s| s.to_string()),
        extracted_amount: v["extracted_amount"].as_f64(),
        extracted_currency: v["extracted_currency"].as_str().map(|s| s.to_string()),
        extracted_due_date: None,
        extracted_event_date: None,
        extracted_sender_name: None,
        tracking_number: v["tracking_number"].as_str().map(|s| s.to_string()),
        tracking_carrier: None,
        is_subscription: v["is_subscription"].as_bool().unwrap_or(false),
        subscription_service: v["subscription_service"].as_str().map(|s| s.to_string()),
        renewal_date: None,
        cancel_link: None,
        phishing_score: v["phishing_score"].as_f64().unwrap_or(0.0) as f32,
        phishing_reasons: vec![],
        follow_up_hint: v["follow_up_hint"].as_str().map(|s| s.to_string()),
        reply_suggestion: v["reply_suggestion"].as_str().map(|s| s.to_string()),
        classified_by: "claude".to_string(),
    }
}
