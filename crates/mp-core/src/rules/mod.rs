//! Evaluation of user-defined filter rules.
//!
//! Rules never touch the server themselves. A matching rule produces an
//! `OrganizeAction` in `Pending` state, which then goes through the same
//! confirmation the AI proposals do. That keeps a single place where anything
//! is actually carried out, so a mistyped rule cannot empty a mailbox.

use crate::models::{
    action::OrganizeAction,
    email_entry::EmailEntry,
    filter_rule::{FilterRule, RuleAction, RuleCondition},
};

/// Checks one condition against one email.
///
/// Text comparisons are case-insensitive: a rule written as "Rechnung" should
/// also catch "rechnung" in a subject line, and nobody writing a mail filter
/// expects otherwise.
pub fn condition_matches(condition: &RuleCondition, email: &EmailEntry) -> bool {
    match condition {
        RuleCondition::FromContains(needle) => {
            let n = needle.to_lowercase();
            email.from.address.to_lowercase().contains(&n)
                || email
                    .from
                    .name
                    .as_deref()
                    .is_some_and(|name| name.to_lowercase().contains(&n))
        }
        RuleCondition::SubjectContains(needle) => {
            email.subject.to_lowercase().contains(&needle.to_lowercase())
        }
        RuleCondition::BodyContains(needle) => email
            .body_text
            .as_deref()
            .is_some_and(|body| body.to_lowercase().contains(&needle.to_lowercase())),
        RuleCondition::HasAttachment => !email.attachments.is_empty(),
        RuleCondition::SenderDomain(domain) => {
            // Compare the part after '@' so a rule for "example.com" does not
            // also match a sender at "example.com.attacker.net".
            let want = domain.trim_start_matches('@').to_lowercase();
            email
                .from
                .address
                .rsplit_once('@')
                .is_some_and(|(_, host)| host.to_lowercase() == want)
        }
        RuleCondition::HasCategory(category) => email
            .classification
            .as_ref()
            .is_some_and(|c| &c.category == category),
    }
}

/// Decides whether a rule applies to an email.
///
/// A rule without conditions never matches. Treating it as "matches everything"
/// would turn a half-finished rule into a mailbox-wide action.
pub fn rule_matches(rule: &FilterRule, email: &EmailEntry) -> bool {
    if !rule.enabled || rule.conditions.is_empty() {
        return false;
    }
    if rule.match_all {
        rule.conditions.iter().all(|c| condition_matches(c, email))
    } else {
        rule.conditions.iter().any(|c| condition_matches(c, email))
    }
}

/// Turns the matching rules into pending actions for one email.
///
/// Only folder moves become actions. Tagging, read state and category changes
/// are local concepts that the organize pipeline does not carry out on the
/// server, so producing actions for them would promise something it cannot do.
pub fn actions_for_email(rules: &[FilterRule], email: &EmailEntry) -> Vec<OrganizeAction> {
    let mut out = Vec::new();
    for rule in rules.iter().filter(|r| rule_matches(r, email)) {
        for action in &rule.actions {
            if let RuleAction::MoveToFolder(folder) = action {
                out.push(OrganizeAction::move_to(
                    &email.id,
                    &email.subject,
                    &email.from.address,
                    folder,
                    &format!("Regel: {}", rule.name),
                ));
            }
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{
        classification::{Classification, EmailCategory},
        email_entry::{EmailAddress, EmailEntry, EmailKind},
    };
    use chrono::Utc;

    fn email(from: &str, subject: &str, body: &str) -> EmailEntry {
        EmailEntry {
            id: "e1".into(),
            account_id: "a1".into(),
            message_id: "m1".into(),
            uid: 1,
            mailbox: "INBOX".into(),
            subject: subject.into(),
            from: EmailAddress { name: Some("Sender".into()), address: from.into() },
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
            size: 0,
            hash: None,
            thread_id: None,
            classification: None,
            fetched_at: Utc::now(),
        }
    }

    fn classification(category: EmailCategory) -> Classification {
        Classification {
            category,
            confidence: 0.9,
            tags: vec![],
            summary: None,
            extracted_amount: None,
            extracted_currency: None,
            extracted_due_date: None,
            extracted_event_date: None,
            extracted_sender_name: None,
            tracking_number: None,
            tracking_carrier: None,
            is_subscription: false,
            subscription_service: None,
            renewal_date: None,
            cancel_link: None,
            phishing_score: 0.0,
            phishing_reasons: vec![],
            follow_up_hint: None,
            reply_suggestion: None,
            classified_by: "test".into(),
        }
    }

    fn rule(conditions: Vec<RuleCondition>, match_all: bool) -> FilterRule {
        FilterRule {
            id: "r1".into(),
            name: "Test".into(),
            conditions,
            match_all,
            actions: vec![RuleAction::MoveToFolder("Ziel".into())],
            enabled: true,
            confirmed_by_user: true,
            ai_suggested: false,
            created_at: Utc::now(),
        }
    }

    #[test]
    fn text_conditions_ignore_case() {
        let e = email("Boss@Example.COM", "Die RECHNUNG kommt", "Betrag faellig");
        assert!(condition_matches(&RuleCondition::FromContains("boss".into()), &e));
        assert!(condition_matches(&RuleCondition::SubjectContains("rechnung".into()), &e));
        assert!(condition_matches(&RuleCondition::BodyContains("BETRAG".into()), &e));
    }

    #[test]
    fn from_contains_also_searches_the_display_name() {
        let e = email("x@y.z", "s", "b");
        assert!(condition_matches(&RuleCondition::FromContains("sender".into()), &e));
    }

    #[test]
    fn sender_domain_matches_the_whole_host_only() {
        let legit = email("a@example.com", "s", "b");
        let lookalike = email("a@example.com.attacker.net", "s", "b");
        let cond = RuleCondition::SenderDomain("example.com".into());
        assert!(condition_matches(&cond, &legit));
        assert!(
            !condition_matches(&cond, &lookalike),
            "ein Suffix darf nicht als Domain durchgehen"
        );
    }

    #[test]
    fn match_all_requires_every_condition() {
        let e = email("a@example.com", "Rechnung", "text");
        let conds = vec![
            RuleCondition::SubjectContains("Rechnung".into()),
            RuleCondition::SubjectContains("Mahnung".into()),
        ];
        assert!(!rule_matches(&rule(conds.clone(), true), &e));
        assert!(rule_matches(&rule(conds, false), &e));
    }

    #[test]
    fn a_rule_without_conditions_never_matches() {
        let e = email("a@example.com", "irgendwas", "text");
        assert!(!rule_matches(&rule(vec![], false), &e));
        assert!(!rule_matches(&rule(vec![], true), &e));
    }

    #[test]
    fn disabled_rules_are_ignored() {
        let e = email("a@example.com", "Rechnung", "text");
        let mut r = rule(vec![RuleCondition::SubjectContains("Rechnung".into())], false);
        r.enabled = false;
        assert!(!rule_matches(&r, &e));
    }

    #[test]
    fn category_condition_reads_the_classification() {
        let mut e = email("a@example.com", "s", "b");
        let cond = RuleCondition::HasCategory(EmailCategory::Invoice);
        assert!(!condition_matches(&cond, &e), "ohne Klassifizierung kein Treffer");

        e.classification = Some(classification(EmailCategory::Invoice));
        assert!(condition_matches(&cond, &e));

        e.classification = Some(classification(EmailCategory::Newsletter));
        assert!(!condition_matches(&cond, &e));
    }

    #[test]
    fn body_condition_handles_a_missing_body() {
        let mut e = email("a@example.com", "s", "b");
        e.body_text = None;
        assert!(!condition_matches(&RuleCondition::BodyContains("b".into()), &e));
    }

    #[test]
    fn only_folder_moves_become_actions() {
        let e = email("a@example.com", "Rechnung", "text");
        let mut r = rule(vec![RuleCondition::SubjectContains("Rechnung".into())], false);
        r.actions = vec![
            RuleAction::MoveToFolder("Rechnungen".into()),
            RuleAction::MarkRead,
            RuleAction::AddTag("wichtig".into()),
        ];
        let actions = actions_for_email(&[r], &e);
        assert_eq!(actions.len(), 1);
        assert_eq!(actions[0].target_folder.as_deref(), Some("Rechnungen"));
        assert!(actions[0].reason.contains("Regel"));
    }
}
