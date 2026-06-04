import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminOrdersFullQueryOptions } from "@/lib/queries/admin";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(adminOrdersFullQueryOptions);
  },
  component: OrdersPage,
});

const STATUSES = ["pending", "processing", "shipped", "delivered", "completed", "refunded", "cancelled"];

const tone = (s: string) => {
  const k = s.toLowerCase();
  if (["completed", "delivered"].includes(k)) return "bg-success/20 text-success";
  if (["pending", "processing"].includes(k)) return "bg-warning/20 text-warning";
  if (["shipped"].includes(k)) return "bg-primary/20 text-primary";
  if (["refunded", "cancelled"].includes(k)) return "bg-destructive/20 text-destructive";
  return "bg-muted/30 text-muted-foreground";
};

function OrdersPage() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: loading } = useQuery(adminOrdersFullQueryOptions);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = orders.filter((o) => {
    const customer = o.guest_name ?? o.guest_email ?? "";
    const items = (o.order_items ?? []).map((i) => i.books?.title ?? "").join(" ");
    return (
      (filter === "ALL" || o.status?.toLowerCase() === filter.toLowerCase()) &&
      [o.id, customer, items, o.reference_id ?? ""].join(" ").toLowerCase().includes(q.toLowerCase())
    );
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order updated → ${status}`);
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "TOTAL ORDERS", value: orders.length.toString() },
          { label: "PENDING", value: orders.filter((o) => o.status?.toLowerCase() === "pending").length.toString() },
          { label: "SHIPPED", value: orders.filter((o) => o.status?.toLowerCase() === "shipped").length.toString() },
          { label: "REVENUE", value: `৳${totalRevenue.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-gradient-card p-5 shadow-card">
            <p className="text-[10px] tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, customer, book..." className="h-10 bg-input pl-9" />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 w-44 bg-input"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ALL</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-muted-foreground">
                <th className="px-4 py-3">ORDER</th>
                <th className="px-4 py-3">CUSTOMER</th>
                <th className="px-4 py-3">ITEMS</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">PAYMENT</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">DATE</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={6} cols={7} />}
              {!loading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No orders found.</td></tr>}
              {!loading && filtered.map((o) => {
                const customer = o.guest_name ?? o.guest_email ?? (o.user_id ? "Registered user" : "Guest");
                const items = (o.order_items ?? []).map((i) => i.books?.title).filter(Boolean).join(", ") || "—";
                return (
                  <tr key={o.id} className="border-t border-border/40">
                    <td className="px-4 py-4 font-mono text-xs text-primary">{o.id.slice(0, 8)}</td>
                    <td className="px-4 py-4">
                      <div>
                        <p>{customer}</p>
                        {o.guest_email && <p className="text-xs text-muted-foreground">{o.guest_email}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{items}</td>
                    <td className="px-4 py-4 font-semibold">৳{Number(o.total).toFixed(2)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{o.payment_method ?? "—"}</td>
                    <td className="px-4 py-4">
                      <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                        <SelectTrigger className={`h-8 w-36 border-none text-[10px] font-bold uppercase tracking-wider ${tone(o.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
