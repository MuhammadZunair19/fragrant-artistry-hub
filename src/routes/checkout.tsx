import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, CreditCard, MapPin, ReceiptText } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createOrder } from "@/lib/account.functions";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: `Checkout - ${SITE.brand}` },
      { name: "description", content: "Secure mock checkout for VÉNÉRÉ." },
    ],
  }),
  component: CheckoutPage,
});

type AddressForm = {
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  phone: string;
  label: string;
};

const emptyAddress: AddressForm = {
  full_name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "United States",
  phone: "",
  label: "Shipping",
};

const steps = [
  { label: "Shipping", icon: MapPin },
  { label: "Billing", icon: CreditCard },
  { label: "Review", icon: ReceiptText },
  { label: "Confirmation", icon: Check },
];

function toPayload(address: AddressForm) {
  return {
    ...address,
    line2: address.line2 || null,
    region: address.region || null,
    phone: address.phone || null,
    label: address.label || null,
  };
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, clear } = useCart();
  const [step, setStep] = useState(0);
  const [shipping, setShipping] = useState<AddressForm>(emptyAddress);
  const [billing, setBilling] = useState<AddressForm>({
    ...emptyAddress,
    label: "Billing",
  });
  const [sameBilling, setSameBilling] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const discount = couponCode.trim().toUpperCase() === "NOIR10" ? subtotal * 0.1 : 0;
  const shippingFee = subtotal - discount >= 250 || subtotal === 0 ? 0 : 18;
  const tax = (subtotal - discount) * 0.0825;
  const total = subtotal - discount + shippingFee + tax;

  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  function requireAddress(address: AddressForm) {
    return Boolean(
      address.full_name &&
        address.line1 &&
        address.city &&
        address.postal_code &&
        address.country,
    );
  }

  function next(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setError(null);
    if (step === 0 && !requireAddress(shipping)) {
      setError("Shipping needs a name, street, city, postal code, and country.");
      return;
    }
    if (step === 1 && !sameBilling && !requireAddress(billing)) {
      setError("Billing needs a name, street, city, postal code, and country.");
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  }

  async function placeOrder() {
    setBusy(true);
    setError(null);
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setBusy(false);
      await navigate({ to: "/auth", search: { redirect: "/checkout" } });
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    try {
      const order = await createOrder({
        data: {
          lines,
          shipping: toPayload(shipping),
          billing: toPayload(sameBilling ? shipping : billing),
          couponCode: couponCode || null,
          customerEmail: userData.user?.email ?? null,
        },
      });
      clear();
      setStep(3);
      await navigate({
        to: "/order-confirmation/$id",
        params: { id: order.id },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow !text-accent mb-4">Mock Payment</p>
        <h1 className="font-display italic text-6xl md:text-8xl">Checkout</h1>

        <div className="mt-10 h-px bg-border">
          <motion.div
            className="h-px bg-accent"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => index < step && setStep(index)}
                className={`eyebrow flex items-center gap-2 text-left ${
                  index <= step ? "!text-foreground" : ""
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <section className="min-h-[520px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <StepPanel key="shipping" title="Shipping address">
                  <AddressEditor value={shipping} onChange={setShipping} onSubmit={next} />
                </StepPanel>
              )}
              {step === 1 && (
                <StepPanel key="billing" title="Billing">
                  <label className="mb-8 flex items-center gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={sameBilling}
                      onChange={(e) => setSameBilling(e.target.checked)}
                    />
                    Use shipping address for billing
                  </label>
                  {sameBilling ? (
                    <div className="border border-border p-6 text-muted-foreground">
                      Billing will use the shipping address.
                    </div>
                  ) : (
                    <AddressEditor value={billing} onChange={setBilling} onSubmit={next} />
                  )}
                  {sameBilling && (
                    <button onClick={() => next()} className="eyebrow mt-8 h-12 bg-foreground px-8 !text-background hover:bg-accent">
                      Continue
                    </button>
                  )}
                </StepPanel>
              )}
              {step === 2 && (
                <StepPanel key="review" title="Review order">
                  <div className="space-y-4">
                    {lines.map((line) => (
                      <div key={line.variantId} className="flex gap-4 border-b border-border pb-4">
                        {line.image && (
                          <img src={line.image} alt="" className="h-20 w-16 object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="font-display italic text-2xl">{line.productName}</p>
                          <p className="eyebrow mt-1">
                            {line.brandName} / {line.volumeMl}ml / Qty {line.qty}
                          </p>
                        </div>
                        <p className="font-mono text-sm">
                          {formatPrice(line.unitPrice * line.qty)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={placeOrder}
                    disabled={busy || lines.length === 0}
                    className="eyebrow mt-8 h-12 bg-foreground px-8 !text-background hover:bg-accent disabled:opacity-50"
                  >
                    Confirm Mock Payment
                  </button>
                </StepPanel>
              )}
            </AnimatePresence>
            {error && <p className="mt-6 text-sm text-accent">{error}</p>}
          </section>

          <aside className="h-fit border border-border bg-card/70 p-6">
            <h2 className="font-display italic text-3xl">Order summary</h2>
            {lines.length === 0 ? (
              <div className="mt-8 text-muted-foreground">
                Your cart is empty.{" "}
                <Link to="/fragrances" className="text-accent">
                  Browse fragrances
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="mt-8 space-y-3">
                  <SummaryRow label="Subtotal" value={subtotal} />
                  <SummaryRow label="Discount" value={-discount} />
                  <SummaryRow label="Shipping" value={shippingFee} />
                  <SummaryRow label="Estimated tax" value={tax} />
                </div>
                <label className="mt-8 block">
                  <span className="eyebrow mb-2 block">Coupon Code</span>
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="NOIR10"
                    className="h-11 w-full border border-input bg-transparent px-4 uppercase outline-none focus:border-accent"
                  />
                </label>
                <div className="mt-8 flex items-baseline justify-between border-t border-border pt-6">
                  <span className="eyebrow">Total</span>
                  <span className="font-display italic text-4xl">
                    {formatPrice(total)}
                  </span>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function StepPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <h2 className="font-display italic text-4xl">{title}</h2>
      <div className="mt-8">{children}</div>
    </motion.div>
  );
}

function AddressEditor({
  value,
  onChange,
  onSubmit,
}: {
  value: AddressForm;
  onChange: (value: AddressForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function set<K extends keyof AddressForm>(key: K, next: AddressForm[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full Name" value={value.full_name} onChange={(v) => set("full_name", v)} />
      <Field label="Phone" value={value.phone} onChange={(v) => set("phone", v)} />
      <Field label="Street" value={value.line1} onChange={(v) => set("line1", v)} wide />
      <Field label="Apartment" value={value.line2} onChange={(v) => set("line2", v)} wide />
      <Field label="City" value={value.city} onChange={(v) => set("city", v)} />
      <Field label="Region" value={value.region} onChange={(v) => set("region", v)} />
      <Field label="Postal Code" value={value.postal_code} onChange={(v) => set("postal_code", v)} />
      <Field label="Country" value={value.country} onChange={(v) => set("country", v)} />
      <button className="eyebrow mt-4 h-12 bg-foreground px-8 !text-background hover:bg-accent sm:col-span-2">
        Continue
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  wide,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="eyebrow mb-2 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full border border-input bg-transparent px-4 outline-none focus:border-accent"
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm text-muted-foreground">
      <span>{label}</span>
      <span>{formatPrice(value)}</span>
    </div>
  );
}
