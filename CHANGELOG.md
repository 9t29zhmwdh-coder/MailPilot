# Changelog, MailPilot

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.4] - 2026-07-28

### Changed

- CodeQL moved from GitHub's default setup to an advanced setup with a committed `.github/workflows/codeql.yml`. The default setup skips pull requests that touch no code of a given language, so a dependency pull request changing only a lock file reported `skipping` on the required `Analyze (...)` checks forever and could never be merged. The workflow runs on every pull request regardless of what changed. It also uses the `security-extended` query suite, which the default setup does not allow choosing. Required checks are unchanged: verified on `BugRadar` that all eight, the generic `CodeQL` check included, turn green under this setup.
- Dependabot now groups only minor and patch updates per ecosystem; majors arrive as individual pull requests. The previous grouping put React 18 to 19, Tailwind 3 to 4 and similar breaking changes into one pull request together with urgently needed security patches, which made the whole batch unreviewable and unmergeable. Actions stay grouped wholesale. Follows `engineering-standards` v0.11.0.

## [1.0.3] - 2026-07-28

### Security

- `postcss` updated to 8.5.24, closing a high-severity path traversal in the source map auto-loading via `sourceMappingURL` that affects all versions up to and including 8.5.17.

Applied as a normal pull request rather than by merging Dependabot's, because Dependabot pull requests cannot currently pass this repository's required checks: CodeQL runs through GitHub's default setup, which does not trigger on a pull request that only touches a lock file, so its checks report `skipping` and never turn green. Bypassing a required check is not an option per `standards/ci-cd.md` section 7, so the fix takes the route that runs the full pipeline.

## [1.0.2] - 2026-07-28

### Added

- `.github/dependabot.yml`, with grouped weekly updates. The file was missing, and without it there are no version updates at all: repository security alerts only fire for disclosed vulnerabilities. Follows `engineering-standards` v0.10.0.

### Fixed

- 7 action references used a mutable tag or branch instead of a commit SHA, `dtolnay/rust-toolchain@stable` among them where applicable. A branch HEAD can be moved to point at different code at any time. All are now pinned, at the version that was actually running rather than upgraded, so any major bump arrives as its own reviewable Dependabot PR.
- The Cargo workspace and `tauri.conf.json` were on 1.0.0 while the tag and changelog said 1.0.1, and `frontend/package.json` was on 0.3.8. The 1.0.1 release therefore shipped without the manifests being bumped. All manifests now agree on 1.0.2.

## [1.0.1] - 2026-07-20

### Changed

- OpenSSF Scorecard workflow and badge.
- `copilot-instructions.md` for consistent AI-assisted contributions.
- Restored real umlauts that had been substituted with ASCII approximations.
- German README now uses the same dynamic version badge as the English one instead of a hardcoded version string.
- Split the README's security/CI badges onto their own line, separate from the platform/tech/AI badges (they were rendering as a single merged line).

## [1.0.0] - 2026-07-17

First stable release: a real, packaged, installable distribution exists
for end users. macOS DMG installer. Windows/Linux are not built: MailPilot shells out to the macOS-only `/usr/bin/security` Keychain CLI for credential storage, a real platform dependency, not a gap.

## [0.3.9] - 2026-07-17

### Changed
- CI: added an explicit `permissions: contents: read` block to the workflow(s) that were missing one (CodeQL `actions/missing-workflow-permissions`), narrowing the default GITHUB_TOKEN scope.

## [0.3.8] - 2026-07-12

### Added

- TERMS_OF_SALE.md: terms covering the purchase of a pre-built, packaged distribution through a marketplace (as-is, no warranty, liability strictly capped at the amount paid). Does not modify the existing MIT LICENSE, which continues to cover the source code at no cost.

### Security

- Bumped `vite` and `@vitejs/plugin-react` (frontend dev dependencies) to resolve 4 Dependabot-reported advisories affecting the Vite dev server only, not the built/shipped application (a high-severity `server.fs.deny` bypass on Windows, an NTLMv2 hash disclosure via UNC path handling, a path traversal in optimized-deps `.map` handling, and an esbuild dev-server exposure).
- Documented a 5th advisory (`glib`, RUSTSEC, medium) as an accepted, time-boxed exception in SECURITY.md: it is a transitive dependency pinned by Tauri's own Linux GTK bindings and cannot be patched in isolation without a Tauri major-version bump.

## [0.3.7] - 2026-07-11

### Fixed

- Removed an eszett and em-dashes across the repo (TEMPLATE_NOTES.md, README.de.md, ARCHITECTURE.md, CONTRIBUTING.md, SKELETON.md). Swiss German orthography.

## [0.3.6] - 2026-07-11

### Added

- Documented Dual-Licensing assessment (Community-only) in ROADMAP.md.

### Fixed

- Removed em-dashes from ROADMAP.md headings.

## [0.3.5] - 2026-07-11

### Fixed

- Replaced the unmonitored security@raystudio.ch email in SECURITY.md with a GitHub Security Advisory link, matching the rest of the portfolio.

## [0.3.4] - 2026-07-11

### Fixed

- Updated actions/checkout, actions/setup-node, codecov/codecov-action and tauri-apps/tauri-action to their latest major versions in CI and the release workflow, since GitHub is deprecating the Node.js 20 runtime and older action versions were being forced onto Node 24 and crashing during post-run cleanup.

## [0.3.3] - 2026-07-11

### Fixed

- Fixed the release workflow's stable-named DMG upload: it looked for the built bundle under `src-tauri/target/...`, but this is a Cargo workspace, so Cargo places build output under the workspace root `target/...`. The stable `MailPilot.dmg` download link in README.md never actually got uploaded before this fix.

## [0.3.2] - 2026-07-11

### Fixed

- Corrected README hero section: only the title image and title stay centered, the tagline is now left aligned like the rest of the document

## [0.3.1] - 2026-07-10

### Fixed

- Removed em-dash from the download callout in README.md/README.de.md, replaced with a colon

## [0.3.0] - 2026-07-10

### Added

- Release workflow: pushing a `v*` tag now builds the macOS DMG bundle via `tauri-action` and attaches it to a GitHub Release. Not code-signed/notarized. Windows/Linux are intentionally not built (app uses the macOS Keychain, only ever tested on macOS)

## [0.2.2] - 2026-07-10

### Changed

- Moved the "New here? -> beginners guide" callout in README.md above the intro (previously only appeared near Requirements)

### Added

- Added the "New here?" beginner guide callout to README.de.md (was missing)

## [0.2.1] - 2026-07-08

### Fixed

- CI excluded the `mailpilot` app crate from all checks, hiding the crate's own bugs
- Missing English/German UI translation (the app was previously German-only)
- README claimed a local, offline, no-API-key AI backend; the app actually uses Claude via the Anthropic API (API key stored in Keychain). Corrected across both READMEs, badges, requirements, quick start and privacy sections
- German README had ASCII-transliterated umlauts (`fuer`, `koennen`, ...) throughout instead of proper `ü`/`ö`/`ä`

### Added

- README onboarding sections: how it runs, screenshot, in practice, uninstall/cleanup

## [0.2.0] (2026-07-03)

### Added

- IMAP folder browser with folder-level navigation
- Email deletion and AI-assisted folder suggestions
- Sync UX: relative timestamps, auto-sync toggle, per-account result display
- Unit and integration tests for `mp-core` with coverage reporting

### Changed

- AI backend switched to local Ollama (offline-first)

### Fixed

- ISO date-string handling in relative-time formatting
- CI security audit: documented ignores for quick-xml advisories
  (RUSTSEC-2026-0194/-0195, transitive via plist/tauri, no upstream fix yet)

## [0.1.0] - 2026-06-12

### Added

- IMAP client with TLS support (Outlook, Gmail, Apple Mail)
- Incremental sync engine with UID tracking and flag handling
- OS keyring integration (`keyring` crate), credentials never written to disk
- `ClassifierEngine` with `OllamaBackend` for local AI email classification
- Smart tagging and folder mapping based on classifier output
- Server-side IMAP MOVE for organised folder structure
- SQLite offline storage for emails, tags, accounts, and sync state
- Tauri v2 desktop shell with React/TypeScript frontend
- Inbox view with tag filters and AI-suggested labels
- Classifier review UI (accept/reject AI suggestions)
- Account management UI (add/remove IMAP accounts)
- Bilingual README (English / German)
- CONTRIBUTING.md with development setup guide
- SECURITY.md with vulnerability reporting process
