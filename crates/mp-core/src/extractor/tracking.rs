#![allow(dead_code)]
use once_cell::sync::Lazy;
use regex::Regex;

static RE_DHL: Lazy<Regex> = Lazy::new(|| Regex::new(r"\b(JD\d{20}|1Z[A-Z0-9]{16}|[0-9]{20})\b").unwrap());
static RE_POST: Lazy<Regex> = Lazy::new(|| Regex::new(r"\b(99\d{18}|[A-Z]{2}\d{9}[A-Z]{2})\b").unwrap());
static RE_FEDEX: Lazy<Regex> = Lazy::new(|| Regex::new(r"\b(\d{12}|\d{15}|\d{20})\b").unwrap());
static RE_GLS: Lazy<Regex> = Lazy::new(|| Regex::new(r"\b(\d{11})\b").unwrap());
static RE_GENERIC: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:tracking(?:\s*number|\s*nr\.?|[:\s#]*))([A-Z0-9]{10,30})").unwrap()
});

pub fn extract_tracking_number(text: &str) -> Option<String> {
    if let Some(cap) = RE_DHL.find(text) { return Some(cap.as_str().to_string()); }
    if let Some(cap) = RE_POST.find(text) { return Some(cap.as_str().to_string()); }
    if let Some(cap) = RE_GENERIC.captures(text) {
        return cap.get(1).map(|m| m.as_str().to_string());
    }
    None
}

pub fn detect_carrier(text: &str, domain: &str) -> Option<String> {
    let t = text.to_lowercase();
    let d = domain.to_lowercase();
    if t.contains("dhl") || d.contains("dhl") { return Some("DHL".to_string()); }
    if t.contains("fedex") || d.contains("fedex") { return Some("FedEx".to_string()); }
    if t.contains("ups ") || d.contains("ups.com") { return Some("UPS".to_string()); }
    if t.contains("post.ch") || d.contains("post.ch") { return Some("Swiss Post".to_string()); }
    if t.contains("hermes") || d.contains("hermesworld") { return Some("Hermes".to_string()); }
    if t.contains("gls-") || d.contains("gls-group") { return Some("GLS".to_string()); }
    if t.contains("dpd ") || d.contains("dpd.") { return Some("DPD".to_string()); }
    None
}
