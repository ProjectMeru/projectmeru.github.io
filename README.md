# Project Meru

**Project Meru** is an open-source initiative that hosts software across categories.
**Sumeru** is the first product — a modular ERP framework written in Go.

This repository is the GitHub Pages site:

| URL | What it is |
| --- | --- |
| https://projectmeru.github.io/ | Organisation hub and project catalogue |
| https://projectmeru.github.io/sumeru/ | Sumeru product website |

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
├── css/meru.css            # hub styles (Sillo-family dark)
├── js/meru.js              # card-nav, reveal
├── sumeru/
│   ├── index.html          # product landing
│   ├── getting-started.html
│   ├── architecture.html
│   ├── addons.html
│   ├── editions.html
│   ├── roadmap.html
│   ├── faq.html
│   ├── about.html
│   ├── css/sumeru.css      # product styles (teal accent)
│   └── js/sumeru.js
├── sitemap.xml
├── robots.txt
├── llms.txt
└── README.md
```

Hand-written HTML, CSS and JavaScript only. No frameworks, no build step, no bundler.

Both sites share a Sillo-inspired dark visual family: floating pill **card-nav**, Instrument Sans +
JetBrains Mono, elevated surfaces, numbered sections. Meru uses a blue accent; Sumeru uses teal.

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

Every business function — contacts, products, CRM, sales, invoicing — is an addon: a folder with a
manifest, some Go models and some XML. The kernel discovers it, resolves its dependencies, creates
its tables and wires its menus. PostgreSQL underneath, server-rendered HTML on top, no front-end
build step.

Three Go modules linked by `replace` directives:

| Tier | Module | What lives there |
| --- | --- | --- |
| Core | `sumeru` | Kernel + in-tree apps (`base`, `mail`, `automation`, `sumeru_ai`) |
| Standard | `sumeru_addons` | Business addons |
| Workspace | `sumeru_custom_addons` | Your addons, `sumeru.conf`, and the `main.go` you run |

Full product docs: [sumeru/](./sumeru/).

## Licence

Sumeru is dual licensed.

- **Community edition — Apache 2.0.** Framework and standard business addons.
- **Enterprise edition — commercial licence.** Planned addons and services on the same core. Not
  available yet.

Nothing that is open source today will be moved behind the commercial licence.
