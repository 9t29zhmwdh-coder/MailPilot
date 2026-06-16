# Privacy Policy — MailPilot

## Summary

MailPilot processes all data locally. No data ever leaves your device except the IMAP connections you configure.

## What We Collect

**Nothing.** MailPilot does not collect, store, transmit, or share any user data with third parties.

## Data Processing

- All email content is processed locally and stored in a local SQLite database
- No email content is transmitted to external services
- All AI classification runs locally via Ollama at localhost:11434
- No telemetry, no analytics, no crash reporting

## Storage

- Emails and tags are stored in SQLite in the OS application data directory
- IMAP credentials are stored exclusively in the OS keyring — never written to disk in plaintext
- No personal information is transmitted outside your configured IMAP servers
- No cloud sync

## Network Access

MailPilot connects only to:
1. Your configured IMAP servers (Outlook, Gmail, Apple Mail) — user-initiated
2. `localhost:11434` (Ollama, local AI inference)

No other outbound connections are made.

## Data Retention

MailPilot does not retain data beyond what you explicitly sync from your IMAP server. Deleting the app removes all local data.

## Contact

Security issues: see [SECURITY.md](SECURITY.md)

**Last updated: 2026-06-12**
