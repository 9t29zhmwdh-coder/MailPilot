<div align="center">
  <img src="RayStudio.png" alt="RayStudio Logo" width="120"/>

  <h1>MailPilot</h1>
</div>

[🇩🇪 Deutsche Version](README.de.md)

**AI-powered local email organizer. Offline, private, cross-platform, built with Rust and Tauri.**

MailPilot automatically recognizes, categorizes, tags, and organizes emails from Outlook, Gmail, Apple Mail, and any IMAP mailbox; **fully offline**, using local AI models. No cloud, no tracking, no complexity.

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Apple Silicon](https://img.shields.io/badge/Apple-Silicon-000000?logo=apple&logoColor=white) ![Platform](https://img.shields.io/badge/Platform-macOS_%7C_Windows-lightgrey) ![Rust](https://img.shields.io/badge/Rust-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-24C8D8?logo=tauri&logoColor=white) ![AI | Claude Code](https://img.shields.io/badge/AI-Claude_Code-black?logo=anthropic&logoColor=white) ![AI | Copilot](https://img.shields.io/badge/AI-Copilot-black?logo=github&logoColor=white) ![AI | Ollama](https://img.shields.io/badge/AI-Ollama-black?logo=ollama&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)

---

## Features

| Feature | Description |
|---|---|
| **Smart Categorization** | Newsletter, Invoices, Social, Work, Government, Packages, Calendar, Subscriptions, Phishing |
| **Invoice Detection** | Extracts amount, currency, due date, and sender from emails and PDF attachments |
| **Package Tracking** | Recognizes tracking numbers, shows current delivery status |
| **Calendar Events** | Extracts dates, times, locations: one-click export |
| **Subscription Monitor** | Detects recurring senders, renewal dates, cancel links |
| **Phishing Detection** | Local heuristic + AI-based fraud detection |
| **Thread Analysis** | Groups conversations, detects duplicates, suggests follow-ups |
| **Smart Cleanup** | Old newsletters, ads, social: review queue before any deletion |
| **Filter Rules** | AI proposes rules, user confirms: no autorun |
| **Offline Search** | Full-text search across all accounts and attachments |
| **Multi-Account** | Gmail, Outlook, Apple Mail, any IMAP in one dashboard |

---

## Requirements

- [Rust](https://rustup.rs/) 1.77+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- [Ollama](https://ollama.ai): `ollama pull llama3 && ollama pull llava`
- macOS / Windows / Linux

---

## Quick Start

```bash
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

ollama pull llama3
ollama pull llava

cd frontend && npm install && cd ..
cargo tauri dev
```

---

## Privacy

MailPilot processes all emails **locally on your machine**. No data is sent to the cloud. All AI analysis is performed by Ollama models running entirely offline. Passwords are stored in the system keychain (macOS Keychain / Windows DPAPI / Linux SecretService).

---

## Architecture

```
MailPilot/
├── crates/mp-core/      — Rust: IMAP client, classifier, DB, AI
├── crates/mp-cli/       — CLI binary
├── src-tauri/           — Tauri v2 backend + IPC commands
└── frontend/            — React + TypeScript + Tailwind + Recharts
```

---

**Author:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Active · v0.1.0 · **License:** MIT
