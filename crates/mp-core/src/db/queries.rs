use anyhow::Result;
use sqlx::SqlitePool;
use chrono::Utc;
use serde_json;

use crate::models::{
    account::{AppSettings, EmailAccount},
    action::OrganizeAction,
    classification::Classification,
    email_entry::EmailEntry,
};
use crate::search::SearchQuery;

pub async fn upsert_account(pool: &SqlitePool, acc: &EmailAccount) -> Result<()> {
    let imap_port = acc.imap_port as i64;
    let last_sync = acc.last_sync.map(|t| t.timestamp());
    sqlx::query!(
        "INSERT OR REPLACE INTO email_accounts(id, label, email_address, imap_host, imap_port, username, use_tls, enabled, last_sync)
         VALUES(?,?,?,?,?,?,?,?,?)",
        acc.id, acc.label, acc.email_address, acc.imap_host, imap_port,
        acc.username, acc.use_tls, acc.enabled,
        last_sync,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_accounts(pool: &SqlitePool) -> Result<Vec<EmailAccount>> {
    let rows = sqlx::query!(
        "SELECT id, label, email_address, imap_host, imap_port, username, use_tls, enabled, last_sync FROM email_accounts"
    )
    .fetch_all(pool)
    .await?;

    let accounts = rows.into_iter().map(|r| EmailAccount {
        id: r.id.unwrap_or_default(),
        label: r.label,
        email_address: r.email_address,
        imap_host: r.imap_host,
        imap_port: r.imap_port as u16,
        protocol: crate::models::account::Protocol::Imap,
        username: r.username,
        use_tls: r.use_tls,
        mailboxes: vec!["INBOX".to_string()],
        last_sync: r.last_sync.and_then(|t| chrono::DateTime::from_timestamp(t, 0)),
        enabled: r.enabled,
    }).collect();

    Ok(accounts)
}

pub async fn delete_account(pool: &SqlitePool, id: &str) -> Result<()> {
    sqlx::query!("DELETE FROM email_accounts WHERE id = ?", id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn insert_email(pool: &SqlitePool, e: &EmailEntry) -> Result<()> {
    let from_json = serde_json::to_string(&e.from)?;
    let to_json = serde_json::to_string(&e.to)?;
    let cc_json = serde_json::to_string(&e.cc)?;
    let att_json = serde_json::to_string(&e.attachments)?;
    let cls_json = e.classification.as_ref().map(|c| serde_json::to_string(c).ok()).flatten();
    let date_ts = e.date.timestamp();
    let fetched_ts = e.fetched_at.timestamp();
    let uid = e.uid as i64;
    let size = e.size as i64;

    sqlx::query!(
        "INSERT OR IGNORE INTO emails(id, account_id, message_id, uid, mailbox, subject,
         from_json, to_json, cc_json, body_text, body_html, attachments_json,
         is_read, is_flagged, size, hash, thread_id, classification_json,
         date_ts, fetched_ts)
         VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        e.id, e.account_id, e.message_id, uid, e.mailbox, e.subject,
        from_json, to_json, cc_json, e.body_text, e.body_html, att_json,
        e.is_read, e.is_flagged, size, e.hash, e.thread_id, cls_json,
        date_ts, fetched_ts,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_classification(pool: &SqlitePool, email_id: &str, cls: &Classification) -> Result<()> {
    let json = serde_json::to_string(cls)?;
    sqlx::query!(
        "UPDATE emails SET classification_json = ? WHERE id = ?",
        json, email_id
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_emails(
    pool: &SqlitePool,
    account_id: Option<&str>,
    _category: Option<&str>,
    limit: u32,
    offset: u32,
) -> Result<Vec<EmailEntry>> {
    let limit_i = limit as i64;
    let offset_i = offset as i64;
    if let Some(aid) = account_id {
        let rows = sqlx::query!(
            "SELECT * FROM emails WHERE account_id = ? ORDER BY date_ts DESC LIMIT ? OFFSET ?",
            aid, limit_i, offset_i
        ).fetch_all(pool).await?;
        return Ok(rows.into_iter().filter_map(|r| deserialize_email_row(
            r.id.unwrap_or_default(), r.account_id,
            r.message_id, r.uid as u32,
            r.mailbox, r.subject,
            r.from_json, r.to_json,
            r.cc_json, r.body_text, r.body_html,
            r.attachments_json, r.is_read,
            r.is_flagged, r.size as u64,
            r.hash, r.thread_id, r.classification_json, r.date_ts, r.fetched_ts,
        )).collect());
    }
    let rows = sqlx::query!(
        "SELECT * FROM emails ORDER BY date_ts DESC LIMIT ? OFFSET ?",
        limit_i, offset_i
    ).fetch_all(pool).await?;
    Ok(rows.into_iter().filter_map(|r| deserialize_email_row(
        r.id.unwrap_or_default(), r.account_id,
        r.message_id, r.uid as u32,
        r.mailbox, r.subject,
        r.from_json, r.to_json,
        r.cc_json, r.body_text, r.body_html,
        r.attachments_json, r.is_read,
        r.is_flagged, r.size as u64,
        r.hash, r.thread_id, r.classification_json, r.date_ts, r.fetched_ts,
    )).collect())
}

pub async fn get_email(pool: &SqlitePool, id: &str) -> Result<Option<EmailEntry>> {
    let r = sqlx::query!("SELECT * FROM emails WHERE id = ?", id)
        .fetch_optional(pool)
        .await?;

    Ok(r.and_then(|r| deserialize_email_row(
        r.id.unwrap_or_default(), r.account_id,
        r.message_id, r.uid as u32,
        r.mailbox, r.subject,
        r.from_json, r.to_json,
        r.cc_json, r.body_text, r.body_html,
        r.attachments_json, r.is_read,
        r.is_flagged, r.size as u64,
        r.hash, r.thread_id, r.classification_json, r.date_ts, r.fetched_ts,
    )))
}

pub async fn search_emails(pool: &SqlitePool, q: &SearchQuery) -> Result<Vec<EmailEntry>> {
    let pattern = format!("%{}%", q.text);
    let limit = q.limit as i64;
    let offset = q.offset as i64;
    let rows = sqlx::query!(
        "SELECT * FROM emails WHERE (subject LIKE ? OR body_text LIKE ? OR from_json LIKE ?)
         ORDER BY date_ts DESC LIMIT ? OFFSET ?",
        pattern, pattern, pattern, limit, offset
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().filter_map(|r| deserialize_email_row(
        r.id.unwrap_or_default(), r.account_id,
        r.message_id, r.uid as u32,
        r.mailbox, r.subject,
        r.from_json, r.to_json,
        r.cc_json, r.body_text, r.body_html,
        r.attachments_json, r.is_read,
        r.is_flagged, r.size as u64,
        r.hash, r.thread_id, r.classification_json, r.date_ts, r.fetched_ts,
    )).collect())
}

pub async fn insert_action(pool: &SqlitePool, action: &OrganizeAction) -> Result<()> {
    let kind_json = serde_json::to_string(&action.kind)?;
    let status_json = serde_json::to_string(&action.status)?;
    let created_ts = action.created_at.timestamp();
    sqlx::query!(
        "INSERT INTO organize_actions(id, email_id, email_subject, from_address, kind_json, target_folder, reason, status_json, undoable, created_ts)
         VALUES(?,?,?,?,?,?,?,?,?,?)",
        action.id, action.email_id, action.email_subject, action.from_address,
        kind_json, action.target_folder, action.reason, status_json, action.undoable, created_ts,
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_actions(pool: &SqlitePool) -> Result<Vec<OrganizeAction>> {
    let rows = sqlx::query!(
        "SELECT id, email_id, email_subject, from_address, kind_json, target_folder, reason, status_json, undoable, created_ts
         FROM organize_actions ORDER BY created_ts DESC"
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().filter_map(|r| {
        let kind = serde_json::from_str(&r.kind_json).ok()?;
        let status = serde_json::from_str(&r.status_json).ok()?;
        Some(OrganizeAction {
            id: r.id.unwrap_or_default(),
            email_id: r.email_id,
            email_subject: r.email_subject,
            from_address: r.from_address,
            kind,
            target_folder: r.target_folder,
            tag: None,
            reason: r.reason,
            status,
            undoable: r.undoable,
            created_at: chrono::DateTime::from_timestamp(r.created_ts, 0).unwrap_or_else(Utc::now),
        })
    }).collect())
}

pub async fn get_setting(pool: &SqlitePool, key: &str) -> Result<Option<String>> {
    let row = sqlx::query!("SELECT value FROM app_settings WHERE key = ?", key)
        .fetch_optional(pool)
        .await?;
    Ok(row.map(|r| r.value))
}

pub async fn set_setting(pool: &SqlitePool, key: &str, value: &str) -> Result<()> {
    sqlx::query!(
        "INSERT OR REPLACE INTO app_settings(key, value) VALUES(?,?)",
        key, value
    )
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn load_settings(pool: &SqlitePool) -> Result<AppSettings> {
    let json = get_setting(pool, "app_settings").await?;
    Ok(json
        .and_then(|j| serde_json::from_str(&j).ok())
        .unwrap_or_default())
}

pub async fn save_settings(pool: &SqlitePool, s: &AppSettings) -> Result<()> {
    let json = serde_json::to_string(s)?;
    set_setting(pool, "app_settings", &json).await
}

#[allow(clippy::too_many_arguments)]
fn deserialize_email_row(
    id: String, account_id: String, message_id: String, uid: u32,
    mailbox: String, subject: String, from_json: String, to_json: String,
    cc_json: String, body_text: Option<String>, body_html: Option<String>,
    attachments_json: String, is_read: bool, is_flagged: bool, size: u64,
    hash: Option<String>, thread_id: Option<String>, cls_json: Option<String>,
    date_ts: i64, fetched_ts: i64,
) -> Option<EmailEntry> {
    let from = serde_json::from_str(&from_json).ok()?;
    let to = serde_json::from_str(&to_json).ok().unwrap_or_default();
    let cc = serde_json::from_str(&cc_json).ok().unwrap_or_default();
    let attachments = serde_json::from_str(&attachments_json).ok().unwrap_or_default();
    let classification = cls_json.and_then(|j| serde_json::from_str(&j).ok());
    let date = chrono::DateTime::from_timestamp(date_ts, 0)?;
    let fetched_at = chrono::DateTime::from_timestamp(fetched_ts, 0).unwrap_or_else(Utc::now);

    Some(EmailEntry {
        id, account_id, message_id, uid, mailbox, subject, from, to, cc,
        body_text, body_html, attachments,
        kind: crate::models::email_entry::EmailKind::Plain,
        in_reply_to: None, references: vec![],
        is_read, is_flagged, size, hash, thread_id, classification, date, fetched_at,
    })
}
