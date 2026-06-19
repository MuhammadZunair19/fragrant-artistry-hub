import { AnimatePresence, motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "./cart-context";
import { formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { open, setOpen, lines, updateQty, removeLine, subtotal } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="fixed right-0 top-0 z-[100] h-full w-full max-w-md bg-background border-l border-border flex flex-col"
          >
            <header className="flex items-center justify-between px-8 py-6 border-b border-border">
              <div>
                <div className="eyebrow mb-1">Your Selection</div>
                <h2 className="font-display italic text-2xl">The Cart</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close cart"
                className="size-8 grid place-items-center hover:text-accent transition-colors"
              >
                <X size={18} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {lines.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="font-display italic text-2xl mb-4 text-muted-foreground">
                    Nothing yet.
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                    Begin by selecting a fragrance from the maison.
                  </p>
                  <Link
                    to="/fragrances"
                    onClick={() => setOpen(false)}
                    className="mt-8 eyebrow border-b border-foreground pb-1 hover:text-accent"
                  >
                    Browse Fragrances
                  </Link>
                </div>
              ) : (
                <ul className="space-y-8">
                  {lines.map((l) => (
                    <motion.li
                      key={l.variantId}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30 }}
                      transition={{ duration: 0.4 }}
                      className="flex gap-4"
                    >
                      <div className="size-24 bg-secondary shrink-0 overflow-hidden">
                        {l.image && (
                          <img
                            src={l.image}
                            alt={l.productName}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="eyebrow mb-1">{l.brandName}</div>
                        <h3 className="text-base tracking-tight truncate">
                          {l.productName}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.volumeMl}ml
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => updateQty(l.variantId, l.qty - 1)}
                              aria-label="Decrease quantity"
                              className="size-7 grid place-items-center hover:text-accent"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-mono">
                              {l.qty}
                            </span>
                            <button
                              onClick={() => updateQty(l.variantId, l.qty + 1)}
                              aria-label="Increase quantity"
                              className="size-7 grid place-items-center hover:text-accent"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-display italic">
                            {formatPrice(l.unitPrice * l.qty)}
                          </span>
                        </div>
                        <button
                          onClick={() => removeLine(l.variantId)}
                          className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-border px-8 py-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="eyebrow">Subtotal</span>
                  <motion.span
                    key={subtotal}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display italic text-2xl"
                  >
                    {formatPrice(subtotal)}
                  </motion.span>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link
                  to="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full bg-foreground text-center text-background py-4 eyebrow !text-background !tracking-[0.3em] hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  to="/fragrances"
                  onClick={() => setOpen(false)}
                  className="block text-center eyebrow border-b border-border pb-2 hover:text-accent"
                >
                  Continue Browsing
                </Link>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
