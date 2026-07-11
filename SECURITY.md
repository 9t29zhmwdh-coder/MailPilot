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

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |
| Older   | ❌ No     |

Security fixes are only applied to the latest release.
