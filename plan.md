
# VÉNÉRÉ — Luxury Perfume E-commerce

Building the **Obsidian Cinematic Noir** direction on Lovable's stack (TanStack Start + React 19 + Tailwind v4 + Framer Motion + Lovable Cloud / Supabase). The API layer uses TanStack server functions instead of a separate Express server — same REST-style endpoints, JWT-equivalent auth, RLS-protected Postgres.

Brand: **VÉNÉRÉ**. Palette: near-black background `hsl(240 10% 3%)`, ivory foreground, champagne-gold accent `hsl(45 20% 70%)`. Type: Cormorant Garamond (display, italic), Inter (sans), JetBrains Mono (mono labels).

## Milestone 1 — Foundation + Storefront

**Design system & shell**
- Tailwind v4 tokens copied verbatim from the chosen direction into `src/styles.css` (`@theme`: colors, fonts, cinematic ease, reveal/ink keyframes).
- Fonts loaded via `<link>` in `__root.tsx` head (Cormorant Garamond, Inter, JetBrains Mono).
- Framer Motion installed. Reusable motion primitives: `FadeUp`, `Reveal`, `Marquee`, page-transition wrapper.
- Slim fixed nav (mix-blend-difference), centered VÉNÉRÉ wordmark, cart drawer trigger.

**Homepage** (`/`)
- Full-bleed hero with bottle imagery, italic display headline, dual CTAs, hero note pyramid bottom-left.
- "Signature Edits" — horizontal scroll rail of featured products with hover composition reveal.
- "Philosophy" — split editorial block with grayscale → color image on hover.
- "Journal" — 3-card editorial teaser.
- Footer with newsletter input + boutique address.

**Product catalog**
- `/fragrances` — filterable grid: brand/maison, gender, fragrance family, price range, availability, new/best-seller toggles, sort (price, newness, popularity).
- `/fragrances/$slug` — PDP with image gallery, name/house, price + volume picker (30/50/100ml), stock badge, animated fragrance pyramid (top / heart / base), description, add-to-cart with cart-fly animation, ratings & review list.
- `/collections/$slug` and `/maisons/$slug` — curated grids reusing the catalog component.
- `/journal` index + `/journal/$slug` article pages (markdown body).

**Cart**
- Slide-in cart drawer (Framer Motion), quantity controls, line totals, animated total counter.
- Persistent (localStorage for guests, DB for signed-in users).
- Wishlist heart toggle on cards + `/wishlist` page; "move to cart" action.

**SEO / perf**
- Per-route `head()` with title, description, og:title/description/image, twitter card. JSON-LD `Product` on PDP.
- `sitemap.xml` route + `robots.txt`.
- Image optimization, lazy loading below the fold, route preloading.

## Milestone 2 — Auth + Checkout + Account

**Auth** (Lovable Cloud / Supabase)
- Email + password and Google sign-in on a custom `/auth` page styled to match the noir aesthetic.
- Forgot password → `/reset-password` flow.
- `profiles` table with display name, addresses (separate `addresses` table).
- Role-based access: `app_role` enum (`admin`, `customer`), `user_roles` table, `has_role()` security-definer function.
- Protected subtree under `src/routes/_authenticated/` (integration-managed gate).

**Checkout** (mock payments)
- `/checkout` multi-step with animated progress indicator: Shipping → Billing → Review → Confirmation.
- Coupon code field, shipping fee + tax estimation, order summary.
- Mock payment confirmation; writes `orders` + `order_items`, sets status `confirmed`, clears cart.
- `/order-confirmation/$id` success page.

**Account** (`/_authenticated/account/*`)
- Profile (edit name, change password).
- Addresses CRUD.
- Order history with visual status timeline: Pending → Confirmed → Processing → Shipped → Delivered (or Cancelled).
- Reorder button (re-adds items to cart, honoring current stock).
- Wishlist management.

## Milestone 3 — Admin Dashboard(work)

`/_authenticated/admin/*`, gated by `has_role(uid, 'admin')` in both route `beforeLoad` and every admin server function.

- **Overview** — revenue KPIs, sales chart (Recharts), recent orders feed, top sellers, low-stock alerts, animated counters.
- **Products** — table + drawer editor: CRUD, multi-image upload to Supabase Storage (`product-images` bucket), variant volumes, fragrance notes (top/heart/base as tag inputs), featured toggle, pricing & discount.
- **Inventory** — per-variant stock editor with low-stock threshold + visual indicators.
- **Categories / Brands / Collections** — CRUD for each taxonomy.
- **Orders** — list with filters; detail view to update status, view customer & items.
- **Customers** — list, detail, order history.
- **Coupons** — CRUD: percent or fixed, min order, expiry, usage limit/count.

## Milestone 4 — Polish + Extras

- Customer reviews & ratings (write from completed-order PDP, moderated in admin).
- Newsletter subscription (writes to `newsletter_subscribers`).
- Instagram-style editorial gallery section on home.
- Testimonials block.
- Animated mobile menu (full-screen overlay).
- 404 + error boundaries styled to brand.
- README + maintenance docs.
- Security pass (RLS audit, input validation with Zod everywhere, rate-limit notes).

## Technical details

**Stack mapping vs the original spec**

| Spec | Delivered as |
| --- | --- |
| Next.js + SSR | TanStack Start (Vite + React 19, SSR on Cloudflare Workers) |
| Express REST API | `createServerFn` modules in `src/lib/*.functions.ts` + `/api/*` server routes for webhooks |
| JWT auth | Supabase Auth (JWT-based) via `requireSupabaseAuth` middleware |
| RBAC | `app_role` enum + `user_roles` table + `has_role()` SECURITY DEFINER |
| Image storage | Supabase Storage `product-images` bucket |
| Vercel deploy | Lovable Publish → Cloudflare Workers (one-click) |

**Database schema (migrations)**

```text
profiles(id→auth.users, full_name, phone, avatar_url, created_at)
app_role enum('admin','customer')
user_roles(id, user_id, role, unique(user_id,role))
addresses(id, user_id, label, line1, line2, city, region, postal, country, is_default)
brands(id, slug, name, story, hero_image)
categories(id, slug, name, parent_id)
collections(id, slug, name, description, hero_image, featured)
fragrance_families(id, name)            -- woody, oriental, floral, etc.
products(id, slug, name, brand_id, category_id, family_id, gender,
         description, top_notes[], heart_notes[], base_notes[],
         is_featured, is_new, is_best_seller, created_at)
product_variants(id, product_id, volume_ml, price, discount_price,
                 stock, sku, low_stock_threshold)
product_images(id, product_id, url, alt, sort_order)
product_collections(product_id, collection_id)
reviews(id, product_id, user_id, rating, title, body, status, created_at)
carts(id, user_id|session_id, updated_at)
cart_items(id, cart_id, variant_id, qty)
wishlists(id, user_id, variant_id, created_at)
coupons(id, code, type, value, min_order, expires_at, usage_limit, used_count, active)
orders(id, user_id, status, subtotal, discount, shipping, tax, total,
       coupon_id, shipping_address, billing_address, created_at)
order_items(id, order_id, variant_id, name_snapshot, price_snapshot, qty)
order_status_history(id, order_id, status, note, created_at)
newsletter_subscribers(id, email, created_at)
```

Every table gets explicit `GRANT`s + RLS policies. Public tables (`products`, `brands`, `collections`, `categories`, `product_variants`, `product_images`, approved `reviews`) get narrow `TO anon` SELECT. User-owned tables scope to `auth.uid()`. Admin-only writes use `has_role(auth.uid(),'admin')`.

**Server functions (sample)**
- `listProducts({ filters, sort, page })`, `getProduct({ slug })`, `listCollections()`, `listBrands()`
- `getCart()`, `addToCart()`, `updateCartItem()`, `removeCartItem()`
- `addToWishlist()`, `removeFromWishlist()`
- `createOrder({ shipping, billing, couponCode })` (mock payment)
- `listMyOrders()`, `getOrder({ id })`, `submitReview()`
- Admin: `admin.upsertProduct`, `admin.uploadProductImage`, `admin.updateOrderStatus`, `admin.dashboardMetrics`, plus CRUD for brands/categories/collections/coupons.

**Seed data**
Migration seeds ~12 perfumes across 3 maisons (Vénéré, Atelier Noir, Maison Obscura), 4 collections, 3 sample journal entries — enough to make every page feel real.

## What I'll skip in v1 (callable later)

- Real Stripe/Paddle payments (mock confirmation today; wire later).
- Email sending (order confirmations) — pluggable later via Lovable Email.
- Multi-currency / multi-language.
- Recommendation engine.

Approve and I'll start with Milestone 1: enable Lovable Cloud, write the schema + seed, then build the design system, home, catalog, PDP, cart, wishlist.
