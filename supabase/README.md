# Supabase Setup

Project id: `nlutpkgfuvzyfatfsbkr`

## Apply Migrations

Run the migrations in Supabase, or push them with the Supabase CLI from this repo:

```powershell
npx supabase login
npx supabase link --project-ref nlutpkgfuvzyfatfsbkr
npx supabase db push
```

The migrations create the storefront schema, RLS policies, seed products, the `NOIR10` coupon, and the public `product-images` storage bucket.

For non-interactive shells, use an access token instead of `supabase login`:

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
npx supabase link --project-ref nlutpkgfuvzyfatfsbkr
npx supabase db push
```

## Required Environment Variables

Client and server (required for storefront, auth, and admin):

```text
VITE_SUPABASE_URL=https://nlutpkgfuvzyfatfsbkr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=https://nlutpkgfuvzyfatfsbkr.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
```

Optional server-only (not used by current admin code — admin runs on the user JWT + RLS):

```text
SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side env.

## Admin Panel (Supabase)

The admin backend uses **TanStack Start server functions** with:

1. `attachSupabaseAuth` — sends the signed-in user's access token on every serverFn call
2. `requireSupabaseAuth` — validates the JWT and builds a Supabase client scoped to that user
3. `requireSupabaseAdmin` — calls `has_role(auth.uid(), 'admin')` before any admin handler runs

All admin database access goes through **RLS as the admin user**, not the service role. Tables with admin write policies include products, brands, categories, collections, coupons, orders, and storage (`product-images` bucket).

After migrations are applied:

1. Promote your account (see **First Admin** below).
2. Sign in and open `/admin`.
3. Product image uploads use the browser Supabase client + storage RLS (admin insert/update/delete on `product-images`).

If customer pages or dashboard customer counts fail with permission errors, ensure migration `20260620140000_admin_profiles_addresses_rls.sql` is applied. You can also run this in the SQL Editor:

```sql
CREATE POLICY "profiles admin read"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "addresses admin read"
  ON public.addresses FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

## Auth URL Configuration

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL, local: `http://localhost:8080`
- Redirect URL, local: `http://localhost:8080/auth/callback`
- Redirect URL, reset password local: `http://localhost:8080/reset-password`
- Add the same paths for the Lovable/published domain:
  - `https://YOUR_DOMAIN/auth/callback`
  - `https://YOUR_DOMAIN/reset-password`

## Google Provider

In Supabase Dashboard -> Authentication -> Providers -> Google:

1. Enable Google.
2. Add the Google OAuth Client ID and Client Secret.
3. Copy the Supabase callback URL shown there.

In Google Cloud Console -> APIs & Services -> Credentials -> OAuth client:

- Authorized JavaScript origin: `https://nlutpkgfuvzyfatfsbkr.supabase.co`
- Authorized redirect URI: `https://nlutpkgfuvzyfatfsbkr.supabase.co/auth/v1/callback`

The app redirects users to `/auth/callback`; Supabase/Google still use the Supabase `/auth/v1/callback` endpoint internally.

## First Admin

After creating your first account, promote it manually in SQL:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id, role) do nothing;
```
