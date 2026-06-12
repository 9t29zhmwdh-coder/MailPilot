<p align="center">
  <img src="RayStudio.png" alt="RayStudio" width="120" />
</p>

<h1 align="center">MailPilot</h1>
<p align="center"><strong>AI-powered local email organizer — offline, private, cross-platform</strong></p>
<p align="center">
  <a href="README.de.md">Deutsch</a> ·
  <a href="https://github.com/9t29zhmwdh-coder/MailPilot">GitHub</a> ·
  <a href="LICENSE">MIT License</a>
</p>

---

## What is MailPilot?

MailPilot automatically recognizes, categorizes, tags, and organizes emails from Outlook, Gmail, Apple Mail, and any IMAP mailbox — **fully offline**, using local AI models. No cloud, no tracking, no complexity.

## Features

| Module | Description |
|---|---|
| **Smart Categorization** | Newsletter, Invoices, Social, Work, Government, Packages, Calendar, Subscriptions, Phishing |
| **Invoice Detection** | Extracts amount, currency, due date, sender from emails and PDF attachments |
| **Package Tracking** | Recognizes tracking numbers, shows current status |
| **Calendar Events** | Extracts dates, times, locations — one-click export |
| **Subscription Monitor** | Detects recurring senders, renewal dates, cancel links |
| **Phishing Detection** | Local heuristic + AI-based fraud detection |
| **Thread Analysis** | Groups conversations, detects duplicates, suggests follow-ups |
| **Smart Cleanup** | Old newsletters, ads, social — review queue before any delete |
| **Filter Rules** | AI proposes rules, user confirms — no autorun |
| **Offline Search** | Full-text search across all accounts and attachments |
| **Multi-Account** | Gmail, Outlook, Apple Mail, any IMAP in one dashboard |

## Privacy

MailPilot processes all emails **locally on your machine**. No data is sent to the cloud. All AI analysis is performed by Ollama models running entirely offline. Passwords are stored in the system keychain (macOS Keychain / Windows DPAPI / Linux SecretService).

## Tech Stack

- **Core** — Rust (imap, mailparse, blake3, regex, rayon, sqlx)
- **Desktop** — Tauri v2
- **Frontend** — React, TypeScript, Tailwind CSS, Recharts
- **AI** — Ollama (llama3 for text, llava for attachments) — 100% offline

## Getting Started

```bash
# Prerequisites: Rust, Node.js 18+, Ollama (https://ollama.com)
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

# Pull AI models
ollama pull llama3
ollama pull llava

npm --prefix frontend install
cargo tauri dev
```

---

<p align="right">
  <sub>by <a href="https://github.com/9t29zhmwdh-coder">RayStudio</a> &nbsp;·&nbsp; MIT License</sub>
  &nbsp;
  <img src="RayStudio.png" alt="" width="70" align="right" />
</p>
