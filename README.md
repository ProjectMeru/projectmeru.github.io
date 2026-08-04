# Project Meru

A modular, open-source ERP built in Go.

Project Meru is a modular ERP written in Go — a single platform where every
business function is a swappable module — and rebuilds it on a Go core: one static
binary, predictable memory, and modules that load without a redeploy.

> **Status: pre-alpha.** The core kernel and module contract are being designed in the
> open. Nothing here is production-ready yet. This repository hosts the project website.

---

## Why another ERP?

Existing open-source ERPs are powerful but heavy. They ship interpreted runtimes, deep
dependency trees, and an ORM that assumes it owns the database. Teams end up paying for
that in RAM, cold starts, and upgrade pain.

Meru's bet is simple:

| Concern       | Meru's approach                                       |
| ------------- | ----------------------------------------------------- |
| Deployment    | One static binary, no runtime to install              |
| Extensibility | Modules registered against a stable Go interface      |
| Data          | Postgres-first, plain SQL and migrations you can read |
| Multi-tenancy | Tenant isolation in the kernel, not bolted on         |
| API           | REST + gRPC generated from the same module schema     |
| UI            | Server-rendered pages, no mandatory SPA build step    |

## Architecture

```
                 ┌──────────────────────────────┐
                 │           Meru Kernel        │
                 │  registry · auth · tenancy   │
                 │  ORM · jobs · events · RBAC  │
                 └──────────────┬───────────────┘
                                │  module contract
     ┌───────────┬──────────────┼──────────────┬───────────┐
     │           │              │              │           │
 ┌───┴────┐ ┌────┴────┐   ┌─────┴────┐   ┌─────┴───┐  ┌────┴────┐
 │Accounts│ │Inventory│   │   CRM    │   │   HR    │  │  Your   │
 │        │ │         │   │          │   │         │  │ module  │
 └────────┘ └─────────┘   └──────────┘   └─────────┘  └─────────┘
```

Every module declares its models, permissions, routes, menus, and event
subscriptions. The kernel wires them together at boot and resolves dependencies
between modules before any of them serve traffic.

### The module contract

```go
type Module interface {
    Name() string
    Version() string
    Requires() []string
    Models() []meru.Model
    Routes(r meru.Router)
    OnInstall(ctx context.Context, tx meru.Tx) error
}
```

That is the whole surface. If a module satisfies it, the kernel can install,
upgrade, and uninstall it — including its tables and its permissions.

## Planned modules

**Phase 1 — Foundation**

- Kernel: module registry, dependency resolution, migrations
- Identity: users, roles, permissions, API tokens
- Tenancy: schema-per-tenant isolation

**Phase 2 — Core business**

- Accounting: chart of accounts, journals, ledgers, tax rules
- Inventory: warehouses, stock moves, valuation
- Sales & Purchase: quotations, orders, invoicing

**Phase 3 — Extended**

- CRM: pipelines, activities, lead scoring
- HR: employees, attendance, payroll hooks
- Manufacturing: bills of materials, work orders

**Phase 4 — Platform**

- Studio: define models and views without writing Go
- Marketplace: publish and install third-party modules
- Reporting: query builder, scheduled exports

## Website

The site in this repository is deliberately plain: hand-written HTML, one CSS file,
one JavaScript file. No frameworks, no build step, no bundler.

```
.
├── index.html      # the site
├── css/style.css   # all styling
├── js/main.js      # nav, scrollspy, tabs, reveal-on-scroll
└── README.md
```

### Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` in a browser — nothing requires a server.

### Deploying

The site is served by GitHub Pages from the default branch. Pushing to `main`
publishes it; there is no build stage to wait on.

## Contributing

The project is at the stage where design feedback is worth more than code. If you
have run an ERP in production and know where the existing ones hurt, open an issue
and say so.

## License

Intended to be released under the Apache 2.0 license.
