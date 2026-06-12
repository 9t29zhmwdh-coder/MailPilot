use chrono::{DateTime, NaiveDate, Utc};
use once_cell::sync::Lazy;
use regex::Regex;

static RE_DATE_WORDS: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*(\d{4})").unwrap()
});

static RE_TIME: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"\b(\d{1,2}):(\d{2})\s*(?:Uhr|h|AM|PM)?\b").unwrap()
});

static RE_LOCATION: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:ort|location|venue|adresse|address|raum|room)[:\s]+([^\n\r,]{5,60})").unwrap()
});

pub fn extract_event_date(text: &str) -> Option<NaiveDate> {
    if let Some(cap) = RE_DATE_WORDS.captures(text) {
        let day: u32 = cap[1].parse().ok()?;
        let month = month_from_name(&cap[2])?;
        let year: i32 = cap[3].parse().ok()?;
        return NaiveDate::from_ymd_opt(year, month, day);
    }
    None
}

pub fn extract_location(text: &str) -> Option<String> {
    RE_LOCATION.captures(text)
        .map(|c| c[1].trim().to_string())
}

fn month_from_name(name: &str) -> Option<u32> {
    match name.to_lowercase().as_str() {
        "januar" | "jan"       => Some(1),
        "februar" | "feb"      => Some(2),
        "märz" | "mar"         => Some(3),
        "april" | "apr"        => Some(4),
        "mai"                  => Some(5),
        "juni" | "jun"         => Some(6),
        "juli" | "jul"         => Some(7),
        "august" | "aug"       => Some(8),
        "september" | "sep"    => Some(9),
        "oktober" | "oct"      => Some(10),
        "november" | "nov"     => Some(11),
        "dezember" | "dec"     => Some(12),
        _                      => None,
    }
}
