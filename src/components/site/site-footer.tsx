import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { SITE } from "@/lib/site";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await subscribeNewsletter({ data: { email } });
      if (res.ok) {
        setStatus("ok");
        setMessage("Thank you. You're on the list.");
        setEmail("");
      } else {
        setStatus("err");
        setMessage(res.error ?? "Something went wrong.");
      }
    } catch {
      setStatus("err");
      setMessage("Something went wrong.");
    }
  }

  return (
    <footer className="bg-card border-t border-border pt-24 pb-12 px-6 md:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12 mb-24">
        <div className="col-span-12 md:col-span-4">
          <Link
            to="/"
            className="font-display italic text-3xl block mb-8 hover:text-accent transition-colors"
          >
            {SITE.brand}
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Subscribe to our internal dispatch for limited collection drops
            and olfactory research.
          </p>
          <form onSubmit={onSubmit} className="mt-8 flex border-b border-border py-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              aria-label="Email address"
              className="bg-transparent text-sm w-full focus:outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="eyebrow !tracking-[0.3em] font-bold hover:text-accent disabled:opacity-50"
            >
              {status === "loading" ? "…" : "→"}
            </button>
          </form>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-[10px] uppercase tracking-widest mt-3 ${
                status === "ok" ? "text-accent" : "text-destructive"
              }`}
            >
              {message}
            </motion.p>
          )}
        </div>

        <div className="col-span-6 md:col-span-2 space-y-4">
          <span className="eyebrow !text-accent font-bold">Collections</span>
          <ul className="text-sm space-y-3 text-muted-foreground">
            <li>
              <Link to="/collections/$slug" params={{ slug: "noir-series" }} className="hover:text-foreground">
                The Noir Series
              </Link>
            </li>
            <li>
              <Link to="/collections/$slug" params={{ slug: "elemental-roots" }} className="hover:text-foreground">
                Elemental Roots
              </Link>
            </li>
            <li>
              <Link to="/collections/$slug" params={{ slug: "floral-disruption" }} className="hover:text-foreground">
                Floral Disruption
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-6 md:col-span-2 space-y-4">
          <span className="eyebrow !text-accent font-bold">Atelier</span>
          <ul className="text-sm space-y-3 text-muted-foreground">
            <li>
              <Link to="/maisons/$slug" params={{ slug: "venere" }} className="hover:text-foreground">
                Vénéré
              </Link>
            </li>
            <li>
              <Link to="/maisons/$slug" params={{ slug: "atelier-noir" }} className="hover:text-foreground">
                Atelier Noir
              </Link>
            </li>
            <li>
              <Link to="/maisons/$slug" params={{ slug: "maison-obscura" }} className="hover:text-foreground">
                Maison Obscura
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-12 md:col-span-4 md:text-right space-y-4">
          <span className="eyebrow !text-accent font-bold block">
            Paris Boutique
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {SITE.boutique.line1}
            <br />
            {SITE.boutique.line2}
            <br />
            {SITE.boutique.phone}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-center pt-12 border-t border-border/50">
        <span className="font-mono text-[10px] text-muted-foreground tracking-widest uppercase">
          © {new Date().getFullYear()} {SITE.brand} {SITE.tagline}
        </span>
        <div className="flex gap-8 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          <Link to="/" className="hover:text-foreground">Legal</Link>
          <Link to="/" className="hover:text-foreground">Privacy</Link>
          <Link to="/" className="hover:text-foreground">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}
