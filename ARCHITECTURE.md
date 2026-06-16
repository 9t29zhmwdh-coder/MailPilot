# MailPilot — Architecture

## Overview

MailPilot is an offline-first Rust/Tauri v2 desktop email client. It connects to IMAP servers (Outlook, Gmail, Apple Mail), fetches emails into a local SQLite store, classifies and tags them using local AI inference (Ollama), and provides smart filtering and folder organisation — fully without cloud dependencies.

---

## Workspace Structure

```
src-tauri/
├── mp-core/          # Library crate — all business logic
└── mp-cli/           # Binary crate — Tauri shell + CLI entry point
```

### mp-core

| Module | Responsibility |
|--------|----------------|
| `imap/client` | Establishes TLS IMAP connections; retrieves credentials from OS keyring |
| `imap/sync` | Incremental sync engine; tracks UIDs and flags; handles IDLE push |
| `classifier/ClassifierEngine` | Orchestrates classification pipeline per email |
| `classifier/OllamaBackend` | Sends email subject + snippet to Ollama; returns category + tags |
| `organizer/tagger` | Applies classifier output as tags to local records |
| `organizer/folder_mapper` | Maps tags to target IMAP folders; executes server-side MOVE |
| `db/` | SQLite migrations; stores emails, tags, accounts, and sync state |

### mp-cli

Tauri v2 shell: registers IPC commands, mounts the React frontend, and manages background sync tasks via `tokio`.

---

## Data Flow

```
IMAP Server (Outlook / Gmail / Apple Mail)
        │  TLS connection
        ▼
  imap/client  ←── credentials from OS keyring (never plaintext)
        │
        ▼
  imap/sync (incremental, IDLE-capable)
        │  new / updated emails
        ▼
  Normalised Email (subject, sender, snippet, headers)
        │
        ├──► SQLite (emails table)
        │
        ▼
  ClassifierEngine
        │
        └──► OllamaBackend (localhost:11434)
               │  category + tags
               ▼
         organizer/tagger → SQLite (tags table)
               │
               ▼
         organizer/folder_mapper
               │  server-side MOVE (optional)
               ▼
         IMAP Server (folder organised)
               │
               ▼
         Tauri IPC → React Frontend
```

---

## Frontend

React/TypeScript SPA served by Tauri v2. Communicates with the Rust backend exclusively via `invoke()` IPC calls. No HTTP server is exposed.

Key views:
- **Inbox** — smart inbox with tag filters and search
- **Classifier** — review AI tag suggestions, accept/reject, retrain
- **Accounts** — add/remove IMAP accounts (Outlook, Gmail, Apple Mail)
- **Rules** — define custom filter rules (sender, subject, tag → action)
- **Settings** — sync interval, Ollama model selection, folder mapping

---

## Storage

SQLite database in the OS application data directory (`$APPDATA/MailPilot/` / `~/Library/Application Support/MailPilot/`).

Tables: `accounts`, `emails`, `tags`, `email_tags`, `rules`, `sync_state`, `migrations`.

IMAP credentials are stored exclusively in the OS keyring (`keyring` crate) — never written to SQLite or any file.

---

## Security

- IMAP credentials stored in OS keyring only (never on disk in plaintext).
- No external network calls except the configured IMAP servers and `localhost:11434` (Ollama).
- All Tauri IPC commands explicitly allowlisted in `src-tauri/capabilities/`.
- No telemetry, no cloud sync, no analytics.
