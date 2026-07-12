# Security Policy

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report it via [GitHub Security Advisory](https://github.com/9t29zhmwdh-coder/MailPilot/security/advisories/new) or contact the maintainer via the GitHub profile.

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

I will respond within **48 hours** and work to resolve the issue promptly.

## Security Practices

- All credentials stored in the OS system keychain (macOS Keychain, Windows DPAPI, Linux SecretService): never in plain text files or environment files
- API keys and passwords require explicit user input and are never auto-filled
- Local-only processing: no data is transmitted to external servers by default
- All network communication uses TLS/HTTPS
- Input validation at all system boundaries

## Known Accepted Exceptions

- **glib (RUSTSEC, medium): unsoundness in `Iterator`/`DoubleEndedIterator` impls for `glib::VariantStrIter`**, present in `glib 0.18.5` (a transitive dependency of Tauri's Linux tray/menu integration via `gtk 0.18.2`, `atk 0.18.2`). `gtk 0.18.2` pins `glib` to `^0.18`; the fixed `glib 0.20.0` requires a `gtk`/Tauri major-version bump, not an isolated patch. This crate is only linked on Linux builds and the unsound pattern is not reachable from this application's own code. Accepted as of 2026-07-12; revisit when Tauri's own dependency tree moves past `gtk 0.18`.

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

Security fixes are only applied to the latest release.
