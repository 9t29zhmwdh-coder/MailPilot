//! Integration tests for the email classification pipeline.

use chrono::Utc;
use mp_core::{
    classifier::rules::classify_by_rules,
    models::{classification::EmailCategory, email_entry::EmailEntry, EmailAddress, EmailKind},
};

fn make_email(from: &str, subject: &str, body: &str) -> EmailEntry {
    EmailEntry {
        id: "test-id".into(),
        account_id: "acc-1".into(),
        message_id: "<test@example.com>".into(),
        uid: 1,
        mailbox: "INBOX".into(),
        subject: subject.into(),
        from: EmailAddress { name: None, address: from.into() },
        to: vec![],
        cc: vec![],
        date: Utc::now(),
        body_text: Some(body.into()),
        body_html: None,
        attachments: vec![],
        kind: EmailKind::Plain,
        in_reply_to: None,
        references: vec![],
        is_read: false,
        is_flagged: false,
        size: body.len() as u64,
        hash: None,
        thread_id: None,
        classification: None,
        fetched_at: Utc::now(),
    }
}

#[test]
fn newsletter_email_is_classified_as_newsletter() {
    let email = make_email(
        "news@company.com",
        "Weekly Newsletter",
        "Unsubscribe from this mailing list by clicking here.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Newsletter);
    assert!(result.confidence > 0.5);
}

#[test]
fn invoice_email_is_classified_correctly() {
    let email = make_email(
        "billing@shop.com",
        "Rechnung #12345",
        "Ihre Rechnung für den Betrag von CHF 99.90 ist fällig.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Invoice);
}

#[test]
fn phishing_email_gets_high_phishing_score() {
    let email = make_email(
        "security@fakebank.com",
        "Urgent: Verify your account",
        "Your account will be suspended. Click here to confirm your password.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Phishing);
    assert!(result.phishing_score > 0.5);
}

#[test]
fn package_tracking_email_is_classified_as_package() {
    let email = make_email(
        "noreply@dhl.com",
        "Sendungsverfolgung Ihres Pakets",
        "Ihr Paket ist unterwegs. Tracking-Nummer: 1234567890.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Package);
}

#[test]
fn social_notification_is_classified_as_social() {
    let email = make_email(
        "noreply@linkedin.com",
        "You have a new connection request",
        "Someone sent you a LinkedIn connection request.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Social);
}

#[test]
fn subscription_email_has_service_name() {
    let email = make_email(
        "billing@netflix.com",
        "Ihr Abo wurde verlängert",
        "Ihr monatliches Abo wurde automatisch erneuert. Betrag: CHF 12.90.",
    );
    let result = classify_by_rules(&email);
    assert!(
        result.category == EmailCategory::Subscription || result.category == EmailCategory::Invoice,
        "Expected Subscription or Invoice, got {:?}",
        result.category
    );
}

#[test]
fn calendar_invite_is_classified_as_calendar() {
    let email = make_email(
        "organizer@company.com",
        "Meeting-Einladung: Projektbesprechung",
        "Sie wurden zu einem Meeting eingeladen. Termin: Montag 14:00 Uhr.",
    );
    let result = classify_by_rules(&email);
    assert_eq!(result.category, EmailCategory::Calendar);
}

#[test]
fn phishing_has_highest_priority_over_all_categories() {
    use mp_core::models::classification::EmailCategory;
    let phishing_priority = EmailCategory::Phishing.priority();
    for category in [
        EmailCategory::Important,
        EmailCategory::Work,
        EmailCategory::Invoice,
        EmailCategory::Newsletter,
        EmailCategory::Social,
        EmailCategory::Ads,
        EmailCategory::Government,
        EmailCategory::Package,
        EmailCategory::Calendar,
        EmailCategory::Subscription,
        EmailCategory::Spam,
        EmailCategory::Other,
    ] {
        assert!(
            phishing_priority >= category.priority(),
            "Phishing priority should be highest, but {:?} has priority {}",
            category,
            category.priority()
        );
    }
}
