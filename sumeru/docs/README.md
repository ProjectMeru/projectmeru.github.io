# Sumeru docs (website)

Hand-written HTML documentation for [Sumeru](https://projectmeru.github.io/sumeru/). **Do not run `make docs-site`** from the monorepo root — it regenerates the full site and replaces this layout.

## Editing workflow

1. Edit HTML under this directory (preserve sidebar shell, `docs-codebox` blocks, and CSS classes).
2. Refresh the markdown mirror: `make docs-mirror` (writes `sumeru_docs/website/`).
3. Optional: push prose-only updates back with `make docs-sync-body` (skips pages with `preserve_codeboxes: true`).

Source of truth for page structure is this website; `sumeru_docs/website/` tracks content for search and future automation.
