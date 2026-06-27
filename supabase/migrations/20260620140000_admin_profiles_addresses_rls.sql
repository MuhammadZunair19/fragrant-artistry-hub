-- Admin panel reads customer profiles and addresses via authenticated JWT + RLS.
-- Without these policies, dashboard customer counts and /admin/customers fail for admins.

DROP POLICY IF EXISTS "profiles admin read" ON public.profiles;
CREATE POLICY "profiles admin read"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "addresses admin read" ON public.addresses;
CREATE POLICY "addresses admin read"
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
