use anyhow::{Context, Result};
use async_trait::async_trait;
use chrono::NaiveDate;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::models::classification::{Classification, EmailCategory};
use super::{AiBackend, prompts};

pub struct OllamaBackend {
    pub base_url: String,
    pub text_model: String,
    client: Client,
}

impl OllamaBackend {
    pub fn new(base_url: &str, text_model: &str) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            text_model: text_model.to_string(),
            client: Client::new(),
        }
    }

    async fn generate(&self, prompt: &str) -> Result<String> {
        #[derive(Serialize)]
        struct Req<'a> {
            model: &'a str,
            prompt: &'a str,
            stream: bool,
            format: &'a str,
        }
        #[derive(Deserialize)]
        struct Resp { response: String }

        let resp = self.client
            .post(format!("{}/api/generate", self.base_url))
            .json(&Req { model: &self.text_model, prompt, stream: false, format: "json" })
            .send()
            .await?
            .json::<Resp>()
            .await?;

        Ok(resp.response)
    }

    async fn generate_text(&self, prompt: &str) -> Result<String> {
        #[derive(Serialize)]
        struct Req<'a> {
            model: &'a str,
            prompt: &'a str,
            stream: bool,
        }
        #[derive(Deserialize)]
        struct Resp { response: String }

        let resp = self.client
            .post(format!("{}/api/generate", self.base_url))
            .json(&Req { model: &self.text_model, prompt, stream: false })
            .send()
            .await?
            .json::<Resp>()
            .await?;

        Ok(resp.response)
    }
}

#[async_trait]
impl AiBackend for OllamaBackend {
    async fn classify_email(&self, context: &str) -> Result<Classification> {
        let prompt = format!("{}{}", prompts::EMAIL_CLASSIFY, context);
        let raw = self.generate(&prompt).await?;
        let v: Value = serde_json::from_str(&raw).context("Invalid JSON from Ollama")?;
        Ok(parse_classification(&v))
    }

    async fn summarize(&self, body: &str) -> Result<String> {
        let prompt = format!("{}{}", prompts::EMAIL_SUMMARIZE, &body.chars().take(2000).collect::<String>());
        self.generate_text(&prompt).await
    }

    async fn suggest_reply(&self, context: &str) -> Result<String> {
        let prompt = format!("{}{}", prompts::REPLY_SUGGEST, context);
        self.generate_text(&prompt).await
    }

    async fn is_available(&self) -> bool {
        self.client
            .get(format!("{}/api/tags", self.base_url))
            .send()
            .await
            .map(|r| r.status().is_success())
            .unwrap_or(false)
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
        classified_by: "ollama".to_string(),
    }
}
