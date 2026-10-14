# Public catalog contract

`POST {SUPABASE_URL}/rest/v1/rpc/customer_catalog` with an empty JSON body,
`apikey: {PUBLIC_ANON_KEY}` and `Authorization: Bearer {PUBLIC_ANON_KEY}`.
No customer sign-in is required. Returns `{ products: Product[], categories: Category[] }`.
With a new `sb_publishable_*` key send only the `apikey` header: that key is not
a JWT and must not be used as a Bearer token. Both public key formats are supported.

Product allowlist: `id`, `name`, `sell_price` (BDT), `colors`, `available`,
`photos` (id, phash and storage paths), `category`, `subcategory`, `description`,
`featured`, `created_at`, `updated_at`. Only explicitly published, active products
are returned. Costs, weight, price codes, internal notes, orders, replies, and
private pricing settings never appear in this response.

Photo bytes: `GET /storage/v1/object/authenticated/product-photos/{path}` with
the same headers. Anonymous SELECT RLS permits only paths referenced by currently
published, active products. The bucket remains private. Removing or trashing a
published product revokes future downloads; already downloaded images cannot be
recalled from a visitor's device.

The browser refreshes every minute while visible, on focus, and on reconnect.
Product links use `/?product={id}`. Saved plans contain IDs only in browser
localStorage. Products that are no longer published cannot be ordered or shared
from the plan. There is no customer mutation endpoint, cart, checkout, or account.

GitHub Actions runs `scripts/check-database.mjs` daily, performing three read-only
catalog queries. The optional Vercel/Worker endpoint `GET /api/keep-alive` performs
the same check and returns only `{ ok: true }` or a 503 health response. This is best
effort activity, not an uptime or no-pause guarantee. An already paused project
must be resumed in Supabase's dashboard. Configure the two VITE_* environment
variables for both Vercel builds and functions; never use a service-role key.
