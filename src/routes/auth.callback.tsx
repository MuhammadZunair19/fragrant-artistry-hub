import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
  const completedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let subscription: { unsubscribe: () => void } | undefined;

    function finish() {
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);

      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      url.searchParams.delete("state");
      url.hash = "";
      window.history.replaceState(
        {},
        document.title,
        `${url.pathname}?redirect=${encodeURIComponent(next)}`,
      );

      void navigate({ to: next, replace: true });
    }

    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, ""),
      );
      const errorDescription =
        params.get("error_description") ??
        params.get("error") ??
        hashParams.get("error_description") ??
        hashParams.get("error");

      if (errorDescription) {
        setMessage(errorDescription);
        return;
      }

      const authListener = supabase.auth.onAuthStateChange((event, session) => {
        if (
          session &&
          (event === "SIGNED_IN" ||
            event === "INITIAL_SESSION" ||
            event === "TOKEN_REFRESHED")
        ) {
          finish();
        }
      });
      subscription = authListener.data.subscription;

      const { data: existing, error: existingError } =
        await supabase.auth.getSession();
      if (cancelled || completedRef.current) return;
      if (existingError) {
        subscription.unsubscribe();
        setMessage(existingError.message);
        return;
      }
      if (existing.session) {
        finish();
        return;
      }

      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled || completedRef.current) return;
        if (error) {
          subscription.unsubscribe();
          setMessage(error.message);
          return;
        }
      }

      const { data, error } = await supabase.auth.getSession();
      if (cancelled || completedRef.current) return;
      if (error) {
        subscription.unsubscribe();
        setMessage(error.message);
        return;
      }
      if (data.session) {
        finish();
        return;
      }

      timeoutId = setTimeout(() => {
        if (!cancelled && !completedRef.current) {
          subscription?.unsubscribe();
          setMessage("Sign-in timed out. Please try again.");
        }
      }, 15000);
    }

    void finishSignIn();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, next]);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <div>
        <p className="eyebrow !text-accent mb-5">Google Auth</p>
        <h1 className="font-display italic text-5xl md:text-7xl">{message}</h1>
      </div>
    </div>
  );
}
