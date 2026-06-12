<p align="center">
  <img src="RayStudio.png" alt="RayStudio" width="120" />
</p>

<h1 align="center">MailPilot</h1>
<p align="center"><strong>KI-gestützter lokaler E-Mail-Organizer — offline, privat, plattformübergreifend</strong></p>
<p align="center">
  <a href="README.md">English</a> ·
  <a href="https://github.com/9t29zhmwdh-coder/MailPilot">GitHub</a> ·
  <a href="LICENSE">MIT-Lizenz</a>
</p>

---

## Was ist MailPilot?

MailPilot erkennt, kategorisiert, taggt und sortiert E-Mails aus Outlook, Gmail, Apple Mail und beliebigen IMAP-Postfächern automatisch — **vollständig offline**, mit lokalen KI-Modellen. Keine Cloud, kein Tracking, keine Komplexität.

## Funktionen

| Modul | Beschreibung |
|---|---|
| **Intelligente Kategorisierung** | Newsletter, Rechnungen, Social, Arbeit, Behörden, Pakete, Termine, Abos, Phishing |
| **Rechnungserkennung** | Extrahiert Betrag, Währung, Fälligkeit, Absender aus E-Mails und PDF-Anhängen |
| **Paketverfolgung** | Erkennt Tracking-Nummern, zeigt aktuellen Status |
| **Kalendertermine** | Extrahiert Datum, Uhrzeit, Ort — Ein-Klick-Export |
| **Abo-Monitor** | Erkennt wiederkehrende Absender, Verlängerungsdaten, Kündigungslinks |
| **Phishing-Erkennung** | Lokale Heuristik + KI-basierte Betrugserkennung |
| **Thread-Analyse** | Gruppiert Konversationen, erkennt Duplikate, schlägt Follow-ups vor |
| **Smart Cleanup** | Alte Newsletter, Werbung, Social — Review-Ordner vor jeder Löschung |
| **Filterregeln** | KI schlägt Regeln vor, Nutzer bestätigt — kein Autorun |
| **Offline-Suche** | Volltextsuche über alle Konten und Anhänge |
| **Multi-Account** | Gmail, Outlook, Apple Mail, beliebiger IMAP in einem Dashboard |

## Datenschutz

MailPilot verarbeitet alle E-Mails **lokal auf deinem Gerät**. Es werden keine Daten in die Cloud hochgeladen. Alle KI-Analysen werden durch Ollama-Modelle durchgeführt, die vollständig offline laufen. Passwörter werden im System-Schlüsselbund gespeichert (macOS Keychain / Windows DPAPI / Linux SecretService).

## Technologie

- **Core** — Rust (imap, mailparse, blake3, regex, rayon, sqlx)
- **Desktop** — Tauri v2
- **Frontend** — React, TypeScript, Tailwind CSS, Recharts
- **KI** — Ollama (llama3 für Text, llava für Anhänge) — 100% offline

## Schnellstart

```bash
# Voraussetzungen: Rust, Node.js 18+, Ollama (https://ollama.com)
git clone https://github.com/9t29zhmwdh-coder/MailPilot
cd MailPilot

# KI-Modelle herunterladen
ollama pull llama3
ollama pull llava

npm --prefix frontend install
cargo tauri dev
```

---

<p align="right">
  <sub>von <a href="https://github.com/9t29zhmwdh-coder">RayStudio</a> &nbsp;·&nbsp; MIT-Lizenz</sub>
  &nbsp;
  <img src="RayStudio.png" alt="" width="70" align="right" />
</p>
