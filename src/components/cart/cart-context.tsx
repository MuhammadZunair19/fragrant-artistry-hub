import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartLine = {
  variantId: string;
  productSlug: string;
  productName: string;
  brandName: string | null;
  volumeMl: number;
  unitPrice: number;
  image: string | null;
  qty: number;
};

type CartContextType = {
  lines: CartLine[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addLine: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  updateQty: (variantId: string, qty: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  subtotal: number;
  itemCount: number;
  wishlist: string[];
  toggleWishlist: (productSlug: string) => void;
  isWishlisted: (productSlug: string) => boolean;
};

const Ctx = createContext<CartContextType | null>(null);

const CART_KEY = "venere.cart.v1";
const WISH_KEY = "venere.wishlist.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setLines(JSON.parse(raw));
      const w = localStorage.getItem(WISH_KEY);
      if (w) setWishlist(JSON.parse(w));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [wishlist, hydrated]);

  const addLine = useCallback<CartContextType["addLine"]>((line) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId);
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId
            ? { ...l, qty: l.qty + (line.qty ?? 1) }
            : l,
        );
      }
      return [...prev, { ...line, qty: line.qty ?? 1 }];
    });
    setOpen(true);
  }, []);

  const updateQty = useCallback<CartContextType["updateQty"]>((id, qty) => {
    setLines((prev) =>
      prev
        .map((l) => (l.variantId === id ? { ...l, qty: Math.max(1, qty) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const removeLine = useCallback<CartContextType["removeLine"]>((id) => {
    setLines((prev) => prev.filter((l) => l.variantId !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toggleWishlist = useCallback((slug: string) => {
    setWishlist((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist],
  );

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
    [lines],
  );

  const itemCount = useMemo(
    () => lines.reduce((s, l) => s + l.qty, 0),
    [lines],
  );

  const value: CartContextType = {
    lines,
    open,
    setOpen,
    addLine,
    updateQty,
    removeLine,
    clear,
    subtotal,
    itemCount,
    wishlist,
    toggleWishlist,
    isWishlisted,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used within CartProvider");
  return v;
}
