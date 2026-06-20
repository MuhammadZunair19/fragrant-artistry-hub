import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect:
      typeof search.redirect === "string" && search.redirect.startsWith("/")
        ? search.redirect
        : "/account",
  }),
  head: () => ({
    meta: [
      { title: `Signing in - ${SITE.brand}` },
      { name: "description", content: "Completing your sign-in." },
    ],
  }),
  beforeLoad: ({ search }) => {
    if (!search.redirect.startsWith("/")) {
      throw redirect({ to: "/account" });
    }
  },
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { redirect: next } = Route.useSearch();
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorDescription =
        params.get("error_description") ?? params.get("error");

      if (errorDescription) {
        setMessage(errorDescription);
        return;
      }

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          setMessage(error?.message ?? "No active sign-in session was found.");
          return;
        }
      }

      if (!cancelled) {
        await navigate({ to: next });
      }
    }

    void finishSignIn();

    return () => {
      cancelled = true;
    };
  }, [navigate, next]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="eyebrow !text-accent mb-5">Google Auth</p>
        <h1 className="font-display italic text-5xl md:text-7xl">
          {message}
        </h1>
      </div>
    </div>
  );
}
