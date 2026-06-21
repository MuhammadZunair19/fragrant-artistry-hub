import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Heart, PackageCheck, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  deleteAddress,
  getAccountSnapshot,
  listMyOrders,
  orderItemsToCartLines,
  updateProfile,
  upsertAddress,
  type Address,
  type OrderSummary,
} from "@/lib/account.functions";
import { checkAdminAccess } from "@/lib/admin.functions";
import { listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/products/product-card";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/account/")({
  head: () => ({
    meta: [
      { title: `Account - ${SITE.brand}` },
      { name: "description", content: "Manage your VÉNÉRÉ account." },
    ],
  }),
  loader: async () => {
    const [snapshot, orders, products, adminCheck] = await Promise.all([
      getAccountSnapshot(),
      listMyOrders(),
      listProducts({ data: { limit: 60 } }),
      checkAdminAccess().then(() => true).catch(() => false),
    ]);
    return { snapshot, orders, products, isAdmin: adminCheck };
  },
  component: AccountPage,
});

const blankAddress = {
  label: "Home",
  full_name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal_code: "",
  country: "United States",
  phone: "",
  is_default: false,
};

function AccountPage() {
  const router = useRouter();
  const { snapshot, orders, products, isAdmin } = Route.useLoaderData();
  const { wishlist, toggleWishlist, addLine } = useCart();
  const [profile, setProfile] = useState({
    full_name: snapshot.profile.full_name ?? "",
    phone: snapshot.profile.phone ?? "",
  });
  const [address, setAddress] = useState(blankAddress);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const wishedProducts = products.filter((product) => wishlist.includes(product.slug));

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await updateProfile({
      data: {
        full_name: profile.full_name || null,
        phone: profile.phone || null,
      },
    });
    setBusy(false);
    setStatus("Profile saved.");
    await router.invalidate();
  }

  async function saveAddress(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    await upsertAddress({
      data: {
        ...address,
        line2: address.line2 || null,
        region: address.region || null,
        phone: address.phone || null,
      },
    });
    setAddress(blankAddress);
    setBusy(false);
    setStatus("Address saved.");
    await router.invalidate();
  }

  async function removeAddress(id: string) {
    setBusy(true);
    await deleteAddress({ data: { id } });
    setBusy(false);
    setStatus("Address removed.");
    await router.invalidate();
  }

  async function signOut() {
    await supabase.auth.signOut();
    await router.navigate({ to: "/" });
  }

  function reorder(order: OrderSummary) {
    orderItemsToCartLines(order).forEach((line) => addLine(line));
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-24 md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow !text-accent mb-4">Client Room</p>
            <h1 className="font-display italic text-6xl md:text-8xl">
              Account
            </h1>
            <p className="mt-4 text-muted-foreground">
              {snapshot.profile.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="eyebrow border-b border-accent pb-1 text-accent hover:text-foreground"
              >
                Admin panel
              </Link>
            )}
            <button onClick={signOut} className="eyebrow border-b border-foreground pb-1 hover:text-accent">
              Sign Out
            </button>
          </div>
        </div>

        {status && <p className="mt-8 text-sm text-accent">{status}</p>}

        <div className="mt-14 grid gap-14 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-8">
            <section className="border border-border bg-card/70 p-6">
              <h2 className="font-display italic text-3xl">Profile</h2>
              <form onSubmit={saveProfile} className="mt-6 space-y-4">
                <AccountField
                  label="Display Name"
                  value={profile.full_name}
                  onChange={(value) => setProfile({ ...profile, full_name: value })}
                />
                <AccountField
                  label="Phone"
                  value={profile.phone}
                  onChange={(value) => setProfile({ ...profile, phone: value })}
                />
                <button disabled={busy} className="eyebrow flex h-11 w-full items-center justify-center gap-2 bg-foreground !text-background hover:bg-accent disabled:opacity-50">
                  <Save size={14} /> Save Profile
                </button>
              </form>
            </section>

            <section className="border border-border bg-card/70 p-6">
              <h2 className="font-display italic text-3xl">Addresses</h2>
              <div className="mt-6 space-y-4">
                {snapshot.addresses.map((item) => (
                  <AddressCard key={item.id} address={item} onDelete={removeAddress} />
                ))}
              </div>
              <form onSubmit={saveAddress} className="mt-6 space-y-4 border-t border-border pt-6">
                <p className="eyebrow flex items-center gap-2">
                  <Plus size={14} /> New Address
                </p>
                <AccountField label="Label" value={address.label} onChange={(value) => setAddress({ ...address, label: value })} />
                <AccountField label="Full Name" value={address.full_name} onChange={(value) => setAddress({ ...address, full_name: value })} />
                <AccountField label="Street" value={address.line1} onChange={(value) => setAddress({ ...address, line1: value })} />
                <AccountField label="Apartment" value={address.line2} onChange={(value) => setAddress({ ...address, line2: value })} />
                <div className="grid grid-cols-2 gap-3">
                  <AccountField label="City" value={address.city} onChange={(value) => setAddress({ ...address, city: value })} />
                  <AccountField label="Region" value={address.region} onChange={(value) => setAddress({ ...address, region: value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <AccountField label="Postal" value={address.postal_code} onChange={(value) => setAddress({ ...address, postal_code: value })} />
                  <AccountField label="Country" value={address.country} onChange={(value) => setAddress({ ...address, country: value })} />
                </div>
                <label className="flex items-center gap-3 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={address.is_default}
                    onChange={(e) => setAddress({ ...address, is_default: e.target.checked })}
                  />
                  Default address
                </label>
                <button disabled={busy} className="eyebrow h-11 w-full border border-border hover:border-accent hover:text-accent disabled:opacity-50">
                  Save Address
                </button>
              </form>
            </section>
          </aside>

          <main className="space-y-16">
            <section>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display italic text-4xl">Order history</h2>
                <PackageCheck className="text-accent" size={22} />
              </div>
              {orders.length === 0 ? (
                <EmptyAccountState
                  title="No orders yet."
                  body="Your confirmed compositions will appear here after checkout."
                />
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <OrderCard key={order.id} order={order} onReorder={() => reorder(order)} />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-display italic text-4xl">Wishlist</h2>
                <Heart className="text-accent" size={22} />
              </div>
              {wishedProducts.length === 0 ? (
                <EmptyAccountState
                  title="Nothing saved yet."
                  body="Tap the heart on any fragrance to keep it close."
                />
              ) : (
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-3">
                  {wishedProducts.map((product) => (
                    <div key={product.id}>
                      <ProductCard product={product} variant="grid" />
                      <button
                        onClick={() => toggleWishlist(product.slug)}
                        className="eyebrow mt-4 text-muted-foreground hover:text-accent"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full border border-input bg-transparent px-3 outline-none focus:border-accent"
      />
    </label>
  );
}

function AddressCard({
  address,
  onDelete,
}: {
  address: Address;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow !text-accent">
            {address.label || "Address"} {address.is_default ? "/ Default" : ""}
          </p>
          <p className="mt-3 text-sm">{address.full_name}</p>
          <p className="text-sm text-muted-foreground">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.region} {address.postal_code}
          </p>
          <p className="text-sm text-muted-foreground">{address.country}</p>
        </div>
        <button
          onClick={() => onDelete(address.id)}
          aria-label="Delete address"
          className="text-muted-foreground hover:text-accent"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  onReorder,
}: {
  order: OrderSummary;
  onReorder: () => void;
}) {
  return (
    <article className="border border-border bg-card/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow !text-accent">{order.order_number}</p>
          <h3 className="mt-3 font-display italic text-3xl">
            {formatPrice(order.total)}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/order-confirmation/$id"
            params={{ id: order.id }}
            className="eyebrow border-b border-foreground pb-1 hover:text-accent"
          >
            View
          </Link>
          <button onClick={onReorder} className="eyebrow flex items-center gap-2 border-b border-foreground pb-1 hover:text-accent">
            <RotateCcw size={14} /> Reorder
          </button>
        </div>
      </div>
      <StatusTimeline status={order.status} />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3 text-sm">
            {item.image_snapshot && (
              <img src={item.image_snapshot} alt="" className="h-16 w-12 object-cover" />
            )}
            <div>
              <p>{item.name_snapshot}</p>
              <p className="text-muted-foreground">
                {item.volume_snapshot}ml / Qty {item.qty}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusTimeline({ status }: { status: OrderSummary["status"] }) {
  const statuses: OrderSummary["status"][] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
  ];
  const active = status === "cancelled" ? -1 : statuses.indexOf(status);
  return (
    <div className="mt-8 grid grid-cols-5 gap-2">
      {statuses.map((item, index) => (
        <div key={item}>
          <div
            className={`h-px ${index <= active ? "bg-accent" : "bg-border"}`}
          />
          <p
            className={`eyebrow mt-3 ${index <= active ? "!text-foreground" : ""}`}
          >
            {item}
          </p>
        </div>
      ))}
      {status === "cancelled" && (
        <p className="eyebrow col-span-5 mt-3 !text-destructive">Cancelled</p>
      )}
    </div>
  );
}

function EmptyAccountState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-border p-10 text-center">
      <p className="font-display italic text-3xl">{title}</p>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">{body}</p>
      <Link to="/fragrances" className="eyebrow mt-8 inline-block border-b border-foreground pb-1 hover:text-accent">
        Browse Fragrances
      </Link>
    </div>
  );
}
