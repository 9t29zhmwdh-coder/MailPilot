<div align="center">
  <img src="RayStudio.png" alt="MailPilot" width="100"/>
  <h1>MailPilot</h1>
  <p>Lokaler KI-E-Mail-Organizer -- intelligente Kategorisierung, Review-Workflow, Multi-Account IMAP</p>
</div>

[🇬🇧 English Version](README.md)

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Rust](https://img.shields.io/badge/Rust-1.96+-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white) ![Plattform](https://img.shields.io/badge/Plattform-macOS-lightgrey) ![KI](https://img.shields.io/badge/KI-lokal%20%7C%20offline-green) [![Release](https://img.shields.io/github/v/release/9t29zhmwdh-coder/MailPilot?color=3F8E7E)](https://github.com/9t29zhmwdh-coder/MailPilot/releases) [![License](https://img.shields.io/github/license/9t29zhmwdh-coder/MailPilot?color=lightgrey)](LICENSE)

---

MailPilot verbindet sich mit deinen IMAP-Postfaechern, klassifiziert jede E-Mail mit einem **lokalen KI-Modell** und laesst dich jede Entscheidung pruefen und korrigieren, bevor etwas veraendert wird. Alles laeuft auf deinem Geraet -- kein Cloud-Dienst, kein API-Key, kein Tracking.

Schnell-Login fuer iCloud, Microsoft 365, Gmail und Fastmail, ohne manuelle Servereinstellungen.

## Funktionen

| | Funktion | Status |
|---|---|---|
| **Sync** | iCloud, M365, Gmail, Fastmail, beliebiger IMAP | Fertig |
| **Kategorisierung** | 16 Kategorien: Newsletter, Rechnung, Paket, Arbeit, Phishing... | Fertig |
| **KI-Review** | Jede KI-Entscheidung pruefen und korrigieren, bevor sie gilt | Fertig |
| **Ordner-Browser** | Alle IMAP-Ordner anzeigen, KI-Reorganisationsvorschlaege | Fertig |
| **E-Mails loeschen** | Direkt in der App loeschen, wird mit IMAP synchronisiert | Fertig |
| **Dashboard** | Stats, Kategorienverteilung, Sync pro Konto | Fertig |
| **Suche** | Volltextsuche ueber alle synchronisierten E-Mails | Fertig |
| **Multi-Account** | Mehrere IMAP-Konten in einem Dashboard | Fertig |
| **Keychain** | Passwoerter nur im macOS-Schluessel bund gespeichert | Fertig |
| **Regeln** | Automatische Regeln pro Kategorie (archivieren, loeschen, verschieben...) | Geplant |
| **IMAP-Aktionen** | Tatsaechliches Verschieben auf dem Server nach Bestaetigung | Geplant |

---

## Voraussetzungen

- [Rust](https://rustup.rs/) 1.96+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- [Ollama](https://ollama.com/) lokal installiert und gestartet
- macOS 13+

---

## Schnellstart

```bash
# 1. Ollama mit einem lokalen Modell starten
ollama pull llama3.2
ollama serve

# 2. MailPilot klonen und starten
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot
cd frontend && npm install && cd ..
SQLX_OFFLINE=true cargo tauri dev
```

Beim ersten Start: **Einstellungen** oeffnen, Ollama-Modell auswaehlen, IMAP-Konto hinzufuegen. Auf dem Dashboard **Sync** klicken, dann **KI klassifizieren**.

---

## KI-Backend

MailPilot nutzt [Ollama](https://ollama.com/) fuer vollstaendig lokale, offline KI-Klassifizierung. Kein API-Key, keine Cloud, keine Daten verlassen dein Geraet.

Empfohlene Modelle:

| Modell | Groesse | Hinweis |
|---|---|---|
| `llama3.2` | 2 GB | Schnell, gute Qualitaet |
| `llama3.1` | 4 GB | Besseres Reasoning |
| `mistral` | 4 GB | Stark bei Klassifizierung |
| `phi4-mini` | 2 GB | Sehr schnell, leichtgewichtig |

---

## Datenschutz

Alles bleibt auf deinem Geraet. E-Mails werden lokal durch Ollama klassifiziert. Passwoerter werden im macOS-Schluessel bund gespeichert und verlassen deinen Computer nicht. Die lokale SQLite-Datenbank enthaelt alle Metadaten.

---

## Architektur

```
MailPilot/
├── crates/mp-core/      Rust: IMAP-Client, Klassifizierung, DB, lokales KI-Backend
├── crates/mp-cli/       CLI-Binary
├── src-tauri/           Tauri v2 Backend + IPC-Commands
└── frontend/            React + TypeScript + Tailwind + Recharts
```

---

**Autor:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Aktiv · v0.2.0
