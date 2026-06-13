# Contributing to MailPilot

## Getting Started

### Prerequisites

- Rust 1.77+
- Node.js 20+
- Tauri CLI v2: `cargo install tauri-cli`
- [Ollama](https://ollama.com) (for AI features)

### Setup

1. Fork the repository
2. `git clone https://github.com/YOUR_USERNAME/MailPilot`
3. `cd MailPilot`
4. `cd frontend && npm install && cd ..`
5. `cargo build --workspace`
6. `cargo tauri dev`

## Development Workflow

1. Create a feature branch: `git checkout -b feature/xyz`
2. Make your changes
3. Run Rust checks: `cargo check --workspace`
4. Run clippy: `cargo clippy --workspace`
5. Commit: `git commit -m "[feat] description"`
6. Push and open a Pull Request

## Code Style

- Rust: `cargo fmt` + `cargo clippy`
- TypeScript: ESLint (see `frontend/` config)
- Format on save in your IDE

## Commit Convention

`[type] description` — where type is:
- `[feat]` — new feature
- `[fix]` — bug fix
- `[docs]` — documentation only
- `[refactor]` — code cleanup
- `[test]` — tests only

## Questions?

Open an issue or discussion on GitHub.
