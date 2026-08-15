# Project Meru

**Project Meru** is an open-source initiative that hosts software across categories.
**Sumeru** is the first product - a modular ERP framework written in Go.

This repository is the GitHub Pages site:

| URL | What it is |
| --- | --- |
| https://projectmeru.github.io/ | Organisation hub and project catalogue |
| https://projectmeru.github.io/sumeru/ | Sumeru product website |
| https://projectmeru.github.io/sumeru/docs/ | Sumeru documentation |

> **Sumeru status: pre-alpha.** The framework runs and the lead-to-cash flow works end to end, but
> there is no tagged release, no upgrade path between versions, and no test suite on the business
> addons. Do not run your business on it yet.
>
> The framework itself lives in a separate repository under [ProjectMeru](https://github.com/ProjectMeru).

---

## Site layout

```
.
├── index.html              # Project Meru hub
├── about.html              # initiative / naming
├── css/meru.css            # hub styles (Sillo-family, light/dark)
├── js/meru.js              # card-nav, theme, reveal
├── og.png                  # Open Graph image (1200×630)
├── sumeru/
│   ├── index.html          # product landing
│   ├── architecture.html     # visual architecture overview (links to docs)
│   ├── addons.html
│   ├── editions.html
│   ├── roadmap.html
│   ├── faq.html
│   ├── about.html
│   ├── docs/               # install + guides (open via Get started)
│   │   ├── index.html      # Introduction
│   │   ├── css/docs.css
│   │   ├── js/docs.js
│   │   └── guides/         # start, build, concepts, business, security
│   ├── css/sumeru.css      # product styles (teal accent, light/dark)
│   ├── js/sumeru.js
│   └── og.png              # Open Graph image (1200×630)
├── sitemap.xml
├── robots.txt
├── llms.txt
└── README.md
```

Hand-written HTML for marketing pages; **documentation content pages are generated** from
`sumeru_docs/` in the monorepo via `make docs-site` (see `tools/docs-publish/`). Edit markdown
there, not individual guide HTML under `sumeru/docs/using/`, `build/`, etc.

Both sites share a Sillo-inspired visual family: floating pill **card-nav**, Instrument Sans +
JetBrains Mono, slightly raised panels, numbered sections, GitHub link, and light/dark theme toggle.
Meru uses a blue accent; Sumeru uses teal. Dark is the default; the toggle persists per site.

### Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
# and http://localhost:8000/sumeru/
```

### Deploying

GitHub Pages serves from the default branch. Pushing to `main` publishes it.

---

## Sumeru (product summary)

Business functions are addons: contacts, products, CRM, sales, invoicing. Each addon is a folder with a
manifest, some Go models and some XML. The kernel discovers it, resolves its dependencies, creates
its tables and wires its menus. PostgreSQL underneath, server-rendered HTML on top, no front-end
build step.

Three Go modules linked by `replace` directives:

| Tier | Module | What lives there |
| --- | --- | --- |
| Core | `sumeru` | Kernel + in-tree apps (`base`, `mail`, `automation`, `sumeru_ai`) |
| Standard | `sumeru_addons` | Business addons |
| Workspace | `sumeru_custom_addons` | Your addons, `sumeru.conf`, and the `main.go` you run |

Full product docs: [sumeru/docs/](./sumeru/docs/). Product site: [sumeru/](./sumeru/).

## Licence

Sumeru is dual licensed.

- **Community edition: Apache 2.0.** Framework and standard business addons.
- **Enterprise edition: commercial licence.** Planned addons and services on the same core. Not
  available yet.

Nothing that is open source today will be moved behind the commercial licence.
