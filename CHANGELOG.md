# Changelog, MailPilot

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.2] - 2026-07-10

### Changed

- Moved the "New here? -> beginners guide" callout in README.md above the intro (previously only appeared near Requirements)

### Added

- Added the "New here?" beginner guide callout to README.de.md (was missing)

## [0.2.1] - 2026-07-08

### Fixed

- CI excluded the `mailpilot` app crate from all checks, hiding the crate's own bugs
- Missing English/German UI translation (the app was previously German-only)
- README claimed a local, offline, no-API-key AI backend; the app actually uses Claude via the Anthropic API (API key stored in Keychain). Corrected across both READMEs, badges, requirements, quick start and privacy sections
- German README had ASCII-transliterated umlauts (`fuer`, `koennen`, ...) throughout instead of proper `ü`/`ö`/`ä`

### Added

- README onboarding sections: how it runs, screenshot, in practice, uninstall/cleanup

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

## [0.1.0] - 2026-06-12

### Added

- IMAP client with TLS support (Outlook, Gmail, Apple Mail)
- Incremental sync engine with UID tracking and flag handling
- OS keyring integration (`keyring` crate), credentials never written to disk
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
