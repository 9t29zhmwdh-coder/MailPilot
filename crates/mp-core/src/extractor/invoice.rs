use chrono::NaiveDate;
use once_cell::sync::Lazy;
use regex::Regex;

static RE_AMOUNT: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(CHF|EUR|USD|€|\$)\s*([\d'.,]+)|([\d'.,]+)\s*(CHF|EUR|USD|€|\$)").unwrap()
});

static RE_DATE: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})").unwrap()
});

static RE_CURRENCY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)\b(CHF|EUR|USD|GBP)\b|[€$£]").unwrap()
});

pub fn extract_amount(text: &str) -> Option<f64> {
    RE_AMOUNT.captures(text).and_then(|cap| {
        let amount_str = cap.get(2).or_else(|| cap.get(3))?.as_str();
        let cleaned = amount_str.replace('\'', "").replace(',', ".");
        cleaned.parse::<f64>().ok()
    })
}

pub fn extract_currency(text: &str) -> Option<String> {
    RE_CURRENCY.find(text).map(|m| {
        match m.as_str() {
            "€" => "EUR".to_string(),
            "$" => "USD".to_string(),
            "£" => "GBP".to_string(),
            s => s.to_uppercase(),
        }
    })
}

pub fn extract_date(text: &str) -> Option<NaiveDate> {
    RE_DATE.captures(text).and_then(|cap| {
        let d: u32 = cap[1].parse().ok()?;
        let m: u32 = cap[2].parse().ok()?;
        let y_raw: i32 = cap[3].parse().ok()?;
        let y = if y_raw < 100 { 2000 + y_raw } else { y_raw };
        NaiveDate::from_ymd_opt(y, m, d)
    })
}

pub fn extract_invoice_number(text: &str) -> Option<String> {
    static RE: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"(?i)(rechnungs(?:nummer|nr\.?|number)[:\s#]*([A-Z0-9\-/]+))|(invoice\s*(?:no\.?|#|number)[:\s]*([A-Z0-9\-/]+))").unwrap()
    });
    RE.captures(text).and_then(|c| {
        c.get(2).or_else(|| c.get(4)).map(|m| m.as_str().trim().to_string())
    })
}
