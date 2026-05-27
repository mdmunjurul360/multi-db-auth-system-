import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ShoppingCart, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminOrdersFullQueryOptions,
  adminBooksListQueryOptions,
  adminProfilesQueryOptions,
} from "@/lib/queries/admin";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin" }] }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(adminOrdersFullQueryOptions);
    void context.queryClient.ensureQueryData(adminBooksListQueryOptions);
    void context.queryClient.ensureQueryData(adminProfilesQueryOptions);
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { data: orders = [], isLoading: ol } = useQuery(adminOrdersFullQueryOptions);
  const { data: books = [], isLoading: bl } = useQuery(adminBooksListQueryOptions);
  const { data: profiles = [] } = useQuery(adminProfilesQueryOptions);
  const usersCount = profiles.length;
  const loading = ol || bl;

  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const pending = orders.filter((o) => ["pending", "processing"].includes(o.status?.toLowerCase())).length;

  const titleCount = new Map<string, { title: string; cover: string | null; units: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.order_items ?? []) {
      const t = it.books?.title ?? "Unknown";
      const cur = titleCount.get(t) ?? { title: t, cover: it.books?.cover_url ?? null, units: 0, revenue: 0 };
      cur.units += it.quantity;
      cur.revenue += Number(it.unit_price) * it.quantity;
      titleCount.set(t, cur);
    }
  }
  const topBooks = [...titleCount.values()].sort((a, b) => b.units - a.units).slice(0, 3);

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const monthBuckets = new Array(12).fill(0);
  for (const o of orders) {
    const d = new Date(o.created_at);
    monthBuckets[d.getMonth()] += Number(o.total || 0);
  }
  const maxBucket = Math.max(...monthBuckets, 1);

  const stats = [
    { icon: BookOpen, label: "TOTAL BOOKS", value: books.length.toLocaleString() },
    { icon: ShoppingCart, label: "TOTAL ORDERS", value: orders.length.toLocaleString() },
    { icon: Clock, label: "PENDING", value: pending.toLocaleString(), highlight: true },
    { icon: Users, label: "USERS", value: usersCount.toLocaleString() },
    { icon: DollarSign, label: "REVENUE", value: `৳${revenue.toFixed(2)}` },
  ];

  const recent = orders.slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 shadow-card transition hover:-translate-y-0.5 ${s.highlight ? "bg-gradient-primary text-primary-foreground" : "bg-gradient-card"}`}>
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 opacity-80" />
            </div>
            <p className={`mt-3 text-[10px] tracking-wider ${s.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{s.label}</p>
            {loading ? <Skeleton className="mt-2 h-6 w-16" /> : <p className={`mt-1 font-display text-xl font-bold ${s.highlight ? "text-warning" : ""}`}>{s.value}</p>}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-2xl bg-gradient-card p-6 shadow-card">
          <div>
            <h3 className="font-display text-lg font-bold">Sales Analytics</h3>
            <p className="text-xs text-muted-foreground">Monthly revenue (current year orders)</p>
          </div>
          <div className="mt-8 flex h-56 items-end gap-2">
            {monthBuckets.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-lg bg-gradient-primary transition" style={{ height: `${(h / maxBucket) * 100}%`, opacity: h === 0 ? 0.15 : 0.5 + (h / maxBucket) * 0.5 }} />
                <span className="text-[10px] text-muted-foreground">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">Top Selling Books</h3>
          {loading ? (
            <div className="mt-5 space-y-4">
              {[0,1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : topBooks.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No sales recorded yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {topBooks.map((b) => (
                <li key={b.title} className="flex items-center gap-3">
                  {b.cover ? <img src={b.cover} alt={b.title} className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-surface" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.units} sold</p>
                  </div>
                  <p className="text-sm font-semibold">৳{b.revenue.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/books">
            <Button variant="outline" className="mt-5 w-full rounded-xl border-border bg-transparent text-xs">VIEW ALL INVENTORY</Button>
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Recent Transactions</h3>
          <Link to="/admin/orders" className="text-xs text-primary hover:underline">View Full History →</Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-muted-foreground">
                <th className="px-4 py-3">CUSTOMER</th>
                <th className="px-4 py-3">ITEMS</th>
                <th className="px-4 py-3">STATUS</th>
                <th className="px-4 py-3">AMOUNT</th>
                <th className="px-4 py-3">DATE</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={4} cols={5} />}
              {!loading && recent.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No orders yet.</td></tr>
              )}
              {!loading && recent.map((o) => {
                const name = o.guest_name ?? o.guest_email ?? (o.user_id ? "Registered user" : "Guest");
                const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                const items = (o.order_items ?? []).map((i) => i.books?.title).filter(Boolean).join(", ") || "—";
                return (
                  <tr key={o.id} className="border-t border-border/40">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">{initials || "U"}</span>
                        {name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{items}</td>
                    <td className="px-4 py-4"><span className="rounded-md bg-primary/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{o.status}</span></td>
                    <td className="px-4 py-4 font-semibold">৳{Number(o.total).toFixed(2)}</td>
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
