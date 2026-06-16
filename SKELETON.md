# MailPilot — Repository Skeleton

**Repo:** `9t29zhmwdh-coder/MailPilot`
**Stack:** Rust workspace · Tauri v2 · React/TypeScript · SQLite · IMAP · keyring
**Initial commit:** `37ffef272ecdf989781bad24b7bdae3c7ea132eb` (2026-06-12)

---

## File Tree

```
MailPilot/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md
├── src-tauri/          # Rust workspace root
│   ├── mp-core/        # Core library crate
│   │   └── src/
│   │       ├── imap/         # client, sync engine
│   │       ├── classifier/   # ClassifierEngine, OllamaBackend
│   │       ├── organizer/    # tagging, folder mapping
│   │       └── db/           # SQLite migrations
│   └── mp-cli/         # CLI binary crate
├── src/                # React/TypeScript frontend
├── ARCHITECTURE.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── PRIVACY.md
├── ROADMAP.md
├── SECURITY.md
└── SKELETON.md
```

---

## Migration Checklist

| File | Status |
|------|--------|
| SKELETON.md | ✅ pushed |
| ARCHITECTURE.md | ✅ pushed |
| CHANGELOG.md | ✅ pushed |
| CODE_OF_CONDUCT.md | ✅ pushed |
| CONTRIBUTING.md | ✅ already present |
| PRIVACY.md | ✅ pushed |
| ROADMAP.md | ✅ pushed |
| SECURITY.md | ✅ already present |
| .github/ISSUE_TEMPLATE/bug_report.md | ✅ pushed |
| .github/ISSUE_TEMPLATE/feature_request.md | ✅ pushed |
| .github/PULL_REQUEST_TEMPLATE.md | ✅ pushed |

---

## Notes

- CI/CD workflows are not included in this skeleton (GitHub Actions requires secrets setup).
- IMAP credentials are stored via OS keyring — never written to disk in plaintext.
- Tauri v2 capabilities must explicitly allowlist all IPC commands in `src-tauri/capabilities/`.
