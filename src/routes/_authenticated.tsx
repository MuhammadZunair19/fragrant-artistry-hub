import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  // Session lives in localStorage; SSR cannot read it for beforeLoad/loaders.
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: `${location.pathname}${location.search}`,
        },
      });
    }
  },
  component: Outlet,
});
