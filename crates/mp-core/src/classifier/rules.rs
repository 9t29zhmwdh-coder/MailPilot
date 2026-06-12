use once_cell::sync::Lazy;
use regex::Regex;
use chrono::NaiveDate;

use crate::models::{
    classification::{Classification, EmailCategory},
    email_entry::EmailEntry,
};
use crate::extractor::{invoice, tracking, subscription};

static RE_INVOICE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(rechnung|invoice|faktura|billing|zahlungsaufforderung|betrag|amount due|total\s*:?\s*[\d.,]+\s*(chf|eur|usd|€|\$))").unwrap()
});

static RE_NEWSLETTER: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(unsubscribe|abmelden|newsletter|updates?|weekly digest|abonnement|list-unsubscribe)").unwrap()
});

static RE_SOCIAL: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(linkedin|twitter|facebook|instagram|xing|github notification|youtube|tiktok|reddit)").unwrap()
});

static RE_PACKAGE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(tracking|sendungsverfolgung|paket|shipment|delivery|versand|lieferung|dhl|ups|fedex|post|hermes|gls)").unwrap()
});

static RE_CALENDAR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(einladung|invitation|meeting|termin|appointment|calendar|ics|vcalendar|besprechung|veranstaltung)").unwrap()
});

static RE_GOVERNMENT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(behörde|gemeinde|kanton|steuer|steuererklärung|amtlich|bundesamt|sozialversicherung|krankenkasse|krankenkasse|aarau|zürich\.ch|admin\.ch|post\.ch|swisscom)").unwrap()
});

static RE_ADS: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(angebot|sale|rabatt|discount|% off|deal|promo|sonderangebot|jetzt kaufen|shop now|werbung|advertisement|sponsored)").unwrap()
});

static RE_PHISHING: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(verify your account|click here to confirm|your account (has been|will be) (suspended|blocked|locked)|urgent action required|password expired|update your payment|unusual sign.in activity|wire transfer|bitcoin|crypto.*urgent)").unwrap()
});

static RE_SUBSCRIPTION: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(your subscription|abo|monatlich|monthly|jährlich|annual|renewal|verlänger|automatisch erneuert|recurring|abo-bestätigung)").unwrap()
});

pub fn classify_by_rules(entry: &EmailEntry) -> Classification {
    let full_text = build_text(entry);
    let from_domain = extract_domain(&entry.from.address);

    let mut phishing_score = 0.0_f32;
    let mut phishing_reasons = Vec::new();

    if RE_PHISHING.is_match(&full_text) {
        phishing_score += 0.6;
        phishing_reasons.push("Phishing-typische Formulierungen erkannt".to_string());
    }
    if full_text.contains("http://") && !full_text.contains("https://") {
        phishing_score += 0.2;
        phishing_reasons.push("Unsichere HTTP-Links".to_string());
    }
    if entry.from.name.as_deref().unwrap_or("").is_empty() && entry.subject.to_lowercase().contains("urgent") {
        phishing_score += 0.2;
        phishing_reasons.push("Kein Absendername, dringliche Betreffzeile".to_string());
    }

    if phishing_score >= 0.6 {
        return make_result(EmailCategory::Phishing, phishing_score.min(0.95), &full_text, entry, phishing_reasons);
    }

    if RE_INVOICE.is_match(&full_text) {
        let amount = invoice::extract_amount(&full_text);
        let due_date = invoice::extract_date(&full_text);
        let mut result = make_result(EmailCategory::Invoice, 0.85, &full_text, entry, vec![]);
        result.extracted_amount = amount;
        result.extracted_due_date = due_date;
        return result;
    }

    if RE_PACKAGE.is_match(&full_text) {
        let tn = tracking::extract_tracking_number(&full_text);
        let carrier = tracking::detect_carrier(&full_text, &from_domain);
        let mut result = make_result(EmailCategory::Package, 0.80, &full_text, entry, vec![]);
        result.tracking_number = tn;
        result.tracking_carrier = carrier;
        return result;
    }

    if RE_CALENDAR.is_match(&full_text) || entry.attachments.iter().any(|a| a.filename.ends_with(".ics")) {
        return make_result(EmailCategory::Calendar, 0.82, &full_text, entry, vec![]);
    }

    if RE_SUBSCRIPTION.is_match(&full_text) {
        let cancel = subscription::find_cancel_link(&full_text);
        let mut result = make_result(EmailCategory::Subscription, 0.78, &full_text, entry, vec![]);
        result.is_subscription = true;
        result.cancel_link = cancel;
        return result;
    }

    if RE_GOVERNMENT.is_match(&full_text) || from_domain.ends_with(".ch") && from_domain.contains("admin") {
        return make_result(EmailCategory::Government, 0.75, &full_text, entry, vec![]);
    }

    if RE_SOCIAL.is_match(&full_text) || RE_SOCIAL.is_match(&from_domain) {
        return make_result(EmailCategory::Social, 0.80, &full_text, entry, vec![]);
    }

    if RE_ADS.is_match(&full_text) {
        return make_result(EmailCategory::Ads, 0.72, &full_text, entry, vec![]);
    }

    if RE_NEWSLETTER.is_match(&full_text) {
        return make_result(EmailCategory::Newsletter, 0.80, &full_text, entry, vec![]);
    }

    make_result(EmailCategory::Other, 0.30, &full_text, entry, vec![])
}

fn make_result(
    cat: EmailCategory,
    confidence: f32,
    text: &str,
    entry: &EmailEntry,
    phishing_reasons: Vec<String>,
) -> Classification {
    let phishing_score = if cat == EmailCategory::Phishing { confidence } else { 0.0 };
    Classification {
        category: cat,
        confidence,
        tags: extract_tags(text, entry),
        summary: None,
        extracted_amount: None,
        extracted_currency: invoice::extract_currency(text),
        extracted_due_date: None,
        extracted_event_date: None,
        extracted_sender_name: entry.from.name.clone(),
        tracking_number: None,
        tracking_carrier: None,
        is_subscription: false,
        subscription_service: None,
        renewal_date: None,
        cancel_link: None,
        phishing_score,
        phishing_reasons,
        follow_up_hint: None,
        reply_suggestion: None,
        classified_by: "rules".to_string(),
    }
}

fn build_text(entry: &EmailEntry) -> String {
    format!(
        "{} {} {}",
        entry.from.address,
        entry.subject,
        entry.body_text.as_deref().unwrap_or("").chars().take(1000).collect::<String>()
    )
}

fn extract_domain(email: &str) -> String {
    email.split('@').nth(1).unwrap_or("").to_lowercase()
}

fn extract_tags(text: &str, entry: &EmailEntry) -> Vec<String> {
    let mut tags = Vec::new();
    let tl = text.to_lowercase();
    if tl.contains("rechnung") || tl.contains("invoice") { tags.push("Rechnung".to_string()); }
    if tl.contains("abo") || tl.contains("subscription") { tags.push("Abo".to_string()); }
    if tl.contains("versicherung") || tl.contains("insurance") { tags.push("Versicherung".to_string()); }
    if tl.contains("reise") || tl.contains("travel") || tl.contains("flug") || tl.contains("hotel") { tags.push("Reise".to_string()); }
    if tl.contains("paket") || tl.contains("tracking") || tl.contains("lieferung") { tags.push("Paket".to_string()); }
    if !entry.attachments.is_empty() { tags.push("Anhang".to_string()); }
    tags
}
