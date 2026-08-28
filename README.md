# Project Meru

**Project Meru** is an open-source software initiative and the GitHub Pages site for its projects. Each product has its own site, documentation, and repositories under [ProjectMeru](https://github.com/ProjectMeru).

## Published site

| URL                                        | Purpose              |
| ------------------------------------------ | -------------------- |
| https://projectmeru.github.io/             | Organisation hub     |
| https://projectmeru.github.io/sumeru/      | Sumeru product site  |
| https://projectmeru.github.io/sumeru/docs/ | Sumeru documentation |

## Projects

| Project     | Status           | Category             | Site               |
| ----------- | ---------------- | -------------------- | ------------------ |
| **Sumeru**  | Pre-alpha · live | ERP (Go, PostgreSQL) | [sumeru/](sumeru/) |
| **Tooling** | Planned          | Developer utilities  | —                  |
| **Infra**   | Planned          | Infrastructure       | —                  |

**Sumeru (pre-alpha).** There is no tagged release and no supported upgrade path. Do not use it for production workloads. Source code: [sumeru](https://github.com/ProjectMeru/sumeru), [sumeru_addons](https://github.com/ProjectMeru/sumeru_addons), [sumeru_custom_addons](https://github.com/ProjectMeru/sumeru_custom_addons).

## Repository contents

- `index.html`, `about.html` — Meru hub
- `sumeru/` — Sumeru marketing site and static documentation HTML
- `css/`, `js/` — hub assets
- `sitemap.xml`, `robots.txt`, `llms.txt` — discovery

## Development

```bash
python3 -m http.server 8000
# http://localhost:8000/  and  http://localhost:8000/sumeru/
```

Push to the default branch to publish on GitHub Pages.

**Maintainers (monorepo).** Edit docs HTML under `projectmeru.github.io/sumeru/docs/`. Prose mirrors live in `sumeru_docs/`. From the monorepo root: `make docs-mirror`, `make docs-nav`. Do not run `make docs-site` for routine updates.

## Licence

- **This site:** content as marked on each page.
- **Sumeru:** dual licensed — Community edition (Apache 2.0) and Enterprise edition (commercial licence, not yet available). See [editions](https://projectmeru.github.io/sumeru/editions.html).
