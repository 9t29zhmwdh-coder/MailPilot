# MailPilot: Roadmap

## v0.1.0, Initial Release ✅ (2026-06-12)

- IMAP client with TLS (Outlook, Gmail, Apple Mail)
- Incremental sync engine with UID tracking
- OS keyring integration for credential storage
- AI email classifier via Ollama (local, `localhost:11434`)
- Smart tag-based filtering and folder mapping
- SQLite offline storage for emails, tags, and sync state
- Tauri v2 desktop shell with React/TypeScript frontend
- Bilingual README (EN/DE)

---

## v0.2.0, Smart Inbox & Rules (planned)

- [ ] Custom filter rules engine (sender / subject / tag → action)
- [ ] Bulk tagging and bulk move actions
- [ ] Snooze: defer email to a later time
- [ ] Unsubscribe detection and one-click opt-out helper
- [ ] Full-text search over synced emails (SQLite FTS5)
- [ ] Keyboard-first navigation (vim-like shortcuts)

---

## v0.3.0, Multi-Account & Providers (planned)

- [ ] Multiple simultaneous IMAP accounts
- [ ] SMTP send support
- [ ] OAuth2 flow for Gmail and Outlook (no password required)
- [ ] Thread grouping (in-reply-to / references headers)
- [ ] Attachment preview (images, PDF)
- [ ] Contact book (local, vCard import)

---

## v1.0.0, Stable Release (planned)

- [ ] Full test coverage for mp-core (unit + integration)
- [ ] Signed macOS / Windows / Linux binaries
- [ ] IDLE push for real-time inbox updates (no polling)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Comprehensive user documentation
- [ ] Automated update check (offline-first, no telemetry)

---

## Dual-Licensing Readiness

Assessed 2026-07-11: Community-only, not a Dual-Licensing candidate. MailPilot is a personal email organizer; "multi-account" (v0.3.0 above) means multiple mailboxes owned by the same individual, not multi-tenant or organizational use. No team, admin console or shared-mailbox dimension exists anywhere on the roadmap. This category (personal desktop email clients) conventionally stays fully open source or ships as a one-time-purchase consumer app, not dual-licensed open-core. Revisit only if a genuine team/shared-inbox use case is scoped in.
