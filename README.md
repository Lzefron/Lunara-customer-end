# Lunara customer catalog

React + TypeScript + Vite storefront for Lunara Bangladesh. Browse only, with a
daily feed, categories and subcategories, search/sort/availability filters,
product photo galleries, shareable product links, and a local “plan to order”.
Facebook/Instagram links belong to Lunara. No orders are submitted by this app.

## Local setup

1. `npm ci`
2. Copy `.env.example` to `.env` and set the same Supabase URL and **public anon
   key** used by Lunara Manager.
3. Apply Manager's `supabase/migrations/0004_customer_catalog.sql` after its
   existing 0001–0003 migrations. It adds publishing fields and a safe public
   RPC without exposing private tables or making the photo bucket public.
4. `npm run dev`; verify with `npm test` and `npm run build`.

## Publish on Vercel

Import `Lzefron/Lunara-customer-end`, select Vite, and add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production and Preview.
Deploy. `vercel.json` defines SPA routing and a daily database activity check at
02:17 UTC (08:17 Bangladesh time; Vercel may run within that hour on Hobby).
The check needs no extra secret or privileged database key. Check current hosting
plan eligibility and quotas in your account; this repository creates no paid plan.

## Daily use

- In Manager: sign in once with the existing shared account and sync.
- Open **Customer catalog** to add main categories or subcategories.
- Edit a product, choose its category/subcategory, write its customer-facing
  description, and enable **Show in customer catalog**. Existing products are
  private until you explicitly enable this.
- **Feature in the daily feed** prioritizes a product. Featured and regular
  products each rotate at midnight in Asia/Dhaka; the feed uses existing catalog
  content, so one item cannot produce new content by itself.
- Manager syncs after edits, every 30 seconds while visible, and on reconnect.
  Customers refresh within one minute, or immediately on returning to the page.
- Trash/unpublish in Manager to remove a product from the storefront after sync.
- Customers tap hearts to save products on their own browser. **Copy my list**
  prepares current prices and product links to paste in a Facebook chat. The
  customer still confirms stock, delivery fees, and the final total with you.

## Supabase availability

The daily Vercel cron generates a few real database reads to reduce inactivity.
Free-plan pausing is based on sufficient activity over a week, and remains
Supabase's decision. This check cannot resume an already paused project or
guarantee uptime. See [Supabase's policy](https://supabase.com/docs/guides/platform/free-project-pausing).
If paused, resume in the Supabase dashboard and retry sync. Manager retains local
changes when the connection fails. Catalog refresh failures show an honest status.

See [the API contract](docs/catalog-api.md) for the public-data boundary.
