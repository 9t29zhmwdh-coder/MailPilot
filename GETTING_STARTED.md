# Getting Started with MailPilot

This guide walks you through setting up and running MailPilot from scratch, even if you have never used a terminal or built a Rust/Tauri app before. MailPilot is a **macOS-only** application (it relies on the macOS Keychain for storing your Anthropic API key and IMAP credentials), so the steps below are for macOS 13 or later.

<!-- TODO: Screenshot -->

## macOS

### 1. Open a terminal

Press **Cmd+Space** to open Spotlight, type "Terminal", and press Enter.

### 2. Check prerequisites

Run each of these commands one at a time:

```bash
rustc --version
cargo --version
node --version
cargo tauri --version
```

If any command prints `command not found`, that tool is not installed (or not on your PATH) yet:

- **Rust / Cargo missing** → install from [rustup.rs](https://rustup.rs)
- **Node.js missing** → install from [nodejs.org](https://nodejs.org)
- **Tauri CLI missing** → once Rust is installed, run `cargo install tauri-cli`

After installing, close and reopen your terminal so the new PATH entries take effect.

### 3. Get the code

**Easiest way (no git required):**
1. Go to the [MailPilot GitHub page](https://github.com/9t29zhmwdh-coder/MailPilot)
2. Click the green **Code** button → **Download ZIP**
3. Extract the ZIP file, e.g. into `~/Projects/MailPilot`

**If you already use git:**
```bash
git clone https://github.com/9t29zhmwdh-coder/MailPilot.git
```

### 4. Build & run

In your terminal, navigate into the extracted/cloned folder, then run:

```bash
cd MailPilot
cd frontend && npm install && cd ..
SQLX_OFFLINE=true cargo tauri dev
```

`npm install` downloads frontend dependencies, and `SQLX_OFFLINE=true cargo tauri dev` compiles the Rust backend without needing a live database connection at compile time. The first run takes a few minutes. Once it finishes, the MailPilot window opens.

### 5. First-time setup

Once the app window is open:

1. Go to **Settings** and paste your [Anthropic API key](https://console.anthropic.com/) (it's stored in the macOS Keychain, never written to disk in plain text)
2. Add an IMAP account (iCloud, Microsoft 365, Gmail, Fastmail, or any generic IMAP server)
3. Click **Sync** on the Dashboard to pull in your emails
4. Click **Classify with AI** to let Claude sort your emails into categories

You'll then be able to review and correct each classification before anything is moved or deleted.

---

### Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `command not found: cargo` | Rust is not installed, or your terminal was opened before installing it | Install via [rustup.rs](https://rustup.rs), then open a **new** Terminal window |
| `command not found: npm` | Node.js is not installed or not on PATH | Install via [nodejs.org](https://nodejs.org), then reopen your terminal |
| Build fails with SQLx errors about a missing database or `DATABASE_URL` | The `SQLX_OFFLINE` flag was left off, so `cargo` tries to check queries against a live DB | Always prefix the run command with `SQLX_OFFLINE=true` exactly as shown above |
| Xcode Command Line Tools missing / `xcrun: error` | Rust and Tauri need Apple's build tools to compile native code on macOS | Run `xcode-select --install` in Terminal and follow the prompts |
