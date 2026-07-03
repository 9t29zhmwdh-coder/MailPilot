# Changelog — MailPilot

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0] (2026-07-03)

### Added

- IMAP folder browser with folder-level navigation
- Email deletion and AI-assisted folder suggestions
- Sync UX: relative timestamps, auto-sync toggle, per-account result display
- Unit and integration tests for `mp-core` with coverage reporting

### Changed

- AI backend switched to local Ollama (offline-first)

### Fixed

- ISO date-string handling in relative-time formatting
- CI security audit: documented ignores for quick-xml advisories
  (RUSTSEC-2026-0194/-0195, transitive via plist/tauri, no upstream fix yet)

## [0.1.0] — 2026-06-12

### Added

- IMAP client with TLS support (Outlook, Gmail, Apple Mail)
- Incremental sync engine with UID tracking and flag handling
- OS keyring integration (`keyring` crate) — credentials never written to disk
- `ClassifierEngine` with `OllamaBackend` for local AI email classification
- Smart tagging and folder mapping based on classifier output
- Server-side IMAP MOVE for organised folder structure
- SQLite offline storage for emails, tags, accounts, and sync state
- Tauri v2 desktop shell with React/TypeScript frontend
- Inbox view with tag filters and AI-suggested labels
- Classifier review UI (accept/reject AI suggestions)
- Account management UI (add/remove IMAP accounts)
- Bilingual README (English / German)
- CONTRIBUTING.md with development setup guide
- SECURITY.md with vulnerability reporting process
