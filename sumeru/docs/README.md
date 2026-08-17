# Sumeru docs (website)

Hand-written HTML documentation for [Sumeru](https://projectmeru.github.io/sumeru/). **Do not run `make docs-site`** from the monorepo root — it regenerates the full site and replaces this layout.

## Tracks

| Track | Path | Audience |
| ----- | ---- | -------- |
| Guides | `/docs/` | Developers (35 pages) |
| Reference | `/docs/reference/` | Core developers |
| Addons | `/docs/addons/` | Addons developers |
| Business | `/docs/using/` + `/docs/guides/business/` | Business users |

Navigation, sidebars, and search index are generated from `nav.json`. After adding or reordering pages, run **`make docs-nav`** from the monorepo root.

## Editing workflow

1. Edit HTML under this directory (preserve article bodies, `docs-codebox` blocks, and CSS classes). Sidebars are injected by `js/docs.js` from `nav.json` — update `tools/generate-docs-nav.py` or `sumeru_docs/NAVIGATION.md`, then `make docs-nav`.
2. Refresh the markdown mirror: `make docs-mirror` (writes `sumeru_docs/website/` for Guides pages).
3. Optional: push prose-only updates back with `make docs-sync-body` (skips pages with `preserve_codeboxes: true`).

Source of truth for page structure is this website; `sumeru_docs/website/` tracks Guides content for search and future automation. Extended docs under `sumeru_docs/core/`, `addons/`, and `business/` feed Reference/Addons/Business track pages via `make docs-nav`.
