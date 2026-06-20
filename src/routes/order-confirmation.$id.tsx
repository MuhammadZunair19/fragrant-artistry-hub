import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { getOrder, orderItemsToCartLines } from "@/lib/account.functions";
import { useCart } from "@/components/cart/cart-context";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/order-confirmation/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.order?.order_number ?? "Order"} - ${SITE.brand}` },
      { name: "description", content: "Your VÉNÉRÉ order confirmation." },
    ],
  }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { redirect: location.href },
      });
    }
  },
  loader: async ({ params }) => {
    const order = await getOrder({ data: { id: params.id } });
    if (!order) throw notFound();
    return { order };
  },
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { order } = Route.useLoaderData();
  const { addLine } = useCart();

  function reorder() {
    orderItemsToCartLines(order).forEach((line) => addLine(line));
  }

  return (
    <div className="min-h-screen px-6 pt-32 pb-24 md:px-10">
      <div className="mx-auto max-w-4xl">
        <CheckCircle2 className="mb-8 text-accent" size={40} />
        <p className="eyebrow !text-accent mb-4">Confirmed</p>
        <h1 className="font-display italic text-6xl leading-none md:text-8xl">
          Order received.
        </h1>
        <div className="mt-10 border border-border bg-card/70 p-6">
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
            <div>
              <p className="eyebrow">Order</p>
              <p className="mt-2 font-display italic text-3xl">
                {order.order_number}
              </p>
            </div>
            <div>
              <p className="eyebrow">Total</p>
              <p className="mt-2 font-display italic text-3xl">
                {formatPrice(order.total)}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-border pb-4 last:border-0">
                {item.image_snapshot && (
                  <img src={item.image_snapshot} alt="" className="h-20 w-16 object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-display italic text-2xl">
                    {item.name_snapshot}
                  </p>
                  <p className="eyebrow mt-1">
                    {item.brand_snapshot} / {item.volume_snapshot}ml / Qty {item.qty}
                  </p>
                </div>
                <p className="font-mono text-sm">
                  {formatPrice(item.price_snapshot * item.qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link to="/account" className="eyebrow flex h-12 items-center justify-center bg-foreground !text-background hover:bg-accent">
              View Account
            </Link>
            <button onClick={reorder} className="eyebrow flex h-12 items-center justify-center gap-2 border border-border hover:border-accent hover:text-accent">
              <RotateCcw size={14} /> Reorder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
