# Project Meru

**Project Meru** is the initiative. **Sumeru** is the framework it builds — a modular, open-source
ERP written in Go. That is the name you will find in the code, the CLI, the config file and the Go
module paths.

Every business function — contacts, products, CRM, sales, invoicing — is an addon: a folder with a
manifest, some Go models and some XML. The kernel discovers it, resolves its dependencies, creates
its tables and wires its menus. PostgreSQL underneath, server-rendered HTML on top, no front-end
build step anywhere.

> **Status: pre-alpha.** The framework runs and the lead-to-cash flow works end to end, but there is
> no tagged release, no upgrade path between versions, and no test suite on the business addons.
> Do not run your business on it yet.
>
> This repository hosts the project website. The framework itself lives in a separate repository.

---

## The idea

An ERP touches money, stock and payroll, so it has to be dependable for a decade. Most of the effort
in running one goes not to the business logic but to the machinery around it — the runtime, the
workers, the broker, the upgrade window. Sumeru is an attempt to spend that effort somewhere better.

1. **Deployment should be a copy.** Go compiles to one binary; the only thing beside it is Postgres.
2. **Customisation should not fork.** Your work lives in your own Go module, never in core.
3. **Your data should stay yours.** Models become real Postgres tables that any analyst can query.

## Three tiers, three Go modules

Sumeru is not one repository you fork. It is three modules linked by `replace` directives, each
depending only on the one below it.

| Tier | Module | What lives there |
| --- | --- | --- |
| Core | `sumeru` | The kernel (`core/`), the in-tree apps (`base`, `mail`, `automation`, `sumeru_ai`) and the `cmd/` binaries |
| Standard | `sumeru_addons` | The business addons: `contacts`, `product`, `crm`, `sale`, `sale_crm`, `account`, `purchase`, `hr` |
| Workspace | `sumeru_custom_addons` | Your own addons, your `sumeru.conf`, the generated import file — **and the `main.go` you actually run** |

```
sumeru_custom_addons     your workspace · runs the server
        │  replace sumeru_addons
        ▼
sumeru_addons            contacts · product · crm · sale · sale_crm
                         account · purchase · hr
        │  replace sumeru
        ▼
sumeru                   orm · module · engine · server · event
                         sdk · scheduler · applog · cache
        │  lib/pq
        ▼
PostgreSQL               one database · many companies
```

### The kernel

| Package | Responsibility |
| --- | --- |
| `core/orm` | Model registry, schema sync, CRUD, domains, ACLs, record rules, sessions, audit |
| `core/module` | Addon discovery, convention checks, dependency ordering, install/update, XML + CSV loader |
| `core/engine` | The UI: XML parser, HTML renderers, templates, view inheritance, static assets |
| `core/server` | Boot sequence, config, router, web handlers, JSON-RPC API |
| `core/event` | Synchronous in-process publish/subscribe |
| `core/sdk` | The stable façade addon authors import instead of reaching into `orm` |
| `core/scheduler` | Minute-tick runner for due `sys.cron` rows |
| `core/applog` | Structured JSON logging with optional rotation |
| `core/cache` | Small in-process TTL cache |
| `core/importgen` | Generates the blank-import file that links addons into the binary |

## Anatomy of an addon

```
account/
├── manifest.json              name, version, depends, data files
├── init.go                    package account — event subscriptions, blank-imports models
├── invoice.go                 the business logic
├── models/
│   ├── account_account.go     one file per model
│   ├── account_journal.go
│   ├── account_move.go
│   └── account_move_line.go
├── data/account_data.xml      seed chart of accounts and journals
├── security/security.xml      groups
├── security/sys.access.csv    per-model access rights
└── views/
    ├── account_views.xml      tree and form views, window actions
    └── menus.xml              the menu tree
```

### The manifest

```json
{
  "name": "account",
  "display_name": "Invoicing",
  "version": "1.0.0",
  "description": "Customer invoices, vendor bills, chart of accounts, and posted journal entries.",
  "author": "Sumeru",
  "depends": ["product", "contacts"],
  "data": [
    "security/security.xml",
    "security/sys.access.csv",
    "data/account_data.xml",
    "views/account_views.xml",
    "views/menus.xml"
  ],
  "application": true
}
```

`depends` drives install order and nothing else — it is not a Go import.

### A model

A model is metadata: a name and a list of fields. The kernel turns it into a table.

```go
package models

import "sumeru/core/sdk"

type AccountJournal struct {
	sdk.BaseModel
}

func (AccountJournal) ModelName() string { return "account.journal" }

func (AccountJournal) Fields() []sdk.FieldDefinition {
	return []sdk.FieldDefinition{
		{Name: "name", Type: sdk.Char, String: "Journal Name", Required: true},
		{Name: "code", Type: sdk.Char, String: "Short Code", Required: true},
		{Name: "default_account_id", Type: sdk.Many2One,
			Relation: "account.account", String: "Default Account"},
		{Name: "active", Type: sdk.Boolean, String: "Active", DefaultVal: true},
	}
}

func init() {
	sdk.RegisterModel(sdk.RegisterModelInput{Model: &AccountJournal{}, Module: "account"})
}
```

### Nothing imports sideways

No addon imports another addon's Go package. Invoicing reacts to a confirmed sales order it has no
compile-time knowledge of, and checks the registry before doing anything:

```go
func init() {
	event.Subscribe("record.updated", onSaleOrderToInvoice)
}

func onSaleOrderToInvoice(ctx context.Context, ev event.Event) error {
	if model, _ := ev.Payload["model"].(string); model != "sale.order" {
		return nil
	}
	if _, ok := orm.Registry["sale.order"]; !ok {
		return nil // Sales is not installed — nothing to do.
	}
	// … create the draft invoice, idempotently.
}
```

Uninstall Sales and Invoicing keeps working. The dependency graph between addons is therefore purely
declarative:

```
contacts → base            sale     → product, contacts, crm
product  → base            account  → product, contacts
crm      → base, contacts  purchase → account, product
hr       → base, contacts  sale_crm → sale, crm     (bridge, not an application)
```

## Getting started

You need **Go 1.26+** and **PostgreSQL**. Nothing else — no Node, no Docker, no message broker.
Every command runs from the workspace module, `sumeru_custom_addons`.

```bash
# 1. Database and config
psql -U postgres -c "CREATE DATABASE sumeru;"
cd sumeru_custom_addons
cp sumeru.conf.example sumeru.conf     # edit db_* and http_port

# 2. Point the workspace at the other two modules, then link the addons in
make replace-sumeru        SUMERU_ROOT=../sumeru
make replace-sumeru-addons ADDONS_ROOT=../sumeru_addons
make generate

# 3. First boot — the server enters SETUP MODE
make run
#    → open http://localhost:9090/setup

# 4. Install the business addons
go run . -- -c sumeru.conf \
  -i contacts,product,crm,sale,sale_crm,account,purchase,hr \
  --stop-after-init

# 5. Run it
make run
#    → open http://localhost:9090/
```

There is **no default admin account**. The `/setup` wizard creates the first company and the first
user; the email you give it becomes the login. Install order follows `depends`, and `-i all` is
rejected on purpose.

### The inner loop for a new addon

```bash
# scaffold — manifest, init.go, models, views, menus, security
go run ../sumeru/cmd/sumeru-bp -name my_module -out ./addons

# link it into the binary, then install it once
make generate
go run . -- -c sumeru.conf -i my_module --stop-after-init

# after editing XML or the manifest's data list, reload it
go run . -- -c sumeru.conf -u my_module --stop-after-init
```

Go changes need a rebuild — that is what `make run` does. XML changes need `-u`, because views,
menus and access rules live in the database once installed.

### Server flags

| Flag | What it does |
| --- | --- |
| `-c <path>` | Config file to read (defaults to `sumeru.conf`) |
| `-i <mods>` | Install addons, comma-separated; `all` is rejected |
| `-u <mods>` | Reload addon data and schema; `-u all` is allowed |
| `-d`, `--database` | Override the database name from the config |
| `-p`, `--http-port` | Override the listen port from the config |
| `--stop-after-init` | Exit after `-i`/`-u` instead of serving |

## What works, and what does not

**Works today.** Lead → won → quotation → sales order → customer invoice → posted, balanced journal
entries. Purchase order → vendor bill. Groups, access rights and per-salesperson record rules. Apps
installed and removed from the interface. Multiple companies in one database. A JSON-RPC API at
`POST /api/rpc` exposing `search`, `search_read`, `read`, `create`, `write` and `unlink`.

**Does not exist yet.** Taxes. Payments and reconciliation. Computed totals on orders. Inventory,
warehouses and manufacturing. Printable documents and financial statements. Automated tests on the
business addons.

## Website

The site in this repository is deliberately plain: hand-written HTML, one CSS file, one JavaScript
file. No frameworks, no build step, no bundler.

```
.
├── index.html      # the site
├── css/style.css   # all styling, tokenised for light and dark themes
├── js/main.js      # theme, nav, scrollspy, tabs, filters, reveal-on-scroll
└── README.md
```

Colour is defined once, as CSS custom properties, in two blocks: `:root[data-theme="light"]` and
`:root[data-theme="dark"]`. Nothing else in the stylesheet hard-codes a colour, so retheming means
editing those two blocks. The visitor's choice is stored in `localStorage` under `meru-theme` and
applied by a small inline script in `<head>` before first paint; with no stored choice the site
follows the operating system setting.

### Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser — nothing requires a server.

### Deploying

The site is served by GitHub Pages from the default branch. Pushing to `main` publishes it; there is
no build stage to wait on.

## Contributing

The project is at the stage where design feedback is worth more than code. If you have operated an
ERP in production and know exactly where it hurt, say so — that is the input the addon contract
needs most.

## License

Sumeru is dual licensed.

- **Community edition — Apache 2.0.** The framework and the standard business addons. Free for
  commercial use, modification and redistribution, with no copyleft on the addons you write against
  it. Nothing that is open source today will be moved behind the commercial licence.
- **Enterprise edition — commercial licence.** Additional addons and services on top of the same
  core. Not available yet; the project is pre-alpha.
