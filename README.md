<div align="center">
  <img src="RayStudio.png" alt="MailPilot" width="100"/>
  <h1>MailPilot</h1>
  <p>AI-powered email organizer — smart categorization, review workflow, multi-account IMAP</p>
</div>

[🇩🇪 Deutsche Version](README.de.md)

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Rust](https://img.shields.io/badge/Rust-1.96+-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white) ![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey) ![AI](https://img.shields.io/badge/AI-Claude_API-black?logo=anthropic&logoColor=white)

---

MailPilot connects to your IMAP mailboxes, classifies every email using Claude AI, and lets you review and correct the results before anything is moved or deleted. Quick login for iCloud, Microsoft 365, Gmail, and Fastmail — no manual server setup required.

## Features

| | Feature | Status |
|---|---|---|
| **Sync** | iCloud, M365, Gmail, Fastmail, any IMAP | Done |
| **Categorization** | 16 categories: Newsletter, Invoice, Package, Work, Phishing... | Done |
| **AI Review** | Confirm or correct every AI decision before it takes effect | Done |
| **Dashboard** | Stats, category distribution, per-account sync | Done |
| **Search** | Full-text across all synced emails | Done |
| **Multi-Account** | Multiple IMAP accounts in one view | Done |
| **Keychain** | Passwords stored in macOS Keychain | Done |
| **Rules** | Automatic rules per category (newsletter archive, spam delete...) | Planned |
| **IMAP actions** | Actually move/delete on server after confirmation | Planned |

---

## Requirements

- [Rust](https://rustup.rs/) 1.96+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- A [Claude API key](https://console.anthropic.com/) (Haiku is cheapest, works well)
- macOS 13+

---

## Quick Start

```bash
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

cd frontend && npm install && cd ..

SQLX_OFFLINE=true cargo tauri dev
```

On first launch, go to **Settings**, paste your Claude API key, and add an IMAP account. Click **Sync** on the Dashboard, then **KI klassifizieren** to classify emails.

---

## AI Backend

MailPilot uses the [Claude API](https://docs.anthropic.com/) directly via HTTP. No local GPU or Ollama required. Supported models:

| Model | Speed | Cost |
|---|---|---|
| `claude-haiku-4-5-20251001` | Fast | Cheapest |
| `claude-sonnet-4-6` | Balanced | Medium |
| `claude-opus-4-8` | Best | Higher |

All emails are processed server-side by Anthropic. Passwords and keys are stored in macOS Keychain only, never sent to Claude.

---

## Privacy

Email content is sent to the Anthropic API for classification. Passwords and API keys are stored exclusively in macOS Keychain and never leave your device. The local SQLite database stores classified metadata.

---

## Architecture

```
MailPilot/
├── crates/mp-core/      Rust: IMAP client, classifier, DB, AI backend
├── crates/mp-cli/       CLI binary
├── src-tauri/           Tauri v2 backend + IPC commands
└── frontend/            React + TypeScript + Tailwind + Recharts
```

---

**Author:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Active · v0.1.0
