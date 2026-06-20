-- Public SELECT policies (products, variants, reviews) include has_role() in their
-- USING clause for anon + authenticated. PostgreSQL still requires anon to EXECUTE
-- the function even when auth.uid() is null and the call returns false.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;
