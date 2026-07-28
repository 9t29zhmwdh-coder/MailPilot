#![allow(unused_imports)]
pub mod account_manager;

use anyhow::Result;
use imap::Session;
use mailparse::{MailHeaderMap, parse_mail};
use chrono::Utc;
use uuid::Uuid;

use crate::models::{
    email_entry::{Attachment, EmailAddress, EmailEntry, EmailKind},
    account::EmailAccount,
};

pub type TlsSession = Session<imap::Connection>;

pub fn connect_tls(account: &EmailAccount, password: &str) -> Result<TlsSession> {
    let client = imap::ClientBuilder::new(&account.imap_host, account.imap_port)
        .connect()
        .map_err(|e| anyhow::anyhow!("IMAP Verbindung fehlgeschlagen: {}", e))?;
    let session = client
        .login(&account.username, password)
        .map_err(|e| anyhow::anyhow!("IMAP Login fehlgeschlagen: {:?}", e.0))?;
    Ok(session)
}

pub fn fetch_emails(
    account: &EmailAccount,
    password: &str,
    mailbox: &str,
    max: u32,
) -> Result<Vec<EmailEntry>> {
    let mut session = connect_tls(account, password)?;
    let mailbox_info = session.select(mailbox)?;
    let exists = mailbox_info.exists;
    if exists == 0 {
        let _ = session.logout();
        return Ok(vec![]);
    }

    let batch = max.min(200);
    let start = if exists > batch { exists - batch + 1 } else { 1 };
    let seq_set = format!("{}:{}", start, exists);
    let messages = session.fetch(&seq_set, "(UID FLAGS BODY.PEEK[])")?;

    let mut entries = Vec::new();
    for msg in messages.iter() {
        if let Some(raw) = msg.body() {
            if let Ok(entry) = parse_email_message(raw, msg.uid.unwrap_or(0), mailbox, &account.id) {
                entries.push(entry);
            }
        }
    }

    let _ = session.logout();
    Ok(entries)
}

pub fn list_mailboxes(account: &EmailAccount, password: &str) -> Result<Vec<String>> {
    let mut session = connect_tls(account, password)?;
    let mailboxes = session
        .list(None, Some("*"))?
        .iter()
        .map(|mb| mb.name().to_string())
        .collect();
    let _ = session.logout();
    Ok(mailboxes)
}

pub fn delete_email_imap(account: &EmailAccount, password: &str, mailbox: &str, uid: u32) -> Result<()> {
    let mut session = connect_tls(account, password)?;
    session.select(mailbox)?;
    session.uid_store(uid.to_string(), "+FLAGS (\\Deleted)")?;
    session.expunge()?;
    let _ = session.logout();
    Ok(())
}

/// Moves a message to another mailbox on the server, creating the target if needed.
///
/// Prefers the MOVE extension (RFC 6851). Not every server implements it, so this
/// falls back to the classic COPY plus \Deleted plus EXPUNGE sequence. The fallback
/// is not free of consequence: EXPUNGE removes every message flagged as deleted in
/// the mailbox, not just this one, which is why it only runs when MOVE is refused.
pub fn move_email_imap(
    account: &EmailAccount,
    password: &str,
    mailbox: &str,
    uid: u32,
    target: &str,
) -> Result<()> {
    let mut session = connect_tls(account, password)?;
    session.select(mailbox)?;

    // The target folder may not exist yet; CREATE on an existing mailbox is an
    // error on most servers, so a failure here is only fatal if the move fails too.
    let _ = session.create(target);

    let uid_str = uid.to_string();
    let move_result = session.uid_mv(&uid_str, target);

    if move_result.is_err() {
        session
            .uid_copy(&uid_str, target)
            .map_err(|e| anyhow::anyhow!("COPY nach {} fehlgeschlagen: {}", target, e))?;
        session
            .uid_store(&uid_str, "+FLAGS (\\Deleted)")
            .map_err(|e| anyhow::anyhow!("Markieren als geloescht fehlgeschlagen: {}", e))?;
        session
            .expunge()
            .map_err(|e| anyhow::anyhow!("EXPUNGE fehlgeschlagen: {}", e))?;
    }

    let _ = session.logout();
    Ok(())
}

pub fn fetch_since_uid(
    account: &EmailAccount,
    password: &str,
    mailbox: &str,
    since_uid: u32,
    max: u32,
) -> Result<Vec<EmailEntry>> {
    let mut session = connect_tls(account, password)?;
    session.select(mailbox)?;
    let uid_range = format!("{}:*", since_uid + 1);
    let messages = session.uid_fetch(&uid_range, "(UID FLAGS BODY.PEEK[])")?;

    let mut entries: Vec<EmailEntry> = messages
        .iter()
        .filter_map(|msg| {
            let body = msg.body()?;
            parse_email_message(body, msg.uid.unwrap_or(0), mailbox, &account.id).ok()
        })
        .take(max as usize)
        .collect();

    entries.sort_by_key(|e| std::cmp::Reverse(e.date));
    let _ = session.logout();
    Ok(entries)
}

fn parse_email_message(raw: &[u8], uid: u32, mailbox: &str, account_id: &str) -> Result<EmailEntry> {
    let parsed = parse_mail(raw)?;

    let subject = parsed.headers.get_first_value("Subject").unwrap_or_default();
    let from_raw = parsed.headers.get_first_value("From").unwrap_or_default();
    let to_raw = parsed.headers.get_first_value("To").unwrap_or_default();
    let cc_raw = parsed.headers.get_first_value("Cc").unwrap_or_default();
    let message_id = parsed.headers.get_first_value("Message-Id").unwrap_or_else(|| Uuid::new_v4().to_string());
    let in_reply_to = parsed.headers.get_first_value("In-Reply-To");
    let date_raw = parsed.headers.get_first_value("Date").unwrap_or_default();

    let date = mailparse::dateparse(&date_raw)
        .map(|t| chrono::DateTime::from_timestamp(t, 0).unwrap_or_else(Utc::now))
        .unwrap_or_else(|_| Utc::now());

    let (body_text, body_html, attachments, kind) = extract_body_parts(&parsed);

    let hash = {
        let mut hasher = blake3::Hasher::new();
        hasher.update(raw);
        Some(hasher.finalize().to_hex().to_string())
    };

    Ok(EmailEntry {
        id: Uuid::new_v4().to_string(),
        account_id: account_id.to_string(),
        message_id: message_id.trim_matches(|c| c == '<' || c == '>').to_string(),
        uid,
        mailbox: mailbox.to_string(),
        subject: decode_header_value(&subject),
        from: parse_address(&from_raw),
        to: parse_addresses(&to_raw),
        cc: parse_addresses(&cc_raw),
        date,
        body_text,
        body_html,
        attachments,
        kind,
        in_reply_to,
        references: vec![],
        is_read: false,
        is_flagged: false,
        size: raw.len() as u64,
        hash,
        thread_id: None,
        classification: None,
        fetched_at: Utc::now(),
    })
}

fn extract_body_parts(
    parsed: &mailparse::ParsedMail<'_>,
) -> (Option<String>, Option<String>, Vec<Attachment>, EmailKind) {
    let mut text = None;
    let mut html = None;
    let mut attachments = Vec::new();

    if parsed.subparts.is_empty() {
        let ct = &parsed.ctype;
        if ct.mimetype == "text/plain" {
            text = parsed.get_body().ok();
        } else if ct.mimetype == "text/html" {
            html = parsed.get_body().ok();
        }
        return (text, html, attachments, EmailKind::Plain);
    }

    for part in &parsed.subparts {
        let ct = &part.ctype;
        let disposition = part.headers.get_first_value("Content-Disposition").unwrap_or_default();

        if disposition.contains("attachment") {
            let filename = ct.params.get("name")
                .or_else(|| ct.params.get("filename"))
                .cloned()
                .unwrap_or_else(|| "attachment".to_string());
            let body = part.get_body_raw().unwrap_or_default();
            attachments.push(Attachment {
                filename,
                mime_type: ct.mimetype.clone(),
                size: body.len() as u64,
                content_id: part.headers.get_first_value("Content-Id"),
            });
            continue;
        }

        match ct.mimetype.as_str() {
            "text/plain" => { text = part.get_body().ok(); }
            "text/html"  => { html = part.get_body().ok(); }
            _ => {}
        }

        if !part.subparts.is_empty() {
            let (sub_text, sub_html, mut sub_att, _) = extract_body_parts(part);
            if text.is_none() { text = sub_text; }
            if html.is_none() { html = sub_html; }
            attachments.append(&mut sub_att);
        }
    }

    let kind = if html.is_some() && text.is_some() {
        EmailKind::Multipart
    } else if html.is_some() {
        EmailKind::Html
    } else {
        EmailKind::Plain
    };

    (text, html, attachments, kind)
}

fn parse_address(raw: &str) -> EmailAddress {
    let raw = raw.trim();
    if let Some(angle_start) = raw.rfind('<') {
        if let Some(angle_end) = raw.rfind('>') {
            let name = raw[..angle_start].trim().trim_matches('"').to_string();
            let addr = raw[angle_start + 1..angle_end].trim().to_string();
            return EmailAddress {
                name: if name.is_empty() { None } else { Some(name) },
                address: addr,
            };
        }
    }
    EmailAddress { name: None, address: raw.to_string() }
}

fn parse_addresses(raw: &str) -> Vec<EmailAddress> {
    raw.split(',').map(|s| parse_address(s.trim())).collect()
}

fn decode_header_value(raw: &str) -> String {
    match mailparse::parse_header(format!("X: {raw}").as_bytes()) {
        Ok((header, _)) => header.get_value(),
        Err(_) => raw.to_string(),
    }
}
