<div align="center">
  <img src="RayStudio.png" alt="MailPilot" width="100"/>
  <h1>MailPilot</h1>
  <p>KI-gestuetzter E-Mail-Organizer — intelligente Kategorisierung, Review-Workflow, Multi-Account IMAP</p>
</div>

[🇬🇧 English Version](README.md)

[![CI](https://github.com/9t29zhmwdh-coder/MailPilot/actions/workflows/ci.yml/badge.svg)](https://github.com/9t29zhmwdh-coder/MailPilot/actions) ![Rust](https://img.shields.io/badge/Rust-1.96+-CE422B?logo=rust&logoColor=white) ![Tauri](https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white) ![Plattform](https://img.shields.io/badge/Plattform-macOS-lightgrey) ![KI](https://img.shields.io/badge/KI-Claude_API-black?logo=anthropic&logoColor=white)

---

MailPilot verbindet sich mit deinen IMAP-Postfaechern, klassifiziert jede E-Mail mit Claude KI und laesst dich alle Entscheidungen pruefen und korrigieren, bevor etwas verschoben oder geloescht wird. Schnell-Login fuer iCloud, Microsoft 365, Gmail und Fastmail, ohne manuelle Servereinstellungen.

## Funktionen

| | Funktion | Status |
|---|---|---|
| **Sync** | iCloud, M365, Gmail, Fastmail, beliebiger IMAP | Fertig |
| **Kategorisierung** | 16 Kategorien: Newsletter, Rechnung, Paket, Arbeit, Phishing... | Fertig |
| **KI-Review** | Jede KI-Entscheidung pruefen und korrigieren, bevor sie gilt | Fertig |
| **Dashboard** | Stats, Kategorienverteilung, Sync pro Konto | Fertig |
| **Suche** | Volltextsuche ueber alle synchronisierten E-Mails | Fertig |
| **Multi-Account** | Mehrere IMAP-Konten in einem Dashboard | Fertig |
| **Keychain** | Passwoerter nur im macOS-Schluessel bund gespeichert | Fertig |
| **Regeln** | Automatische Regeln pro Kategorie (Newsletter archivieren, Spam loeschen...) | Geplant |
| **IMAP-Aktionen** | Tatsaechliches Verschieben/Loeschen auf dem Server nach Bestaetigung | Geplant |

---

## Voraussetzungen

- [Rust](https://rustup.rs/) 1.96+
- [Node.js](https://nodejs.org/) 20+
- [Tauri CLI v2](https://tauri.app/): `cargo install tauri-cli`
- Ein [Claude API-Schluessel](https://console.anthropic.com/) (Haiku ist am guenstigsten)
- macOS 13+

---

## Schnellstart

```bash
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

cd frontend && npm install && cd ..

SQLX_OFFLINE=true cargo tauri dev
```

Beim ersten Start: **Einstellungen** oeffnen, Claude API-Schluessel einfuegen, IMAP-Konto hinzufuegen. Auf dem Dashboard **Sync** klicken, dann **KI klassifizieren**.

---

## KI-Backend

MailPilot nutzt die [Claude API](https://docs.anthropic.com/) direkt per HTTP. Kein lokaler GPU, kein Ollama noetig. Unterstuetzte Modelle:

| Modell | Geschwindigkeit | Kosten |
|---|---|---|
| `claude-haiku-4-5-20251001` | Schnell | Am guenstigsten |
| `claude-sonnet-4-6` | Ausgewogen | Mittel |
| `claude-opus-4-8` | Bestes | Hoeher |

E-Mails werden serverseitig von Anthropic verarbeitet. Passwoerter und Schluessel werden ausschliesslich im macOS-Schluessel bund gespeichert und nie an Claude uebermittelt.

---

## Datenschutz

E-Mail-Inhalte werden zur Klassifizierung an die Anthropic API gesendet. Passwoerter und API-Schluessel werden ausschliesslich im macOS-Schluessel bund gespeichert und verlassen dein Geraet nie. Die lokale SQLite-Datenbank speichert klassifizierte Metadaten.

---

## Architektur

```
MailPilot/
├── crates/mp-core/      Rust: IMAP-Client, Klassifizierung, DB, KI-Backend
├── crates/mp-cli/       CLI-Binary
├── src-tauri/           Tauri v2 Backend + IPC-Commands
└── frontend/            React + TypeScript + Tailwind + Recharts
```

---

**Autor:** [Rafael Yilmaz](https://github.com/9t29zhmwdh-coder) · **Status:** Aktiv · v0.1.0
