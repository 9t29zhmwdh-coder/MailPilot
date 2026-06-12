use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: String,
    pub email_id: String,
    pub sender_name: String,
    pub sender_email: String,
    pub amount: f64,
    pub currency: String,
    pub due_date: Option<NaiveDate>,
    pub invoice_number: Option<String>,
    pub description: Option<String>,
    pub is_paid: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TrackingStatus {
    Processing,
    InTransit,
    OutForDelivery,
    Delivered,
    Exception,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageTracking {
    pub id: String,
    pub email_id: String,
    pub tracking_number: String,
    pub carrier: String,
    pub status: TrackingStatus,
    pub expected_delivery: Option<NaiveDate>,
    pub order_description: Option<String>,
    pub sender: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CalendarEvent {
    pub id: String,
    pub email_id: String,
    pub title: String,
    pub start: DateTime<Utc>,
    pub end: Option<DateTime<Utc>>,
    pub location: Option<String>,
    pub organizer: String,
    pub description: Option<String>,
    pub ics_content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: String,
    pub service_name: String,
    pub sender_email: String,
    pub sender_domain: String,
    pub email_count: u32,
    pub first_seen: DateTime<Utc>,
    pub last_seen: DateTime<Utc>,
    pub cancel_link: Option<String>,
    pub renewal_date: Option<NaiveDate>,
    pub monthly_cost: Option<f64>,
    pub currency: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FollowUpHint {
    pub email_id: String,
    pub hint: String,
    pub suggested_reply: Option<String>,
    pub days_since_received: u32,
}
