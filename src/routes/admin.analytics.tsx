import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, BookOpen, DollarSign } from "lucide-react";
import {
  adminOrdersFullQueryOptions,
  adminBooksCountQueryOptions,
  adminProfilesQueryOptions,
} from "@/lib/queries/admin";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Admin" }] }),
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(adminOrdersFullQueryOptions);
    void context.queryClient.ensureQueryData(adminBooksCountQueryOptions);
    void context.queryClient.ensureQueryData(adminProfilesQueryOptions);
  },
  component: AnalyticsPage,
});

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function AnalyticsPage() {
  const { data: orders = [], isLoading: ol } = useQuery(adminOrdersFullQueryOptions);
  const { data: booksCount = 0 } = useQuery(adminBooksCountQueryOptions);
  const { data: profiles = [], isLoading: pl } = useQuery(adminProfilesQueryOptions);
  const loading = ol || pl;
  const usersCount = profiles.length;

  // 8-week signup buckets
  const signupSeries = new Array(8).fill(0) as number[];
  const now = Date.now();
  for (const p of profiles) {
    const t = new Date(p.created_at).getTime();
    const weeksAgo = Math.floor((now - t) / (7 * 24 * 60 * 60 * 1000));
    if (weeksAgo >= 0 && weeksAgo < 8) signupSeries[7 - weeksAgo] += 1;
  }

  const monthly = new Array(12).fill(0);
  const currentYear = new Date().getFullYear();
  for (const o of orders) {
    const d = new Date(o.created_at);
    if (d.getFullYear() === currentYear) monthly[d.getMonth()] += Number(o.total || 0);
  }
  const monthlyMax = Math.max(...monthly, 1);

  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const titlesSold = orders.reduce((s, o) => s + (o.order_items ?? []).reduce((q, i) => q + i.quantity, 0), 0);

  const customerKeys = new Set<string>();
  for (const o of orders) {
    if (o.user_id) customerKeys.add(`u:${o.user_id}`);
    else if (o.guest_email) customerKeys.add(`g:${o.guest_email.toLowerCase()}`);
  }
  const conversion = usersCount > 0 ? ((customerKeys.size / usersCount) * 100).toFixed(1) + "%" : "—";

  const perfMap = new Map<string, { title: string; category: string; units: number; revenue: number }>();
  for (const o of orders) {
    for (const it of o.order_items ?? []) {
      const t = it.books?.title ?? "Unknown";
      const c = it.books?.category ?? "—";
      const cur = perfMap.get(t) ?? { title: t, category: c, units: 0, revenue: 0 };
      cur.units += it.quantity;
      cur.revenue += Number(it.unit_price) * it.quantity;
      perfMap.set(t, cur);
    }
  }
  const performance = [...perfMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const stats = [
    { icon: DollarSign, label: "TOTAL REVENUE", value: `৳${revenue.toFixed(2)}` },
    { icon: Users, label: "REGISTERED USERS", value: usersCount.toLocaleString() },
    { icon: BookOpen, label: "TITLES SOLD", value: titlesSold.toLocaleString() },
    { icon: TrendingUp, label: "BUYER RATE", value: conversion },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-gradient-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <s.icon className="h-5 w-5 opacity-80" />
            </div>
            <p className="mt-3 text-[10px] tracking-wider text-muted-foreground">{s.label}</p>
            {loading ? <Skeleton className="mt-2 h-6 w-24" /> : <p className="mt-1 font-display text-xl font-bold">{s.value}</p>}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl bg-gradient-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">Monthly Revenue ({currentYear})</h3>
          <p className="text-xs text-muted-foreground">Total revenue per month from orders</p>
          <div className="mt-8 flex h-56 items-end gap-2">
            {monthly.map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-primary transition hover:opacity-90"
                  style={{ height: `${(h / monthlyMax) * 100}%`, opacity: h === 0 ? 0.15 : 0.5 + (h / monthlyMax) * 0.5 }}
                />
                <span className="text-[10px] text-muted-foreground">{months[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-card p-6 shadow-card">
          <h3 className="font-display text-lg font-bold">User Growth</h3>
          <p className="text-xs text-muted-foreground">New signups (last 8 weeks)</p>
          <svg viewBox="0 0 320 180" className="mt-6 w-full">
            <defs>
              <linearGradient id="ug" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="oklch(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const max = Math.max(...signupSeries, 1);
              const pts = signupSeries.map((v, i) => `${(i / (signupSeries.length - 1)) * 320},${180 - (v / max) * 160}`);
              return (
                <>
                  <polyline points={pts.join(" ")} fill="none" stroke="oklch(var(--primary))" strokeWidth="2.5" />
                  <polygon points={`0,180 ${pts.join(" ")} 320,180`} fill="url(#ug)" />
                </>
              );
            })()}
          </svg>
          <p className="mt-2 text-center text-xs text-muted-foreground">Total: {signupSeries.reduce((a, b) => a + b, 0)} new users</p>
        </div>
      </section>

      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold">Book Performance</h3>
        <p className="text-xs text-muted-foreground">Top sellers based on real orders</p>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-wider text-muted-foreground">
                <th className="px-4 py-3">TITLE</th>
                <th className="px-4 py-3">CATEGORY</th>
                <th className="px-4 py-3">UNITS</th>
                <th className="px-4 py-3 text-right">REVENUE</th>
              </tr>
            </thead>
            <tbody>
              {!loading && performance.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No sales recorded yet. Books in catalog: {booksCount}.</td></tr>}
              {performance.map((p) => (
                <tr key={p.title} className="border-t border-border/40">
                  <td className="px-4 py-4 font-medium">{p.title}</td>
                  <td className="px-4 py-4 text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-4">{p.units.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-semibold">৳{p.revenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
