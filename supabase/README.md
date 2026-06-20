# Supabase Setup

Project id: `kfuutpyzihqhsokxotbg`

## Apply Migrations

Run the migrations in Supabase, or push them with the Supabase CLI from this repo:

```powershell
npx supabase login
npx supabase link --project-ref kfuutpyzihqhsokxotbg
npx supabase db push
```

The migrations create the storefront schema, RLS policies, seed products, the `NOIR10` coupon, and the public `product-images` storage bucket.

For non-interactive shells, use an access token instead of `supabase login`:

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
npx supabase link --project-ref kfuutpyzihqhsokxotbg
npx supabase db push
```

## Required Environment Variables

Client and server:

```text
VITE_SUPABASE_URL=https://kfuutpyzihqhsokxotbg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=https://kfuutpyzihqhsokxotbg.supabase.co
SUPABASE_PUBLISHABLE_KEY=...
```

Server-only admin functions:

```text
SUPABASE_SERVICE_ROLE_KEY=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side env.

## Auth URL Configuration

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL, local: `http://localhost:5173`
- Redirect URL, local: `http://localhost:5173/auth/callback`
- Redirect URL, reset password local: `http://localhost:5173/reset-password`
- Add the same paths for the Lovable/published domain:
  - `https://YOUR_DOMAIN/auth/callback`
  - `https://YOUR_DOMAIN/reset-password`

## Google Provider

In Supabase Dashboard -> Authentication -> Providers -> Google:

1. Enable Google.
2. Add the Google OAuth Client ID and Client Secret.
3. Copy the Supabase callback URL shown there.

In Google Cloud Console -> APIs & Services -> Credentials -> OAuth client:

- Authorized JavaScript origin: `https://kfuutpyzihqhsokxotbg.supabase.co`
- Authorized redirect URI: `https://kfuutpyzihqhsokxotbg.supabase.co/auth/v1/callback`

The app redirects users to `/auth/callback`; Supabase/Google still use the Supabase `/auth/v1/callback` endpoint internally.

## First Admin

After creating your first account, promote it manually in SQL:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict (user_id, role) do nothing;
```
