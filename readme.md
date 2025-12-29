# CreatorGET-Service — Minecraft Marketplace Creators (PlayFab/Store Config)

> **Node.js CLI** for fetching, browsing, diffing, and exporting **Minecraft Marketplace creators** from the **PlayFab / Store config** endpoint. Includes an interactive arrow-key UI, fuzzy search, favorites, cache + diff workflow, and export tools (JSON/CSV/IDs). Built for quick inspection and repeatable exports.

[![Runtime](https://img.shields.io/badge/runtime-Node.js_18%2B-339933?logo=node.js)](#)
[![Type](https://img.shields.io/badge/type-ESM-informational)](#)
[![UI](https://img.shields.io/badge/cli-interactive-blue)](#)
[![Data](https://img.shields.io/badge/source-store%20config-orange)](#)
[![Status](https://img.shields.io/badge/stability-stable-success)](#)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Quickstart](#quickstart)
- [Configuration (Environment)](#configuration-environment)
- [Data Files & Local Storage](#data-files--local-storage)
- [Runtime & Architecture](#runtime--architecture)
- [Security Model](#security-model)
- [CLI](#cli)
    - [Navigation & UI](#navigation--ui)
    - [Main Menu Actions](#main-menu-actions)
    - [Creator Details](#creator-details)
- [Output Formats](#output-formats)
    - [`creators.json` format](#creatorsjson-format)
    - [CSV format](#csv-format)
    - [IDs export](#ids-export)
- [Caching & Diff Workflow](#caching--diff-workflow)
- [Diagnostics (Health)](#diagnostics-health)
- [Error Model](#error-model)
- [Rate Limiting](#rate-limiting)
- [Directory Layout](#directory-layout)
- [Development & Utilities](#development--utilities)
- [Testing](#testing)
- [Performance Tuning](#performance-tuning)
- [Deployment](#deployment)
    - [Local](#local)
    - [Global CLI](#global-cli)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CreatorGET-Service** is a focused CLI that extracts the **creator registry** used by the Minecraft Marketplace store UI.

It fetches **Store Session Config** from:

- `https://store.mktpl.minecraft-services.net/api/v1.0/session/config`

From that payload, it resolves the `creator` filter and exports each toggle as a normalized creator entry:

- `displayName` → human readable creator label (as exposed by the store config)
- `id` → creator identifier (typically an entity reference like `master_player_account!<hex>`)
- `creatorName` → a deterministic normalized name derived from `displayName` (configurable)

This project is intentionally scoped: **creators only**. No catalog browsing, no store items, no prices.

Repository: `Daniel-Ric/CreatorGET-Service`

---

## Key Features

- 🎛️ **Interactive arrow-key CLI** (prompts) with minimal, readable colors.
- 🔐 **Token-based access**: reads `MC_TOKEN` (`MCToken …`) from environment or prompts.
- ⚡ **Fast & resilient fetch** using Axios with keep-alive agents and timeout controls.
- 💾 **Cache** fetched creators on disk and load instantly on next run.
- 🧭 **Browse** creators in pages with details view and clipboard actions.
- 🔎 **Fuzzy search** (Fuse.js) across `displayName`, `creatorName`, and `id`.
- ⭐ **Favorites**: star creators and persist them for quick access.
- 🔁 **Diff vs API**: compare cache against a fresh API fetch (added/removed/changed).
- 🧾 **Exports**:
    - `creators.json` in the required array format
    - `creators.csv`
    - selection-only exports
    - `ids.txt` / `ids.json`
- 🧪 **Diagnostics**: duplicates, `creatorName` collisions, empty normalization results.

---

## Quickstart

```bash
git clone https://github.com/Daniel-Ric/CreatorGET-Service
cd CreatorGET-Service
npm i
cp .env.example .env
node bin/creatorservice.js
```

Optional global command via `npm link`:

```bash
npm link
creatorservice
```

---

## Configuration (Environment)

This CLI is configured via `.env` (loaded via `dotenv`) and validated with `joi`.

### General

| Variable          | Default        | Description |
| ---------------- | -------------- | ----------- |
| `NODE_ENV`       | `development`  | `development` \| `production` \| `test` |
| `LOG_PRETTY`     | `true`         | Pretty console output toggle |
| `HTTP_TIMEOUT_MS`| `25000`        | HTTP timeout in ms |
| `CACHE_DIR`      | `.cache`       | Cache directory |
| `CACHE_TTL_MS`   | `21600000`     | Cache freshness threshold in ms (0 disables) |
| `PAGE_SIZE`      | `20`           | Page size for browsing |
| `CREATORNAME_MODE` | `nospace`    | How `creatorName` is derived from `displayName` |
| `MC_TOKEN`       | *empty*        | Store auth token (`MCToken …`). If empty, CLI will prompt. |

### `CREATORNAME_MODE`

| Mode     | Behavior |
| -------- | -------- |
| `nospace` | Removes whitespace from `displayName` |
| `alnum`   | Keeps only `0-9 A-Z a-z _ -` |

Example:

| displayName | nospace | alnum |
| ---------- | ------- | ----- |
| `4J Studios` | `4JStudios` | `4JStudios` |
| `2-Tail Productions` | `2-TailProductions` | `2-TailProductions` |
| `Cool ✨ Studio` | `Cool✨Studio` | `CoolStudio` |

---

## Data Files & Local Storage

This CLI persists a few small files under `CACHE_DIR` (default `.cache/`). You can safely delete them at any time.

* `creators.cache.json` — cached creators list + `fetchedAt`
* `favorites.json` — your starred creator IDs

Example cache structure:

```json
{
  "fetchedAt": "2025-12-29T12:00:00.000Z",
  "creators": [
    {
      "creatorName": "4JStudios",
      "id": "master_player_account!28D0EC53875E6219",
      "displayName": "4J Studios"
    }
  ]
}
```

Favorites structure:

```json
{ "ids": ["master_player_account!28D0EC53875E6219"] }
```

---

## Runtime & Architecture

```
User ──► Interactive CLI (prompts)
              │
              ▼
        Marketplace Service
   (fetch session/config + transform)
              │
              ▼
   Cache + Favorites Store (JSON files)
              │
              ▼
        Exporters (JSON/CSV/IDs)
```

**Highlights**

* `services/marketplace.service.js` is the single source of truth for:
    * fetching store session config
    * extracting creators
    * normalization
    * diff + diagnostics helpers
* `ui/menu.js` contains all prompt-based UI flows.
* `cache/` and `favorites/` isolate disk storage.

---

## Security Model

* **MC_TOKEN** is treated as sensitive.
    * It is read from `.env` or entered via a **password prompt** (not echoed).
    * It is sent as the `authorization` header.
* Cached creators and favorites do **not** store the token.
* If you share logs/screenshots, ensure the token is not visible in your shell history.

---

## CLI

### Navigation & UI

* Use **Arrow keys** to navigate.
* Press **Enter** to select.
* In multi-select menus:
    * press **Space** to toggle selection
    * press **Enter** to confirm

The UI uses subtle colors (chalk) and includes a header showing:
- number of loaded creators
- cache timestamp (`fetchedAt`)
- `CREATORNAME_MODE`

### Main Menu Actions

| Action | What it does |
| ------ | ------------ |
| Refresh from API | Fetches latest creators and updates cache |
| Diff vs API | Fetches latest creators and compares with current cache |
| Browse creators | Paged list with details + clipboard + favorite toggle |
| Browse favorites | Same browser but only starred creators |
| Search (fuzzy) | Fuzzy search across name/id |
| Export creators.json | Writes full list as JSON |
| Export creators.csv | Writes full list as CSV |
| Export selection | Pick subset and export JSON/CSV |
| Export IDs | Writes `ids.txt` or `ids.json` |
| Health / diagnostics | Finds duplicates/collisions/odd normalization |
| Cache info | Shows cache file size + fetchedAt |

### Creator Details

Inside a creator entry you can:
- toggle favorite
- copy ID / displayName / creatorName
- copy JSON snippet for paste/use elsewhere

---

## Output Formats

### `creators.json` format

This is the primary output format used by this project:

```json
[
  {
    "creatorName": "100Media",
    "id": "master_player_account!C815378092EF16AB",
    "displayName": "100Media"
  },
  {
    "creatorName": "2-TailProductions",
    "id": "master_player_account!FAAF566E8298B9CB",
    "displayName": "2-Tail Productions"
  }
]
```

### CSV format

Headers:

```
creatorName,id,displayName
```

Values are quoted as needed and use standard CSV escaping.

### IDs export

* `ids.txt` — one ID per line
* `ids.json` — JSON array of IDs

---

## Caching & Diff Workflow

The cache allows you to:
- start instantly without an API call
- compare your last known registry with the current one

**Cache freshness**

If `CACHE_TTL_MS > 0`, the CLI will warn when cached data is older than the TTL and offer to refresh.

**Diff vs API**

Diff results are categorized as:
- **Added**: IDs present in fresh fetch but not in cache
- **Removed**: IDs present in cache but not in fresh fetch
- **Changed**: same ID exists in both but `displayName` / `creatorName` differs

After viewing the diff, you can optionally apply the latest data and update the cache.

---

## Diagnostics (Health)

The health menu is designed to catch issues that matter when you consume exports downstream:

- **Duplicate IDs**: indicates upstream duplication or transformation issues
- **creatorName collisions**: multiple creators normalize to the same `creatorName`
- **empty creatorName**: normalization produced an empty string (usually due to strict modes)

If collisions exist, the CLI can print a condensed list (limited to keep output readable).

---

## Error Model

Errors are surfaced as short console messages.

Typical causes:

* **Missing token**: `MC_TOKEN` not set and prompt canceled
* **401/403**: token invalid/expired or insufficient access
* **Timeouts**: `HTTP_TIMEOUT_MS` too low, network issues
* **Unexpected upstream shape**: store config changed and creator filter isn’t present

---

## Rate Limiting

This CLI does not enforce client-side rate limiting. If upstream responds with throttling or transient errors, reduce the frequency of refresh/diff calls and avoid rapid repeated fetches.

---

## Directory Layout

```
bin/
  creatorservice.js         # entrypoint
src/
  app.js                    # main runtime loop
  state.js                  # in-memory state
  config/
    env.js                  # env loading + validation
  services/
    marketplace.service.js  # fetch/transform/diff/diagnostics
  cache/
    creators.cache.js       # disk cache
  favorites/
    favorites.store.js      # favorites persistence
  export/
    json.export.js          # JSON writer
    csv.export.js           # CSV writer
    ids.export.js           # ids.txt / ids.json writers
  ui/
    theme.js                # color helpers
    menu.js                 # interactive CLI flows
  utils/
    fs.js                   # file helpers
    http.js                 # axios instance with keep-alive
    httpError.js            # lightweight error helpers
```

---

## Development & Utilities

### Install dependencies

```bash
npm i
```

### Run the CLI

```bash
node bin/creatorservice.js
```

### Use a custom env file

```bash
dotenv -e .env.local -- node bin/creatorservice.js
```

---

## Testing

Suggested test targets:

* Unit tests:
    * creator extraction + normalization
    * diff function correctness
    * collision detection
    * CSV writer escaping

* Integration tests:
    * cache read/write
    * favorites toggle + persistence

This repository is intentionally lightweight and does not include a test runner by default.

---

## Performance Tuning

* Increase `HTTP_TIMEOUT_MS` if you see timeouts on slower connections.
* Increase `PAGE_SIZE` if you prefer fewer pages (at the cost of larger UI lists).
* Prefer the cache when repeatedly exporting; only refresh when needed.

---

## Deployment

### Local

The CLI is designed to run anywhere Node.js 18+ is available.

### Global CLI

```bash
npm link
creatorservice
```

To remove the link later:

```bash
npm unlink
```

---

## Troubleshooting

* **Token prompt shows, but fetch fails**  
  Ensure `MC_TOKEN` starts with `MCToken ` and is still valid.

* **No creators loaded / empty list**  
  The upstream response may have changed, or your token lacks access to the store config endpoint.

* **Fuzzy search returns unexpected matches**  
  Adjust the search term; Fuse will prioritize close matches. If you need stricter matching, use longer terms or include part of the ID.

* **creatorName collisions**  
  Switch `CREATORNAME_MODE` to `alnum` or consume `id` as the unique key downstream.

* **Cache not used**  
  Ensure `CACHE_DIR` is writable and not blocked by permissions.

---

## FAQ

**Where do creators come from?**  
From the store session config payload under the `creator` store filter toggles.

**Is `creatorName` official?**  
No. It is a derived convenience field. The stable identifier is `id`.

**Can I export only a subset?**  
Yes. Use **Export selection**.

**Does this support multiple titles?**  
This project intentionally focuses on a single upstream endpoint that provides the creator toggles. Title/alias management is out of scope here.

---

## Contributing

1. Fork the repo and create a feature branch.
2. Keep changes focused on creators workflow and CLI UX.
3. Update the README when behavior changes.
4. Open a PR with a clear description and screenshots for UI changes.

---

## License

This project integrates third-party services (Minecraft / PlayFab). Ensure compliance with the provider’s terms of use and your internal policies.
