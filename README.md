<div align="center">
  <img src="RayStudio.png" alt="MailPilot" width="100"/>
  <h1>MailPilot</h1>
  <p>Local AI email organizer with smart categorization, a review workflow and multi-account IMAP</p>
</div>

[🇩🇪 Deutsche Version](README.de.md)

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Rust](https://img.shields.io/badge/Rust-1.96+-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white) ![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey) ![AI](https://img.shields.io/badge/AI-local%20%7C%20offline-green) [![Release](https://img.shields.io/github/v/release/9t29zhmwdh-coder/MailPilot?color=3F8E7E)](https://github.com/9t29zhmwdh-coder/MailPilot/releases) [![License](https://img.shields.io/github/license/9t29zhmwdh-coder/MailPilot?color=lightgrey)](LICENSE)

---

MailPilot connects to your IMAP mailboxes, classifies every email using a **local AI model**, and lets you review and correct every decision before anything is moved or deleted. Everything runs on your device, with no cloud, no API key and no tracking.

Quick login for iCloud, Microsoft 365, Gmail and Fastmail, with no manual server setup.

## Features

| | Feature | Status |
|---|---|---|
| **Sync** | iCloud, M365, Gmail, Fastmail, any IMAP | Done |
| **Categorization** | 16 categories: Newsletter, Invoice, Package, Work, Phishing... | Done |
| **AI Review** | Confirm or correct every AI decision before it takes effect | Done |
| **Folder Browser** | View all IMAP folders, get AI reorganization suggestions | Done |
| **Delete emails** | Delete directly from the app, synced to IMAP server | Done |
| **Dashboard** | Stats, category distribution, per-account sync | Done |
| **Search** | Full-text across all synced emails | Done |
| **Multi-Account** | Multiple IMAP accounts in one view | Done |
| **Keychain** | Passwords stored in macOS Keychain only | Done |
| **Rules** | Automatic rules per category (archive, delete, move...) | Planned |
| **IMAP actions** | Actually move emails on the server after confirmation | Planned |

---

## Requirements

- [Rust](https://rustup.rs/) 1.96+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- [Ollama](https://ollama.com/) running locally with a supported model
- macOS 13+

---

## Quick Start

```bash
# 1. Start Ollama with a local model
ollama pull llama3.2
ollama serve

# 2. Clone and run MailPilot
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot
cd frontend && npm install && cd ..
SQLX_OFFLINE=true cargo tauri dev
```

On first launch, open **Settings**, select your Ollama model, and add an IMAP account. Click **Sync** on the Dashboard, then **KI klassifizieren**.

---

## AI Backend

MailPilot uses [Ollama](https://ollama.com/) for fully local, offline AI classification. No API key, no cloud, no data leaves your device.

Recommended models:

| Model | Size | Notes |
|---|---|---|
| `llama3.2` | 2 GB | Fast, good quality |
| `llama3.1` | 4 GB | Better reasoning |
| `mistral` | 4 GB | Strong at classification |
| `phi4-mini` | 2 GB | Very fast, lightweight |

---

## Privacy

Everything stays on your device. Emails are classified locally by Ollama. Passwords are stored in macOS Keychain and never leave your machine. The local SQLite database holds all metadata.

---

## Architecture

```
MailPilot/
├── crates/mp-core/      Rust: IMAP client, classifier, DB, local AI backend
├── crates/mp-cli/       CLI binary
├── src-tauri/           Tauri v2 backend + IPC commands
└── frontend/            React + TypeScript + Tailwind + Recharts
```

---

**Author:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Active · ![version](https://img.shields.io/github/v/release/9t29zhmwdh-coder/MailPilot?color=6b7280&style=flat-square)
