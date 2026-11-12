# Stride — finished footwear inventory

A functioning Next.js/TypeScript application for **finished, saleable footwear only**. PostgreSQL maintains a permanent movement ledger and nonnegative balances for loose stock and identified physical cartons. It includes Owner/Staff access, receiving, mixed cartons, partial/full dispatch, packaging movements, corrections, reversals, reports, imports and printable documents.

This repository is the deployable deliverable. It has not been published to an external hosting account. See `docs/VERIFICATION.md` for checks performed and deployment limits.

## Run locally (Windows PowerShell)

Requires Node.js 24 LTS. A local PostgreSQL installation is optional for development.

```powershell
Set-Location 'C:\Users\aggar\OneDrive\Documents\ChatGPT\inventory tracking system'
npm ci
Copy-Item .env.example .env
```

Edit `.env`: set `SEED_OWNER_USERNAME` and a unique `SEED_OWNER_PASSWORD` of at least 12 characters. Set `SEED_DEMO=true` only for a sample workspace. Leave `DATABASE_URL` commented out to use embedded PostgreSQL in `.data/stride`.

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Open **http://localhost:3000** and sign in using the credentials you supplied. Use `localhost`, matching `APP_ORIGIN`; opening the same server through `127.0.0.1` will fail the origin check unless you change `APP_ORIGIN` accordingly. Remove `SEED_OWNER_PASSWORD` from `.env` after initialization. Seed never overwrites an existing account or re-adds sample stock.

The embedded development database is persistent. Run only one application process against its directory, and stop the app before running migration/seed commands. Production deliberately refuses to use embedded storage.

For local standard PostgreSQL, set `DATABASE_URL` to your PostgreSQL 15+ connection URL before migrating. Do not point test commands at production databases.

## Daily workflow

1. **Article & masters:** Owner creates articles, unique variants/SKUs, locations/bins and customers. Colours, size systems and fit belong to variants. Archive articles/variants to stop new receipts while still dispatching existing stock.
2. **Receive stock:** Staff or Owner adds loose lines or generates multiple unique cartons with an exact composition. For mixed cartons, add multiple SKU lines. The composition is repeated per new carton; capacity is a maximum.
3. **Carton register:** scan a keyboard-wedge barcode, inspect contents/history, print Code 128 labels, create empty cartons, open/seal, pack, unpack or split. Owner can transfer loose stock or complete cartons between locations.
4. **Dispatch stock:** select customer, individual loose/carton lines and/or whole cartons. Remove the default individual line if dispatching only whole cartons. Review the confirmation before posting. Whole-carton selection includes every current SKU exactly once.
5. **Activity & slips:** inspect and print documents; Staff sees their own transaction history. Request reversal with a reason. Carton operational history remains visible to operators so they can identify its contents and status.
6. **Stock corrections:** Owner reviews opening CSV, records opening stock/corrections, and approves or rejects reversal requests. No API deletes posted transactions.
7. **Reports:** reconciliation by SKU/location and period, inward/dispatch by operator/customer, CSV/XLSX registers and full movement/audit exports. In-app history shows the latest 500 documents; exports include the full ledger and dispatch history.

Staff can change their own password. Owner can create/deactivate accounts, rename usernames and issue temporary passwords; all affected sessions are revoked. A temporary password must be changed before stock access. The final active Owner cannot be deactivated or demoted.

## Tests and build

```powershell
npm run typecheck
npm test
npm run test:postgres
npm run build
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.data\browsers'
npx playwright install chromium
npm run test:e2e
```

`npm test` creates an in-memory PostgreSQL-compatible database and runs integration/domain tests. `test:postgres` starts a native PostgreSQL cluster on a random loopback port and uses independent pooled connections, then stops it. Test data is retained in `.data/pg-test-*` for inspection; no OS user is created. Alternatively set `TEST_DATABASE_URL` to a disposable PostgreSQL database and run `npm test`. The final-Owner case uses its own isolated database.

Playwright starts a separate app on port 3100 with a unique seeded database, random credentials and a workspace-local Chromium browser. It exercises actual HTTP endpoints and browser interactions, including server permission denial. CI is configured to run the suite against PostgreSQL 17 as well. Browser credentials and sessions must never be uploaded from local test artifacts.

## Accounting and architecture

See `docs/ARCHITECTURE.md` for the model, permission matrix and endpoint contract. Explicit SQL is used instead of Prisma so `NULLS NOT DISTINCT` bucket uniqueness, deferred integrity triggers, immutable ledger rules, guarded debits and advisory locking stay visible and testable.

Core invariant: **total pairs = loose pairs + pairs in cartons**. Carton count is the number of distinct nonempty physical cartons. Packing creates two ledger legs with zero net pairs. A dispatch deducts only its selected bucket. All legs, statuses, audit events and reversal approvals commit together.

## Production deployment

See `docs/DEPLOYMENT.md` for exact Docker Compose, restricted database role, TLS, backup and restore commands. Deployment requires a domain and a persistent PostgreSQL database. Docker services and public TLS provisioning were not run on this development host.

No raw materials, components, production/WIP, manufacturing, BOM, procurement, payroll or retail POS modules are included.
