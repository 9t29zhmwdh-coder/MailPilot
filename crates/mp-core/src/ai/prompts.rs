pub const EMAIL_CLASSIFY: &str = r#"
You are an email classifier. Analyze the following email context and return JSON only.

Respond with exactly this JSON structure:
{
  "category": "Important|Work|Private|Invoice|Newsletter|Social|Ads|Government|Package|Calendar|Subscription|Spam|Phishing|FollowUp|Review|Other",
  "confidence": 0.0-1.0,
  "tags": ["tag1", "tag2"],
  "summary": "one sentence summary",
  "extracted_amount": null or number,
  "extracted_currency": null or "CHF"|"EUR"|"USD",
  "tracking_number": null or "string",
  "is_subscription": true|false,
  "subscription_service": null or "ServiceName",
  "phishing_score": 0.0-1.0,
  "follow_up_hint": null or "hint text",
  "reply_suggestion": null or "suggested reply"
}

Email context:
"#;

pub const EMAIL_SUMMARIZE: &str = r#"
Summarize the following email in 1-2 sentences in the same language as the email. Be concise and focus on action items.

Email:
"#;

pub const REPLY_SUGGEST: &str = r#"
Suggest a short, polite reply to the following email. Use the same language as the email. Keep it professional and under 3 sentences.

Email context:
"#;

pub const FILTER_RULE_SUGGEST: &str = r#"
Based on these email classifications, suggest filter rules. Return JSON array:
[{
  "name": "rule name",
  "condition_from_contains": null or "string",
  "condition_subject_contains": null or "string",
  "action": "MoveToFolder|AddTag|MarkRead|MarkSpam",
  "target": "folder name or tag"
}]

Emails:
"#;
