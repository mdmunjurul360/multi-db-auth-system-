import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Trash2, Shield, Zap, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, updateQty, removeFromCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — EduBari" },
      { name: "description", content: "Review the books in your shopping cart before checkout." },
      { property: "og:title", content: "Your Cart — EduBari" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const shipping = items.length ? 50 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyCoupon = () =>
    setDiscount(coupon.trim().toUpperCase() === "EDU10" ? Math.round(subtotal * 0.1) : 0);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto grid gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-gradient-card p-4 shadow-card sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">Your Cart</h1>
              <span className="text-sm text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
            </div>

            {items.length === 0 ? (
              <div className="mt-10 flex flex-col items-center gap-3 py-10 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                <Link to="/" className="text-sm text-primary hover:underline">Continue shopping →</Link>
              </div>
            ) : (
              <ul className="mt-6 divide-y divide-border/60">
                {items.map((it) => (
                  <li key={it.id} className="flex gap-4 py-5">
                    <img src={it.img} alt={it.title} className="h-24 w-20 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col">
                      <p className="font-semibold leading-tight">{it.title}</p>
                      <p className="text-xs text-muted-foreground">{it.author}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <p className="text-sm text-warning">৳ {(it.price * it.qty).toFixed(2)}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(it.id, -1)} className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"><Minus className="h-3 w-3" /></button>
                            <span className="w-6 text-center text-sm">{it.qty}</span>
                            <button onClick={() => updateQty(it.id, 1)} className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"><Plus className="h-3 w-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(it.id)} aria-label="Remove" className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:border-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="flex flex-wrap gap-3">
            <Tag icon={<Shield className="h-3.5 w-3.5" />} label="Secure Payment" />
            <Tag icon={<Zap className="h-3.5 w-3.5" />} label="Instant Digital Access" />
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-card p-6 shadow-card md:p-8 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>

          <div className="mt-6 flex gap-2">
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon Code" className="h-11 bg-input" />
            <Button onClick={applyCoupon} className="h-11 rounded-lg bg-secondary px-5 text-foreground hover:bg-secondary/80">Apply</Button>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={`৳ ${subtotal.toFixed(2)}`} />
            <Row label="Shipping" value={`৳ ${shipping.toFixed(2)}`} />
            <Row
              label={<span className="text-warning">Discount</span>}
              value={<span className="text-warning">-৳ {discount.toFixed(2)}</span>}
            />
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
            <span className="font-semibold">Total Amount</span>
            <span className="font-display text-2xl font-bold">৳ {total.toFixed(2)}</span>
          </div>

          <Button
            disabled={items.length === 0}
            onClick={() => navigate({ to: "/checkout" })}
            className="mt-5 h-12 w-full rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            Proceed to Checkout
          </Button>
          <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Continue shopping
          </Link>
        </aside>
      </main>
      <SiteFooter />
    </div>
  );
}

function Tag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground">
      {icon}{label}
    </span>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
