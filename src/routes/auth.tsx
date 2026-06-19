import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Chrome, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign in - ${SITE.brand}` },
      {
        name: "description",
        content: "Sign in to manage orders, addresses, wishlist, and checkout.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          });
    setBusy(false);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setStatus("Check your inbox to confirm your account.");
      return;
    }
    await navigate({ to: "/account" });
  }

  async function signInWithGoogle() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/account` },
    });
    setBusy(false);
    if (error) setStatus(error.message);
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-20 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_440px] lg:items-center">
        <section>
          <p className="eyebrow !text-accent mb-5">Private Atelier</p>
          <h1 className="font-display italic text-6xl leading-[0.95] md:text-8xl">
            Enter the house.
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Save your edits, move through checkout, and revisit every order
            with the same quiet ceremony as the boutique.
          </p>
        </section>

        <section className="border border-border bg-card/70 p-6 md:p-8">
          <div className="mb-8 grid grid-cols-2 border border-border p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`eyebrow py-3 transition-colors ${
                  mode === item
                    ? "bg-foreground !text-background"
                    : "hover:text-accent"
                }`}
              >
                {item === "signin" ? "Sign In" : "Create"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <label className="block">
                <span className="eyebrow mb-2 block">Display Name</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
                  autoComplete="name"
                />
              </label>
            )}
            <label className="block">
              <span className="eyebrow mb-2 block">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
                type="email"
                autoComplete="email"
                required
              />
            </label>
            <label className="block">
              <span className="eyebrow mb-2 block">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
            </label>
            <button
              disabled={busy}
              className="eyebrow flex h-13 w-full items-center justify-center gap-3 bg-foreground !text-background transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Mail size={15} />
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy}
            className="eyebrow mt-4 flex h-12 w-full items-center justify-center gap-3 border border-border transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <Chrome size={15} /> Continue With Google
          </button>

          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-muted-foreground">
            <Link to="/reset-password" className="hover:text-accent">
              Forgot password?
            </Link>
            <Link to="/checkout" className="hover:text-accent">
              Return to checkout
            </Link>
          </div>
          {status && <p className="mt-5 text-sm text-accent">{status}</p>}
        </section>
      </div>
    </div>
  );
}
