# fixfind.cc

Global Repair & Compatibility Database. Daily-autonomous SEO surface for AliExpress affiliate revenue + Google AdSense.

```
Gemini 1.5 Pro  ─►  10 repair entries (brand, model, error, fix, part)
                       │
                       ▼
AliExpress affiliate.product.query (SALE_PRICE_ASC, rate ≥ 85%)
                       │
                       ▼
AliExpress affiliate.link.generate  (tracking_id)
                       │
                       ▼
Supabase parts_db  (UPSERT by slug `brand/model`)
                       │
                       ▼
Next.js revalidatePath('/') + ('/[brand]/[model]', 'page')
```

## Bootstrap (PowerShell)

```powershell
Set-Location Q:\SideProjects\fixfind-cc
.\setup.ps1
```

This:
1. Verifies Node 20+
2. `npm install`
3. Creates `.env.local` + auto-generates `CRON_SECRET`
4. Verifies `.gitignore` blocks `.env*` (Zero-Leak Policy)

## Required env vars

See `.env.local.example`. The setup script writes a 32-byte hex `CRON_SECRET` for you.

| Var | Where |
|-----|-------|
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `ALIEXPRESS_APP_KEY` / `_SECRET` / `_TRACKING_ID` | https://portals.aliexpress.com (1–2 day approval) |
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | https://supabase.com/dashboard |
| `NEXT_PUBLIC_SITE_URL` | `https://fixfind.cc` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | optional, after AdSense approval |

## Deploy

```bash
npx vercel link
# add each var to production environment
npx vercel --prod
```

Vercel Cron in `vercel.json` runs `/api/cron/sync` daily at 18:00 UTC (03:00 KST). The GitHub Action in `.github/workflows/auto-update.yml` is a redundant fallback — set repo secrets `VERCEL_BASE_URL` and `CRON_SECRET`.

## Security posture

- `.env*` git-ignored, only `.env.local.example` tracked
- `CRON_SECRET` validated with `timingSafeEqual` + length pre-check
- Supabase RLS: `anon` = SELECT only, `service_role` = ALL
- AliExpress: HMAC-SHA256 signed, GMT+8 timestamp, params sorted
- Security headers in `next.config.mjs` (X-Frame-Options, nosniff, Referrer-Policy)
- Affiliate links: `rel="sponsored nofollow noopener"`, footer disclosure

## Files

| Path | Purpose |
|------|---------|
| `app/api/cron/sync/route.ts` | Daily pipeline (auth: `Authorization: Bearer $CRON_SECRET`) |
| `app/page.tsx` | Public home — grouped by brand, ad slots |
| `app/[brand]/[model]/page.tsx` | Wiki-style page, generateStaticParams, AffiliateCTA |
| `lib/gemini.ts` | Gemini 1.5 Pro researcher (JSON mode + sanitize) |
| `lib/aliexpress.ts` | AliExpress affiliate client (cheapest-first) |
| `lib/supabase.ts` | Admin/public clients + UPSERT |
| `lib/slug.ts` | URL-safe slug generator |
| `components/AdSlot.tsx` | AdSense slot (placeholder if no client) |
| `components/AffiliateCTA.tsx` | "Check Current Price on AliExpress" CTA |
| `supabase/schema.sql` | `parts_db` + `sync_runs` + RLS policies |
| `vercel.json` | Vercel Cron daily |
| `.github/workflows/auto-update.yml` | GitHub Actions fallback trigger |
| `setup.ps1` | PowerShell bootstrap |

## Verification after deploy

1. `GET /api/cron/sync` with `Authorization: Bearer $CRON_SECRET` returns 200 / `ok:true`
2. `SELECT count(*) FROM parts_db;` shows growing entries
3. `https://fixfind.cc/<brand>/<model>` renders wiki page
4. `sync_runs` records each daily run
