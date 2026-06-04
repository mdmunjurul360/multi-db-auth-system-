import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus, CreditCard, Truck, Shield, Zap, CheckCircle2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart, updateQty, removeFromCart, clearCart } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Guest Checkout — EduBari" },
      { name: "description", content: "Complete your purchase as a guest. No registration required." },
      { property: "og:title", content: "Guest Checkout — EduBari" },
    ],
  }),
  component: CheckoutPage,
});

const methods = [
  { id: "bkash", label: "bKash", color: "bg-pink-600" },
  { id: "nagad", label: "Nagad", color: "bg-orange-500" },
  { id: "rocket", label: "Rocket", color: "bg-purple-600" },
  { id: "card", label: "Card", color: "bg-slate-700" },
  { id: "cod", label: "Cash on Delivery", color: "bg-emerald-600" },
];

const baseSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your full name"),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,}$/, "Please enter a valid phone number"),
  address: z.string().trim().min(1, "Please enter a shipping address"),
  email: z.string().trim().email("Please enter a valid email").optional().or(z.literal("")),
});

function CheckoutPage() {
  const items = useCart();
  const { user } = useAuth();

  const schema = useMemo(
    () =>
      user
        ? baseSchema
        : baseSchema.extend({
            email: z.string().trim().email("Please enter a valid email"),
          }),
    [user],
  );

  type FormValues = z.infer<typeof baseSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", phone: "", address: "", email: "" },
  });

  useEffect(() => {
    if (user?.email) reset((prev) => ({ ...prev, email: user.email ?? "" }));
  }, [user, reset]);

  const fullName = watch("fullName");
  const phone = watch("phone");

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [payment, setPayment] = useState("bkash");
  const [placedId, setPlacedId] = useState<string | null>(null);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const shipping = items.length ? 50 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  const applyCoupon = () =>
    setDiscount(coupon.trim().toUpperCase() === "EDU10" ? Math.round(subtotal * 0.1) : 0);

  const placeOrder = async (values: FormValues) => {
    if (items.length === 0) { toast.error("Your cart is empty."); return; }
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = items.filter((i) => !uuidRe.test(i.id));
    if (invalidIds.length) {
      toast.error("Your cart has outdated items. Please remove them and re-add from the catalog.");
      return;
    }
    try {
      const reference = `EDU-${Date.now().toString(36).toUpperCase()}`;
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id ?? null,
          total,
          status: "pending",
          payment_method: payment,
          guest_email: user ? null : (values.email || "").trim() || null,
          guest_name: user ? null : values.fullName.trim(),
          guest_phone: user ? null : values.phone.trim(),
          shipping_address: values.address.trim(),
          reference_id: reference,
        })
        .select()
        .single();
      if (oErr) throw oErr;

      const itemRows = items.map((i) => ({
        order_id: order.id,
        book_id: i.id,
        quantity: i.qty,
        unit_price: i.price,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(itemRows);
      if (iErr) {
        await supabase.from("orders").delete().eq("id", order.id);
        throw iErr;
      }
      setPlacedId(order.reference_id ?? order.id);
      clearCart();
      toast.success("Order placed successfully!");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Could not place your order. Please try again.");
    }
  };

  if (placedId) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-6 py-20">
          <div className="mx-auto max-w-lg rounded-2xl bg-gradient-card p-10 text-center shadow-card">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold">Order Confirmed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Thanks{fullName ? `, ${fullName}` : ""}! Your order reference is
            </p>
            <p className="mt-2 font-mono text-lg font-semibold text-primary">{placedId}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              We'll contact you on {phone || "your phone"} to confirm payment & delivery.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/"><Button variant="outline" className="rounded-full">Continue shopping</Button></Link>
              {user && (
                <Link to="/dashboard"><Button className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">View Orders</Button></Link>
              )}
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-6 py-20">
          <div className="mx-auto max-w-md rounded-2xl bg-gradient-card p-10 text-center shadow-card">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 font-display text-2xl font-bold">Your cart is empty</h1>
            <p className="mt-2 text-sm text-muted-foreground">Add some books before checking out.</p>
            <Link to="/" className="mt-6 inline-block">
              <Button className="rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Browse Books</Button>
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <form onSubmit={handleSubmit(placeOrder)} noValidate>
      <main className="container mx-auto grid gap-8 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-gradient-card p-4 shadow-card sm:p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-display text-2xl font-bold text-primary sm:text-3xl">
                {user ? "Checkout" : "Guest Checkout"}
              </h1>
              {!user && (
                <Link to="/login" className="text-xs text-muted-foreground hover:text-foreground">
                  Have an account? <span className="text-primary">Login</span>
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Full Name *" error={errors.fullName?.message}>
                <Input placeholder="John Doe" className="h-11 bg-input" aria-invalid={!!errors.fullName} {...register("fullName")} />
              </Field>
              <Field label="Phone Number *" error={errors.phone?.message}>
                <Input placeholder="+880 1XXX XXXXXX" className="h-11 bg-input" aria-invalid={!!errors.phone} {...register("phone")} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Shipping Address *" error={errors.address?.message}>
                <Textarea placeholder="House No, Road, Area, City" className="min-h-24 bg-input" aria-invalid={!!errors.address} {...register("address")} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label={user ? "Email Address" : "Email Address *"} error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  className="h-11 bg-input"
                  disabled={!!user}
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl bg-gradient-card p-4 shadow-card sm:p-6 md:p-8">
            <h2 className="font-display text-xl font-bold">Payment Method</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {methods.map((m) => {
                const active = payment === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayment(m.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border bg-surface-elevated p-4 transition ${
                      active ? "border-2 border-primary shadow-glow" : "border-border hover:border-primary/60"
                    }`}
                  >
                    {m.id === "card" ? (
                      <CreditCard className="h-7 w-7 text-foreground" />
                    ) : m.id === "cod" ? (
                      <Truck className="h-7 w-7 text-foreground" />
                    ) : (
                      <span className={`grid h-10 w-14 place-items-center rounded-md text-xs font-bold text-white ${m.color}`}>{m.label}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="flex flex-wrap gap-3">
            <Tag icon={<Shield className="h-3.5 w-3.5" />} label="Secure Payment" />
            <Tag icon={<Zap className="h-3.5 w-3.5" />} label="Instant Digital Access" />
          </div>
        </div>

        <aside className="rounded-2xl bg-gradient-card p-4 shadow-card sm:p-6 md:p-8 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <div className="mt-6 space-y-5">
            {items.map((it) => (
              <Item
                key={it.id}
                img={it.img}
                title={it.title}
                author={it.author}
                price={it.price}
                qty={it.qty}
                onInc={() => updateQty(it.id, 1)}
                onDec={() => updateQty(it.id, -1)}
                onRemove={() => removeFromCart(it.id)}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon Code (try EDU10)" className="h-11 bg-input" />
            <Button type="button" onClick={applyCoupon} className="h-11 rounded-lg bg-secondary px-5 text-foreground hover:bg-secondary/80">Apply</Button>
          </div>
          <dl className="mt-6 space-y-2 text-sm">
            <Row label="Subtotal" value={`৳ ${subtotal.toFixed(2)}`} />
            <Row label="Shipping" value={`৳ ${shipping.toFixed(2)}`} />
            <Row label={<span className="text-warning">Discount</span>} value={<span className="text-warning">-৳ {discount.toFixed(2)}</span>} />
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
            <span className="font-semibold">Total Amount</span>
            <span className="font-display text-2xl font-bold">৳ {total.toFixed(2)}</span>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 h-12 w-full rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            {isSubmitting ? "Placing order…" : "Complete Order"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {user ? "Order will be linked to your account." : "No registration required for guest checkout."}
          </p>
        </aside>
      </main>
      </form>
    </div>

  );
}

function Field({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
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

function Item({
  img, title, author, price, qty, onInc, onDec, onRemove,
}: {
  img: string; title: string; author: string; price: number; qty: number;
  onInc: () => void; onDec: () => void; onRemove: () => void;
}) {
  return (
    <div className="flex gap-4">
      <img src={img} alt={title} className="h-20 w-16 rounded-lg object-cover" />
      <div className="flex-1">
        <p className="font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground">{author}</p>
        <p className="mt-2 text-sm text-warning">৳ {(price * qty).toFixed(2)}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1">
          <button onClick={onDec} className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"><Minus className="h-3 w-3" /></button>
          <span className="w-6 text-center text-sm">{qty}</span>
          <button onClick={onInc} className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground"><Plus className="h-3 w-3" /></button>
        </div>
        <button onClick={onRemove} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
      </div>
    </div>
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
