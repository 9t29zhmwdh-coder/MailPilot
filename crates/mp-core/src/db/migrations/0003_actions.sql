CREATE TABLE IF NOT EXISTS organize_actions (
    id            TEXT PRIMARY KEY,
    email_id      TEXT NOT NULL,
    email_subject TEXT NOT NULL DEFAULT '',
    from_address  TEXT NOT NULL DEFAULT '',
    kind_json     TEXT NOT NULL,
    target_folder TEXT,
    reason        TEXT NOT NULL DEFAULT '',
    status_json   TEXT NOT NULL DEFAULT '"Pending"',
    undoable      BOOLEAN NOT NULL DEFAULT 1,
    created_ts    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS filter_rules (
    id                   TEXT PRIMARY KEY,
    name                 TEXT NOT NULL,
    conditions_json      TEXT NOT NULL DEFAULT '[]',
    match_all            BOOLEAN NOT NULL DEFAULT 0,
    actions_json         TEXT NOT NULL DEFAULT '[]',
    enabled              BOOLEAN NOT NULL DEFAULT 1,
    confirmed_by_user    BOOLEAN NOT NULL DEFAULT 0,
    ai_suggested         BOOLEAN NOT NULL DEFAULT 0,
    created_ts           INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_email  ON organize_actions(email_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON organize_actions(status_json);
