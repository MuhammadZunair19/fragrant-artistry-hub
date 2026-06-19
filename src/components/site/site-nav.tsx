import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SITE, NAV_LEFT, NAV_RIGHT } from "@/lib/site";
import { useCart } from "@/components/cart/cart-context";

export function SiteNav() {
  const { itemCount, setOpen: setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change (esc handler is enough for now)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed top-0 inset-x-0 z-50 flex justify-between items-center px-6 md:px-10 py-6 mix-blend-difference text-foreground"
      >
        {/* left */}
        <div className="hidden md:flex gap-8 eyebrow !text-foreground/80 hover:[&>a:hover]:text-accent">
          {NAV_LEFT.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-accent transition-colors"
              activeProps={{ className: "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* mobile menu trigger (left) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="md:hidden p-1"
        >
          <Menu size={20} />
        </button>

        {/* center wordmark */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to="/" className="block">
            <span className="font-display italic text-2xl md:text-3xl tracking-tight">
              {SITE.brand}
            </span>
          </Link>
        </div>

        {/* right */}
        <div className="flex items-center gap-6 md:gap-8 eyebrow !text-foreground/80">
          {NAV_RIGHT.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hidden md:inline hover:text-accent transition-colors"
              activeProps={{ className: "text-accent" }}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="hover:text-accent transition-colors flex items-center gap-1.5"
            aria-label="Open cart"
          >
            <span>Cart</span>
            <motion.span
              key={itemCount}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-mono text-[10px] tabular-nums"
            >
              ({itemCount.toString().padStart(2, "0")})
            </motion.span>
          </button>
        </div>
      </nav>

      {/* mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[95] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-border">
              <span className="font-display italic text-2xl">{SITE.brand}</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="p-1"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="flex-1 flex flex-col items-center justify-center gap-8">
              {[...NAV_LEFT, ...NAV_RIGHT].map((l, i) => (
                <motion.li
                  key={l.to}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                >
                  <Link
                    to={l.to}
                    onClick={() => setMobileOpen(false)}
                    className="font-display italic text-5xl hover:text-accent transition-colors"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
