CREATE TABLE IF NOT EXISTS email_accounts (
    id            TEXT PRIMARY KEY,
    label         TEXT NOT NULL,
    email_address TEXT NOT NULL,
    imap_host     TEXT NOT NULL,
    imap_port     INTEGER NOT NULL DEFAULT 993,
    username      TEXT NOT NULL,
    use_tls       BOOLEAN NOT NULL DEFAULT 1,
    enabled       BOOLEAN NOT NULL DEFAULT 1,
    last_sync     INTEGER
);

CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
