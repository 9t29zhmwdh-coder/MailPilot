use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum EmailCategory {
    Important,
    Work,
    Private,
    Invoice,
    Newsletter,
    Social,
    Ads,
    Government,
    Package,
    Calendar,
    Subscription,
    Spam,
    Phishing,
    FollowUp,
    Review,
    Other,
}

impl EmailCategory {
    pub fn folder_name(&self) -> &'static str {
        match self {
            Self::Important   => "Wichtig",
            Self::Work        => "Arbeit",
            Self::Private     => "Privat",
            Self::Invoice     => "Rechnungen",
            Self::Newsletter  => "Newsletter",
            Self::Social      => "Social",
            Self::Ads         => "Werbung",
            Self::Government  => "Behoerden",
            Self::Package     => "Pakete",
            Self::Calendar    => "Termine",
            Self::Subscription => "Abos",
            Self::Spam        => "Review/Spam",
            Self::Phishing    => "Review/Phishing",
            Self::FollowUp    => "Follow-Up",
            Self::Review      => "Review",
            Self::Other       => "Sonstiges",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Self::Important   => "Wichtig",
            Self::Work        => "Arbeit",
            Self::Private     => "Privat",
            Self::Invoice     => "Rechnung",
            Self::Newsletter  => "Newsletter",
            Self::Social      => "Social Media",
            Self::Ads         => "Werbung",
            Self::Government  => "Behörde",
            Self::Package     => "Paket",
            Self::Calendar    => "Termin",
            Self::Subscription => "Abo",
            Self::Spam        => "Spam",
            Self::Phishing    => "Phishing",
            Self::FollowUp    => "Follow-Up",
            Self::Review      => "Überprüfen",
            Self::Other       => "Sonstiges",
        }
    }

    pub fn priority(&self) -> u8 {
        match self {
            Self::Phishing    => 100,
            Self::Important   => 90,
            Self::FollowUp    => 80,
            Self::Work        => 70,
            Self::Invoice     => 65,
            Self::Calendar    => 60,
            Self::Package     => 55,
            Self::Government  => 50,
            Self::Private     => 45,
            Self::Subscription => 30,
            Self::Social      => 25,
            Self::Newsletter  => 20,
            Self::Ads         => 10,
            Self::Spam        => 5,
            Self::Review      => 5,
            Self::Other       => 1,
        }
    }

    pub fn emoji(&self) -> &'static str {
        match self {
            Self::Important   => "⭐",
            Self::Work        => "💼",
            Self::Private     => "🏠",
            Self::Invoice     => "🧾",
            Self::Newsletter  => "📰",
            Self::Social      => "💬",
            Self::Ads         => "📢",
            Self::Government  => "🏛️",
            Self::Package     => "📦",
            Self::Calendar    => "📅",
            Self::Subscription => "🔄",
            Self::Spam        => "🗑️",
            Self::Phishing    => "⚠️",
            Self::FollowUp    => "↩️",
            Self::Review      => "👁️",
            Self::Other       => "📧",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Classification {
    pub category: EmailCategory,
    pub confidence: f32,
    pub tags: Vec<String>,
    pub summary: Option<String>,
    pub extracted_amount: Option<f64>,
    pub extracted_currency: Option<String>,
    pub extracted_due_date: Option<NaiveDate>,
    pub extracted_event_date: Option<NaiveDate>,
    pub extracted_sender_name: Option<String>,
    pub tracking_number: Option<String>,
    pub tracking_carrier: Option<String>,
    pub is_subscription: bool,
    pub subscription_service: Option<String>,
    pub renewal_date: Option<NaiveDate>,
    pub cancel_link: Option<String>,
    pub phishing_score: f32,
    pub phishing_reasons: Vec<String>,
    pub follow_up_hint: Option<String>,
    pub reply_suggestion: Option<String>,
    pub classified_by: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn phishing_has_highest_priority() {
        assert_eq!(EmailCategory::Phishing.priority(), 100);
        assert!(EmailCategory::Phishing.priority() > EmailCategory::Important.priority());
    }

    #[test]
    fn folder_name_returns_correct_string() {
        assert_eq!(EmailCategory::Invoice.folder_name(), "Rechnungen");
        assert_eq!(EmailCategory::Phishing.folder_name(), "Review/Phishing");
        assert_eq!(EmailCategory::Newsletter.folder_name(), "Newsletter");
    }

    #[test]
    fn all_categories_have_unique_priorities() {
        let categories = [
            EmailCategory::Phishing,
            EmailCategory::Important,
            EmailCategory::FollowUp,
            EmailCategory::Work,
            EmailCategory::Invoice,
            EmailCategory::Calendar,
            EmailCategory::Package,
            EmailCategory::Government,
            EmailCategory::Private,
            EmailCategory::Subscription,
            EmailCategory::Social,
            EmailCategory::Newsletter,
            EmailCategory::Ads,
        ];
        for (i, a) in categories.iter().enumerate() {
            for (j, b) in categories.iter().enumerate() {
                if i != j {
                    assert_ne!(
                        a.priority(), b.priority(),
                        "{:?} and {:?} have same priority", a, b
                    );
                }
            }
        }
    }
}
