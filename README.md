# Lunara customer catalog

Live storefront: https://lunara-customer-end.pages.dev
Manager: https://lunara-manager.vercel.app

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

## Free business hosting on Cloudflare Pages

The production site uses Cloudflare Pages' free static hosting, with a provided
`pages.dev` address. Run `npm ci` and `npm run build`, then upload the contents of
`dist/` (or a ZIP containing them) using Pages' direct-upload dashboard. Product
updates come from Manager through Supabase and require no new website deployment.
Source-code changes need a new upload. The build defaults to the public project
connection in `wrangler.json`; optional VITE_* variables override it for testing.

`.github/workflows/keep-alive.yml` runs **Keep Supabase active** daily at 02:17 UTC
(08:17 Bangladesh; GitHub can delay runs). It makes three read-only database
queries. No machine or phone needs to stay open. A weekly successful-check file
records repository activity because GitHub can disable inactive public schedules
after 60 days. Run the workflow manually from GitHub Actions to verify or retry.
Failures appear in Actions; resume a paused project in Supabase before retrying.

## Optional Cloudflare Workers deployment

The repository also supports Cloudflare Workers with static assets.
Static asset requests are free and unlimited; only `/api/*` runs Worker code.
No domain purchase is needed: Cloudflare provides a `workers.dev` address.

Connect this GitHub repository in Cloudflare's Workers dashboard. Use the name
`lunara-customer-end`, build command `npm run build`, and deploy command
`npx wrangler deploy`. `wrangler.json` includes the static asset directory, SPA
fallback, and a daily scheduled database check at 02:17 UTC (08:17 Bangladesh).
The public project URL/key in that file are intentionally browser-visible and
grant no Manager access anonymously. Never substitute a service-role key.

The build defaults to that public connection, so Cloudflare needs no build env
variables; optional VITE_* variables override it for another project or testing.
An existing Cloudflare account and repository authorization are needed to deploy.
The project does not enable a paid plan. Free Workers compute and build quotas
still apply; no free service is an uptime guarantee.

## Vercel preview / alternative host

Import `Lzefron/Lunara-customer-end`, select Vite, and add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for Production and Preview.
Deploy. `vercel.json` defines SPA routing; the database activity schedule is now
in GitHub Actions. The check needs no extra secret or privileged database key. Check hosting
plan eligibility and quotas in your account; this repository creates no paid plan.
**Vercel Hobby is restricted to personal, non-commercial use.** Use a suitable
plan for business use, or the Cloudflare setup above. The Vercel deployment is a
preview while free business hosting is connected.

## Daily use

- In Manager: sign in once with the existing shared account and sync.
- Open **Customer catalog** to add main categories or subcategories.
- Edit a product, choose its category/subcategory, write its customer-facing
  description, and enable **Show in customer catalog**. Existing products are
  private until you explicitly enable this.
- **Feature in the daily feed** marks a product as a Lunara pick. Home shows New arrivals, department collections, and a mixed collection directly, without opening a category. Items rotate between visits and with Shuffle collection; only published inventory is shown.
- Manager syncs after edits, every 30 seconds while visible, and on reconnect.
  Customers refresh within one minute, or immediately on returning to the page.
- Trash/unpublish in Manager to remove a product from the storefront after sync.
- Customers tap hearts to save products on their own browser. **Copy my list**
  prepares current prices and product links to paste in a Facebook chat. The
  customer still confirms stock, delivery fees, and the final total with you.
- The first product photo is its cover. Manager can move another image to the
  front, classify photos as catalog/color-design/real, and label each image.
  Product details include a gallery with thumbnails and photo-type tabs.
- Search includes photo labels; filters cover category, subcategory, color,
  maximum budget, and availability. Sort by price or newest first.

## Supabase availability

GitHub Actions generates a few real database reads daily to reduce inactivity.
Free-plan pausing is based on sufficient activity over a week, and remains
Supabase's decision. This check cannot resume an already paused project or
guarantee uptime. See [Supabase's policy](https://supabase.com/docs/guides/platform/free-project-pausing).
If paused, resume in the Supabase dashboard and retry sync. Manager retains local
changes when the connection fails. Catalog refresh failures show an honest status.

## Install as an app

Open the production URL in Chrome on Android and choose **Install app** or
**Add to Home screen**. On iPhone, use Safari → Share → **Add to Home Screen**.
The manifest, app icons, and service worker are included. Previously loaded
public catalog data and recently viewed photos can be browsed through a temporary
outage. A banner marks a saved collection; confirm current prices and stock with
Lunara. A first visit still needs an internet connection. The saved plan lives on
the customer's browser and is not an order.

See [the API contract](docs/catalog-api.md) for the public-data boundary.

## November catalog update

Existing product cards now offer Publish to customer catalog / Edit customer listing. Review details and photos, then Save & publish; the existing product ID is retained. Photo color, size and design travel in the existing photos JSON and need no database migration. Custom sections are preserved alongside 10 default departments; legacy Tote bags assignments appear under Bags. Home uses published products, with 24-item batches in the mixed collection.

Research references: [Daraz categories](https://pages.daraz.com.bd/wow/i/bd/landingpage/category?hybrid=1&wh_weex=true), [H&M bags](https://www2.hm.com/content/hmonline/en_gb/ladies/accessories/bags.html), [Charles & Keith bags](https://www.charleskeith.com/us/bags).

Decorative empty-catalog image: `public/images/lunara-editorial.jpg`, generated with the built-in image tool. Prompt: photorealistic editorial still life of a tan shoulder bag, cream canvas tote, pearl earrings, rose scarf, nude flats and unbranded cosmetics on ivory stone plinths; warm daylight, no text or logos. It is decorative inspiration, never a sale listing.

## Fresh product ordering

Discovery rows and Recommended category results shuffle on each page load, on return from the background (including an installed PWA or browser history restore), and at the next visible check after Bangladesh midnight. The previous first item in each viewed collection is remembered locally so a collection with at least two products starts differently next visit. Featured badges do not pin products to the front.

The order stays stable during ordinary browsing and catalog polling. Price/Newest sorting and saved plans keep their ordering. If a product gallery is open when a new visit is detected, the shuffle waits until it closes. Shuffle collection also works inside categories and switches back to Recommended ordering. If browser storage is blocked, shuffling still works but cross-reload repeat prevention is best effort. No backend or product data changes are required.
