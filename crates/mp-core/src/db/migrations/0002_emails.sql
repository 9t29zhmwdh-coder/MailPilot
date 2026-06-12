CREATE TABLE IF NOT EXISTS emails (
    id                  TEXT PRIMARY KEY,
    account_id          TEXT NOT NULL,
    message_id          TEXT NOT NULL UNIQUE,
    uid                 INTEGER NOT NULL,
    mailbox             TEXT NOT NULL DEFAULT 'INBOX',
    subject             TEXT NOT NULL DEFAULT '',
    from_json           TEXT NOT NULL DEFAULT '{}',
    to_json             TEXT NOT NULL DEFAULT '[]',
    cc_json             TEXT NOT NULL DEFAULT '[]',
    body_text           TEXT,
    body_html           TEXT,
    attachments_json    TEXT NOT NULL DEFAULT '[]',
    is_read             BOOLEAN NOT NULL DEFAULT 0,
    is_flagged          BOOLEAN NOT NULL DEFAULT 0,
    size                INTEGER NOT NULL DEFAULT 0,
    hash                TEXT,
    thread_id           TEXT,
    classification_json TEXT,
    date_ts             INTEGER NOT NULL,
    fetched_ts          INTEGER NOT NULL,
    FOREIGN KEY (account_id) REFERENCES email_accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emails_account  ON emails(account_id);
CREATE INDEX IF NOT EXISTS idx_emails_date     ON emails(date_ts DESC);
CREATE INDEX IF NOT EXISTS idx_emails_thread   ON emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_msgid    ON emails(message_id);

CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(
    id UNINDEXED,
    subject,
    body_text,
    content='emails',
    content_rowid='rowid'
);
