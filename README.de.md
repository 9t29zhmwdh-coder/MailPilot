<div align="center">
  <img src="RayStudio.png" alt="RayStudio Logo" width="120"/>

  <h1>MailPilot</h1>
</div>

[🇬🇧 English Version](README.md)

**KI-gestützter lokaler E-Mail-Organizer. Offline, privat, plattformübergreifend, entwickelt mit Rust und Tauri.**

MailPilot erkennt, kategorisiert, taggt und sortiert E-Mails aus Outlook, Gmail, Apple Mail und beliebigen IMAP-Postfächern automatisch; **vollständig offline**, mit lokalen KI-Modellen. Keine Cloud, kein Tracking, keine Komplexität.

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Platform](https://img.shields.io/badge/Platform-macOS_%7C_Windows-lightgrey) ![Rust](https://img.shields.io/badge/Rust-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-24C8D8?logo=tauri&logoColor=white) ![AI | Claude Code](https://img.shields.io/badge/AI-Claude_Code-black?logo=anthropic&logoColor=white) ![AI | Copilot](https://img.shields.io/badge/AI-Copilot-black?logo=github&logoColor=white) ![AI | Ollama](https://img.shields.io/badge/AI-Ollama-black?logo=ollama&logoColor=white)
![Plattform](https://img.shields.io/badge/Plattform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![Lizenz](https://img.shields.io/badge/Lizenz-MIT-green)

---

## Funktionen

| Funktion | Beschreibung |
|---|---|
| **Intelligente Kategorisierung** | Newsletter, Rechnungen, Social, Arbeit, Behörden, Pakete, Termine, Abos, Phishing |
| **Rechnungserkennung** | Extrahiert Betrag, Währung, Fälligkeit und Absender aus E-Mails und PDF-Anhängen |
| **Paketverfolgung** | Erkennt Tracking-Nummern, zeigt aktuellen Lieferstatus |
| **Kalendertermine** | Extrahiert Datum, Uhrzeit, Ort: Ein-Klick-Export |
| **Abo-Monitor** | Erkennt wiederkehrende Absender, Verlängerungsdaten, Kündigungslinks |
| **Phishing-Erkennung** | Lokale Heuristik + KI-basierte Betrugserkennung |
| **Thread-Analyse** | Gruppiert Konversationen, erkennt Duplikate, schlägt Follow-ups vor |
| **Smart Cleanup** | Alte Newsletter, Werbung, Social: Review-Ordner vor jeder Löschung |
| **Filterregeln** | KI schlägt Regeln vor, Nutzer bestätigt: kein Autorun |
| **Offline-Suche** | Volltextsuche über alle Konten und Anhänge |
| **Multi-Account** | Gmail, Outlook, Apple Mail, beliebiger IMAP in einem Dashboard |

---

## Voraussetzungen

- [Rust](https://rustup.rs/) 1.77+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- [Ollama](https://ollama.ai): `ollama pull llama3 && ollama pull llava`
- macOS / Windows / Linux

---

## Schnellstart

```bash
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

ollama pull llama3
ollama pull llava

cd frontend && npm install && cd ..
cargo tauri dev
```

---

## Datenschutz

MailPilot verarbeitet alle E-Mails **lokal auf deinem Gerät**. Es werden keine Daten in die Cloud hochgeladen. Alle KI-Analysen werden durch Ollama-Modelle durchgeführt, die vollständig offline laufen. Passwörter werden im System-Schlüsselbund gespeichert (macOS Keychain / Windows DPAPI / Linux SecretService).

---

## Architektur

```
MailPilot/
├── crates/mp-core/      — Rust: IMAP-Client, Klassifizierung, DB, KI
├── crates/mp-cli/       — CLI-Binary
├── src-tauri/           — Tauri v2 Backend + IPC-Commands
└── frontend/            — React + TypeScript + Tailwind + Recharts
```

---

**Autor:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Active · v0.1.0 · **Lizenz:** MIT
