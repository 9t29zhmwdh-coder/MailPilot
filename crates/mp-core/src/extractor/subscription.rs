use once_cell::sync::Lazy;
use regex::Regex;

static RE_UNSUBSCRIBE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r#"(?i)(?:href|url)[="\s]+(https?://[^\s"'<>]+(?:unsubscribe|abmelden|optout|opt-out)[^\s"'<>]*)"#).unwrap()
});

static RE_LIST_UNSUBSCRIBE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)list-unsubscribe[:\s]*<(https?://[^>]+)>").unwrap()
});

pub fn find_cancel_link(text: &str) -> Option<String> {
    if let Some(cap) = RE_LIST_UNSUBSCRIBE.captures(text) {
        return Some(cap[1].to_string());
    }
    if let Some(cap) = RE_UNSUBSCRIBE.captures(text) {
        return Some(cap[1].to_string());
    }
    None
}

pub fn detect_service_name(from_name: Option<&str>, domain: &str) -> String {
    if let Some(name) = from_name {
        if !name.is_empty() && name.len() < 40 {
            return name.to_string();
        }
    }
    domain
        .trim_start_matches("mail.")
        .trim_start_matches("newsletter.")
        .trim_start_matches("noreply.")
        .trim_start_matches("no-reply.")
        .split('.')
        .next()
        .map(|s| {
            let mut c = s.chars();
            match c.next() {
                None => String::new(),
                Some(f) => f.to_uppercase().collect::<String>() + c.as_str(),
            }
        })
        .unwrap_or_else(|| domain.to_string())
}
