# Contributing

Thank you for contributing to CreatorGET-Service.

This repository contains a Node.js CLI for fetching, browsing, comparing, caching, and exporting Minecraft Marketplace creator data. Contributions should keep the CLI predictable, portable, and safe for local data.

## Before You Start

- Read [readme.md](readme.md) for configuration, commands, and data formats.
- Read [SECURITY.md](SECURITY.md) before reporting vulnerabilities.
- Discuss large features, output-format changes, or breaking CLI changes before implementing them.

## Development Setup

Requirements:

- Node.js 18 or newer
- npm

Install dependencies:

```bash
npm ci
```

Run the CLI:

```bash
npm start
```

Validate JavaScript syntax:

```bash
node --check bin/creatorservice.js
```

When changing files under `src`, run `node --check` for each changed JavaScript file as well.

## Repository Structure

- `bin/creatorservice.js`: CLI entry point
- `src/config`: configuration handling
- `src/services`: Minecraft Marketplace data retrieval
- `src/cache`: cache and diff behavior
- `src/export`: JSON, CSV, and ID exports
- `src/favorites`: local favorites handling
- `src/ui`: interactive terminal menus
- `src/utils`: shared helpers
- `.cache`: generated local cache data

## Contribution Guidelines

- Keep changes focused and avoid unrelated rewrites.
- Preserve documented CLI commands and export formats unless a change is intentional.
- Validate remote data before displaying, caching, or exporting it.
- Keep file output inside explicitly selected or documented locations.
- Do not commit personal favorites, generated exports, credentials, or private environment values.
- Update `readme.md` when behavior, configuration, commands, or output formats change.

## Coding Expectations

- Match the existing ESM style and current organization.
- Keep interactive prompts keyboard-accessible and terminal-safe.
- Handle network, malformed-data, filesystem, and permission errors explicitly.
- Avoid terminal escape-sequence injection from untrusted remote values.
- Prefer deterministic exports so changes remain reviewable.

## Testing Expectations

This repository currently has no automated test suite. Contributors should:

- syntax-check every changed JavaScript file
- run the affected CLI flow manually
- verify affected cache, diff, favorites, or export output
- describe the checks performed in the pull request

Add automated tests when introducing logic that can be isolated without depending on the interactive terminal.

## Commit Messages

Follow the existing concise, imperative commit style, for example:

```text
Add validation for export paths
Handle malformed creator entries
Document cache configuration
```

## Pull Requests

Include the problem, intended behavior, user-visible impact, checks performed, and any compatibility or data-format considerations.

## Security Reporting

Do not disclose vulnerability details in public issues or pull requests. Follow [SECURITY.md](SECURITY.md).

## Conduct

By participating in this project, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
