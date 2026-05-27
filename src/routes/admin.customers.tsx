import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Users, DollarSign } from "lucide-react";
import { adminProfilesQueryOptions, adminOrdersFullQueryOptions } from "@/lib/queries/admin";
import { TableSkeleton } from "@/components/admin/TableSkeleton";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(adminProfilesQueryOptions);
    void context.queryClient.ensureQueryData(adminOrdersFullQueryOptions);
  },
  component: CustomersPage,
});

type Row = {
  key: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  last: string;
  registered: boolean;
};

function CustomersPage() {
  const { data: profiles = [], isLoading: pl } = useQuery(adminProfilesQueryOptions);
  const { data: orders = [], isLoading: ol } = useQuery(adminOrdersFullQueryOptions);
  const loading = pl || ol;

  const byKey = new Map<string, Row>();
  for (const p of profiles) {
    byKey.set(`u:${p.id}`, {
      key: `u:${p.id}`,
      name: p.full_name ?? p.email.split("@")[0],
      email: p.email,
      orders: 0,
      spent: 0,
      last: p.created_at,
      registered: true,
    });
  }
  for (const o of orders) {
    const key = o.user_id ? `u:${o.user_id}` : `g:${(o.guest_email ?? "").toLowerCase()}`;
    if (!key || key === "g:") continue;
    let r = byKey.get(key);
    if (!r) {
      r = {
        key,
        name: o.guest_name ?? o.guest_email ?? "Guest",
        email: o.guest_email ?? "",
        orders: 0,
        spent: 0,
        last: o.created_at,
        registered: false,
      };
      byKey.set(key, r);
    }
    r.orders += 1;
    r.spent += Number(o.total || 0);
    if (new Date(o.created_at) > new Date(r.last)) r.last = o.created_at;
  }
  const rows = [...byKey.values()].sort((a, b) => b.spent - a.spent);

  const totalSpent = rows.reduce((s, r) => s + r.spent, 0);
  const avgOrders = rows.length ? (rows.reduce((s, r) => s + r.orders, 0) / rows.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Users, label: "TOTAL CUSTOMERS", value: rows.length.toString() },
          { icon: ShoppingBag, label: "AVG ORDERS / USER", value: avgOrders },
          { icon: DollarSign, label: "LIFETIME REVENUE", value: `৳${totalSpent.toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-gradient-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-3 text-[10px] tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">All Customers</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-muted-foreground">
                <th className="px-4 py-3">CUSTOMER</th>
                <th className="px-4 py-3">TYPE</th>
                <th className="px-4 py-3">ORDERS</th>
                <th className="px-4 py-3">TOTAL SPENT</th>
                <th className="px-4 py-3">LAST ACTIVITY</th>
              </tr>
            </thead>
            <tbody>
              {loading && <TableSkeleton rows={6} cols={5} />}
              {!loading && rows.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No customers yet.</td></tr>}
              {!loading && rows.map((c) => (
                <tr key={c.key} className="border-t border-border/40">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                        {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${c.registered ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"}`}>
                      {c.registered ? "REGISTERED" : "GUEST"}
                    </span>
                  </td>
                  <td className="px-4 py-4">{c.orders}</td>
                  <td className="px-4 py-4 font-semibold">৳{c.spent.toFixed(2)}</td>
                  <td className="px-4 py-4 text-muted-foreground">{new Date(c.last).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
