use std::collections::HashMap;
use uuid::Uuid;
use crate::models::email_entry::EmailEntry;

pub fn assign_thread_ids(emails: &mut Vec<EmailEntry>) {
    let mut threads: HashMap<String, String> = HashMap::new();

    emails.sort_by_key(|e| e.date);

    for email in emails.iter_mut() {
        let thread_key = if let Some(ref irt) = email.in_reply_to {
            if let Some(tid) = threads.get(irt) {
                tid.clone()
            } else {
                email.message_id.clone()
            }
        } else {
            subject_base(&email.subject)
        };

        let thread_id = threads
            .entry(thread_key.clone())
            .or_insert_with(|| Uuid::new_v4().to_string())
            .clone();

        email.thread_id = Some(thread_id.clone());
        threads.insert(email.message_id.clone(), thread_id);
    }
}

pub fn detect_duplicate_subjects(emails: &[EmailEntry]) -> Vec<Vec<String>> {
    let mut groups: HashMap<String, Vec<String>> = HashMap::new();
    for e in emails {
        let key = format!("{}_{}", e.from.address.to_lowercase(), subject_base(&e.subject));
        groups.entry(key).or_default().push(e.id.clone());
    }
    groups.into_values().filter(|ids| ids.len() > 1).collect()
}

fn subject_base(subject: &str) -> String {
    let s = subject.to_lowercase();
    let stripped = s
        .trim_start_matches("re: ")
        .trim_start_matches("aw: ")
        .trim_start_matches("fwd: ")
        .trim_start_matches("wg: ")
        .trim();
    stripped.to_string()
}
