import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: `Reset password - ${SITE.brand}` },
      { name: "description", content: "Reset or update your account password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setStatus(error ? error.message : "Reset link sent. Check your inbox.");
  }

  async function updatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    setStatus("Password updated.");
    await navigate({ to: "/account" });
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-20 md:px-10">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow !text-accent mb-5">Account Recovery</p>
        <h1 className="font-display italic text-6xl leading-none">
          Reset password
        </h1>
        <p className="mt-6 text-muted-foreground">
          Request a secure link, or set a new password after opening the link
          from your email.
        </p>

        <form onSubmit={requestReset} className="mt-10 space-y-4">
          <label className="block">
            <span className="eyebrow mb-2 block">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
              type="email"
              required
            />
          </label>
          <button disabled={busy} className="eyebrow h-12 w-full bg-foreground !text-background hover:bg-accent disabled:opacity-50">
            Send Reset Link
          </button>
        </form>

        <form onSubmit={updatePassword} className="mt-10 space-y-4 border-t border-border pt-10">
          <label className="block">
            <span className="eyebrow mb-2 block">New Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
              type="password"
              minLength={6}
              required
            />
          </label>
          <button disabled={busy} className="eyebrow h-12 w-full border border-border hover:border-accent hover:text-accent disabled:opacity-50">
            Update Password
          </button>
        </form>

        {status && <p className="mt-6 text-sm text-accent">{status}</p>}
        <Link to="/auth" className="eyebrow mt-8 inline-block border-b border-foreground pb-1 hover:text-accent">
          Back To Sign In
        </Link>
      </div>
    </div>
  );
}
