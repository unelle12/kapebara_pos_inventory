# Deploying Kapabara to Vercel

This guide walks you through a one-time production deployment of the Kapabara POS & Inventory app to Vercel, with a managed Postgres database.

The whole process takes about 10 minutes. The deploy is **deterministic and reproducible** — every redeploy uses the same `vercel.json` build pipeline, and the database schema lives in version-controlled Prisma migrations.

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier is fine)
- A managed Postgres database. Any of these work:
  - **[Neon](https://neon.tech)** (recommended — generous free tier, serverless-friendly)
  - **[Supabase](https://supabase.com)** (Postgres + extras you don't need)
  - **[Railway](https://railway.app)** / **[Render](https://render.com)** (simple VMs)
  - **[Prisma Postgres](https://www.prisma.io/postgres)** (zero-config, used in dev)
  - **AWS RDS** / **Google Cloud SQL** (if you have an existing org)
- A GitHub repo with this codebase pushed (or import directly from a local folder via the Vercel CLI)

## 1. Provision a Postgres database

Whichever provider you choose:

1. Create a new Postgres database (Postgres 14+ recommended)
2. Copy the **connection string**. It will look something like:
   ```
   postgresql://USER:PASS@HOST:5432/DBNAME?sslmode=require
   ```
3. **Most managed providers require `?sslmode=require`** on the query string. Add it if your provider's default URL doesn't include it.

> Keep the URL handy — you'll paste it into Vercel in step 3.

## 2. Import the repo into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** → select this repo
3. Vercel auto-detects:
   - Framework preset: **Next.js**
   - Build command: `prisma generate && prisma migrate deploy && next build` (from `vercel.json`)
   - Output directory: `.next`
   - Install command: `npm ci`
   - Region: **Singapore (`sin1`)** — closest to the Philippines for low latency
4. **Don't click Deploy yet.** Add the env vars first.

## 3. Add environment variables

In the Vercel project settings → **Environment Variables**, add the following for the **Production** environment (and optionally Preview):

| Name               | Value                                                 | Required? |
| ------------------ | ----------------------------------------------------- | --------- |
| `DATABASE_URL`     | Your Postgres connection string (from step 1)        | ✅         |
| `AUTH_SECRET`      | 32+ char random string. Generate with: `openssl rand -hex 32` | ✅         |
| `AUTH_TRUST_HOST`  | `true`                                                | ✅         |

> **Tip:** apply the same vars to the **Preview** environment too, but with a separate `DATABASE_URL` pointing to a staging DB if you want preview deploys to be isolated. Otherwise leave Preview envs blank and the build will fail there — which is fine; the production build is what matters.

## 4. Deploy

Click **Deploy**. Vercel will:

1. Clone the repo
2. Run `npm ci` (clean install from `package-lock.json`)
3. Run `prisma generate` (creates the typed Prisma client at `../generated/prisma`)
4. Run `prisma migrate deploy` (applies all pending migrations in order — your schema goes from empty → fully built)
5. Run `next build` (compiles the Next.js app)
6. Boot the production server in `sin1`

The first deploy takes ~2-4 minutes. Subsequent deploys (just code changes) take ~30-60 seconds because `npm ci` and the Prisma client are cached.

## 5. Seed production data (optional)

The schema is now applied, but the database is empty. To load the demo data (5 users, 15 products, 416 sales over 30 days):

```bash
# Pull env vars from Vercel to your local shell
vercel env pull .env.production

# Run the seed against the production DB
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d'=' -f2- | tr -d '"')" \
  npm run db:seed
```

> **Don't seed production if you don't want demo data.** You can instead create one user directly in the database with a bcrypt-hashed password, then sign in and create the rest from the UI.

## 6. Smoke-test the deployment

1. Visit `https://<your-app>.vercel.app` — you should be redirected to `/login`
2. Sign in with one of the seeded users (e.g. `owner@kapabara.test` / `password123` if you seeded)
3. Click through every page:
   - `/dashboard` — should show 4 KPI tiles, a sales chart, low-stock list
   - `/pos` — try adding a product to the cart and running checkout
   - `/products` — list + create flow
   - `/stock` — adjust a variant's stock
   - `/sales` — open a sale, refund it
   - `/reports` — pick a date range, view charts
   - `/users` — create a new staff member (owner only)
4. Open a browser print dialog on the receipt screen and verify the 80mm layout

## 7. Custom domain (optional)

Vercel project → **Settings** → **Domains**. Add `pos.yourdomain.com` and follow the DNS instructions. The platform auto-issues a Let's Encrypt cert. `AUTH_TRUST_HOST=true` (which is already set) means Auth.js will pick up the new domain automatically — no code changes needed.

## 8. Continuous deployment

From now on, every push to your default branch triggers a new production deploy. The full pipeline is `prisma generate && prisma migrate deploy && next build`. New migrations are applied automatically — **just add them locally with `npm run db:generate` and commit the resulting files under `prisma/migrations/`**.

## Troubleshooting

### "PrismaClientInitializationError" on first request

- Most likely the `DATABASE_URL` is wrong, the database is unreachable from Vercel's `sin1` region, or it lacks `?sslmode=require`. Check the function logs in Vercel → Logs.
- Try connecting from your local machine with the same URL: `psql "$DATABASE_URL" -c 'select 1'`

### "AUTH_TRUST_HOST" / "UntrustedHost" errors on sign-in

You forgot to set `AUTH_TRUST_HOST=true` in Vercel env vars. Add it and redeploy.

### Build fails with "Cannot find module ... generated/prisma"

The `postinstall: prisma generate` hook didn't run. The build command in `vercel.json` includes `prisma generate` explicitly to avoid this — make sure you didn't override it in the Vercel UI.

### Middleware is large (87 kB) and slow

Expected. The middleware bundles `jose` (JWT verification) for Auth.js v5. It's still well under Vercel's 1 MB middleware limit. If you ever need to slim it, look at the `jose` import path and tree-shaking config.

### Edge runtime crash: "setImmediate is not defined"

You accidentally imported `~/server/db` (or `bcryptjs`) from the middleware. Both belong in the Node runtime only. See `src/server/auth/config.ts` for the edge-safe split.

## Cost notes

- **Vercel free tier** is enough for a single small café. The first 100 GB of bandwidth and 100 GB-hours of serverless function time are free per month.
- **Neon free tier** includes 0.5 GB of Postgres storage, which is plenty for a single café (~1k sales/month = ~5 MB / year).
- For a multi-location chain, upgrade both. The app itself doesn't change — same code, same env vars, different plan.

## Rolling back

Vercel keeps every deploy. If a new deploy breaks:

1. Vercel → **Deployments**
2. Find the last green deploy
3. Click ⋯ → **Promote to Production**

Database migrations are **forward-only** by design. If a migration broke something, the fix is usually a follow-up migration, not a rollback. Don't delete files under `prisma/migrations/` once they've run in production.
