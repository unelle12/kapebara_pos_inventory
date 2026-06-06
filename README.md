# Kapabara — POS & Inventory

A warm, fast point-of-sale and inventory system for the Kapabara capybara café. Built end-to-end as a single Next.js application: live dashboard, catalog, stock, suppliers, restock, POS terminal, sales history with refunds, reports, and user/role management.

## Stack

| Layer        | Tech                                                   |
| ------------ | ------------------------------------------------------ |
| Framework    | Next.js 15 (App Router, Server Components, RSC actions) |
| Language     | TypeScript 5 (strict, `noUncheckedIndexedAccess`)       |
| API          | tRPC v11 (typed end-to-end)                            |
| Database     | PostgreSQL via Prisma 6 (custom client output path)    |
| Auth         | Auth.js v5 (Credentials, JWT, Prisma adapter, bcrypt)  |
| Styling      | Tailwind CSS 4 (OKLCH tokens, light/dark)              |
| UI           | Radix primitives + shadcn-style CVA components         |
| Charts       | Recharts                                               |
| Toasts       | Sonner                                                 |
| Tables       | TanStack Table v8                                      |
| Forms        | react-hook-form + Zod                                  |
| Fonts        | Geist (UI), Fraunces (display), JetBrains Mono (KP-)   |
| Deploy       | Vercel (Singapore region), Postgres anywhere           |

## Quickstart (local dev)

```bash
# 1. Install deps + generate Prisma client
npm install

# 2. Copy env template and fill in secrets
cp .env.example .env
# Edit .env: set DATABASE_URL, AUTH_SECRET (use `openssl rand -hex 32`)

# 3. Bring up Postgres (any of these work)
#    a) Prisma Postgres: ./start-database.sh
#    b) Local Postgres:   createdb kapabara
#    c) Docker:           docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16

# 4. Apply schema + seed demo data (5 users, 15 products, 416 sales)
npm run db:reset

# 5. Run the app
npm run dev          # http://localhost:3000

# 6. Sign in (all passwords: password123)
#    owner@kapabara.test    (OWNER)  - full access
#    manager@kapabara.test  (MANAGER) - everything except /users
#    anna@kapabara.test     (CASHIER) - /pos, /sales (read-only), dashboard
#    ben@kapabara.test      (CASHIER) - same
```

## Environment variables

Validated at build time by `src/env.js`. See `.env.example` for the full list with comments.

| Variable          | Required | Notes                                              |
| ----------------- | -------- | -------------------------------------------------- |
| `DATABASE_URL`    | ✅       | Postgres URL. Add `?sslmode=require` for cloud.    |
| `AUTH_SECRET`     | ✅       | 32+ char secret. `openssl rand -hex 32`            |
| `AUTH_TRUST_HOST` | ✅ prod  | `true` when behind a proxy (Vercel, Netlify, …)    |
| `BLOB_READ_WRITE_TOKEN` | dev upload | Vercel Blob — needed in dev to upload product images. Auto-injected on Vercel. |
| `NODE_ENV`        | auto     | `production` on deploy, `development` locally      |

## Scripts

| Script              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Dev server with Turbopack (fast refresh)             |
| `npm run build`     | Production build (`prisma generate` runs on postinstall) |
| `npm run start`     | Start the production build                           |
| `npm run typecheck` | `tsc --noEmit`                                       |
| `npm run lint`      | Next.js ESLint                                       |
| `npm run check`     | lint + typecheck                                     |
| `npm run db:seed`   | Seed demo data (idempotent — re-run safe)           |
| `npm run db:reset`  | Drop, migrate, and re-seed (DESTRUCTIVE)             |
| `npm run db:migrate`| Apply pending migrations (used in CI/Vercel)        |
| `npm run db:push`   | Push schema without migrations (dev only)            |
| `npm run db:studio` | Open Prisma Studio                                   |
| `npm run format:write` | Prettier on all TS/TSX/MDX files                 |

## Architecture

```
src/
├── app/                      # Next.js App Router
│   ├── (app)/                # Authenticated shell (sidebar + topbar)
│   │   ├── dashboard/        # Manager+ KPIs, sales chart, low stock, top products
│   │   ├── pos/              # Cashier terminal (cart, checkout, receipt)
│   │   ├── products/         # Catalog (list, create, edit, variants)
│   │   ├── stock/            # Variants + adjust stock + CSV export
│   │   ├── suppliers/        # Suppliers + restock wizard
│   │   ├── sales/            # Sales history + refund dialog
│   │   ├── reports/          # 7-section manager report
│   │   └── users/            # Owner-only user/role management
│   ├── api/                  # Route handlers (auth, stock CSV export)
│   ├── login/                # Public login
│   └── layout.tsx            # Root layout, fonts, providers, toaster
│
├── components/
│   ├── ui/                   # Primitives (Button, Dialog, Skeleton, EmptyState, …)
│   ├── layout/               # AppShell, Sidebar, Topbar, MobileNav, SkipLink
│   ├── dashboard/  pos/  products/  stock/  supplier/  sales/  reports/  user/
│   │                                                                    # Feature components
│   └── …                                                                     │
│
├── server/                   # Server-only code
│   ├── api/
│   │   ├── root.ts           # tRPC router aggregator
│   │   ├── trpc.ts           # Procedures + middleware
│   │   └── routers/          # system, auth, dashboard, product, stock,
│   │                         # supplier, user, pos, sale, report
│   ├── auth/
│   │   ├── config.ts         # Edge-safe Auth.js config (no Prisma, no bcrypt)
│   │   └── index.ts          # Full Auth.js setup (Node runtime, with Credentials)
│   └── db.ts                 # Prisma client singleton
│
├── lib/                      # Cross-cutting helpers
│   ├── auth-helpers.ts       # requireUser, requireRole
│   ├── permissions.ts        # ROLE_LABELS, hasRole
│   ├── nav.ts                # Sidebar sections (role-aware)
│   └── utils.ts              # cn, formatCurrency, formatDate, …
│
├── styles/globals.css        # Tailwind 4 @theme tokens, animations, 80mm print
└── middleware.ts             # Edge middleware (auth guard)
```

### Data model (15 models)

`User · Account · Session · VerificationToken · Category · Supplier · Product · ProductVariant · StockMovement · PurchaseOrder · PurchaseOrderItem · Sale · SaleItem · Refund`

All money is stored as `Decimal(10,2)` (PHP). All FKs use `cuid()` IDs. `UserRole` is a Postgres enum: `OWNER | MANAGER | CASHIER`.

### Auth flow

`middleware.ts` runs in the Edge Runtime and uses an **edge-safe** slice of the Auth.js config (`src/server/auth/config.ts`) — no Prisma, no bcrypt. The full config (with the Credentials provider, bcrypt verification, and DB lookups) lives in `src/server/auth/index.ts` and is used only by Node-runtime code: route handlers, server components, server actions. This split is required because the Prisma client uses the WASM engine in Edge, which calls `setImmediate` — a Node-only API.

### Critical invariants (enforced server-side)

- **Sale prices are never trusted from the client.** `sale.checkout` re-reads the variant price inside a Prisma transaction.
- **Stock is decremented atomically with sale creation.** Out-of-stock or stock-modification races are caught by the transaction and surfaced as `BAD_REQUEST`.
- **Refunds restore stock and are themselves atomic.** Re-refunding a refunded sale returns `BAD_REQUEST`.
- **Last-OWNER + self-demotion/self-deactivation are blocked** in `user.update` and `user.toggleActive`.

## Deployment

See **[DEPLOY.md](./DEPLOY.md)** for a step-by-step Vercel guide. In short:

1. Push the repo to GitHub
2. Import it into Vercel (framework auto-detected as Next.js)
3. Add three env vars: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`
4. Vercel runs `prisma generate && prisma migrate deploy && next build` (see `vercel.json`)
5. Visit the deployment URL and sign in

Region is set to `sin1` (Singapore) in `vercel.json` for low latency from the Philippines. Header hardening (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) and immutable caching for `/_next/static` are included out of the box.

## License

Private project. All rights reserved.
