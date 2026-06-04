import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User, BookOpen, Headphones, Download, Heart, Bell, ShoppingBag, Settings,
  LogOut, Menu, X, ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { userDashboardQueryOptions } from "@/lib/queries/user";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — EduBari" },
      { name: "description", content: "Manage your profile, books and orders." },
    ],
  }),
  component: () => (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  ),
});

type Profile = { id: string; email: string; full_name: string | null; avatar_url: string | null };

function DashboardPage() {
  const { user, signOut, roles, isAdmin } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("profile");

  const { data } = useQuery(userDashboardQueryOptions(user?.id ?? ""));
  const orders = data?.orders ?? [];
  const wishlist: any[] = data?.wishlist ?? [];
  const notifs: any[] = data?.notifs ?? [];
  const activity: any[] = data?.activity ?? [];
  const [profileDraft, setProfileDraft] = useState<Profile | null>(null);
  const profile: Profile | null = profileDraft ?? (data?.profile as Profile | null) ?? null;
  const setProfile = (updater: (p: Profile | null) => Profile | null) => setProfileDraft(updater(profile));
  const [savingProfile, setSavingProfile] = useState(false);

  const onLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
    }).eq("id", profile.id);
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated.");
  };

  const removeWishlist = async (id: string) => {
    const { error } = await supabase.from("wishlist").delete().eq("id", id);
    if (error) return toast.error(error.message);
    queryClient.invalidateQueries({ queryKey: ["dashboard", "user"] });
  };

  const purchasedBooks = orders.flatMap((o) => (o.order_items ?? []).map((it: any) => ({
    id: it.book_id,
    title: it.books?.title ?? "Book",
    cover: it.books?.cover_url,
    qty: it.quantity,
    orderStatus: o.status,
    orderedAt: o.created_at,
  })));

  const audioOrders = orders.filter(o => o.order_items?.some((i: any) => i.books?.title));
  const pdfDownloads = audioOrders;

  const sideItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "books", label: "Purchased Books", icon: BookOpen },
    { id: "audio", label: "Audio History", icon: Headphones },
    { id: "pdf", label: "PDF Downloads", icon: Download },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "orders", label: "Order History", icon: ShoppingBag },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 mt-16 flex w-64 flex-col border-r border-border/40 bg-sidebar/95 p-5 backdrop-blur-xl transition-transform md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)] md:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between md:hidden">
            <span className="font-display text-lg font-bold text-primary">My Account</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
          </div>

          <div className="mt-2 flex items-center gap-3 rounded-xl bg-surface p-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground shadow-glow">
              {(profile?.full_name ?? user?.email ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile?.full_name ?? "Reader"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-1">
            {sideItems.map((it) => {
              const active = tab === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => { setTab(it.id); setOpen(false); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-foreground",
                  )}
                >
                  <it.icon className="h-4 w-4" /> {it.label}
                </button>
              );
            })}
          </nav>

          <div className="space-y-2 pt-4">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-primary hover:bg-sidebar-accent/30">
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Link>
            )}
            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden" />}

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 flex items-center gap-3 md:hidden">
            <button onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-muted-foreground"><Menu className="h-5 w-5" /></button>
            <h1 className="font-display text-xl font-bold">My Dashboard</h1>
          </div>

          <header className="mb-6 hidden md:flex md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold">My Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name ?? user?.email}.</p>
            </div>
            <div className="flex items-center gap-2">
              {roles.map((r) => (
                <Badge key={r} variant="outline" className="capitalize border-primary/30 text-primary">
                  {r.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Purchased" value={purchasedBooks.length} icon={BookOpen} />
            <StatCard label="Wishlist" value={wishlist.length} icon={Heart} />
            <StatCard label="Orders" value={orders.length} icon={ShoppingBag} />
            <StatCard label="Notifications" value={notifs.filter(n => !n.is_read).length} icon={Bell} />
          </div>

          <div className="mt-8 rounded-2xl border border-border/50 bg-gradient-card p-6 shadow-card backdrop-blur-xl">
            {tab === "profile" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">Personal profile</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Full name</label>
                    <Input value={profile?.full_name ?? ""} onChange={(e) => setProfile((p) => p ? { ...p, full_name: e.target.value } : p)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Email</label>
                    <Input value={user?.email ?? ""} disabled className="mt-1" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground">Avatar URL</label>
                    <Input value={profile?.avatar_url ?? ""} onChange={(e) => setProfile((p) => p ? { ...p, avatar_url: e.target.value } : p)} className="mt-1" placeholder="https://..." />
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={savingProfile} className="bg-gradient-primary text-primary-foreground shadow-glow">
                  {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </div>
            )}

            {tab === "books" && <BookGrid items={purchasedBooks} empty="No purchased books yet." />}
            {tab === "audio" && <BookGrid items={purchasedBooks} empty="No audio book history." />}
            {tab === "pdf" && (
              <div>
                <h2 className="font-display text-xl font-bold">PDF download history</h2>
                <ul className="mt-4 divide-y divide-border/40">
                  {pdfDownloads.length === 0 && <li className="py-6 text-sm text-muted-foreground">No downloads yet.</li>}
                  {pdfDownloads.map((o, i) => (
                    <li key={o.id ?? i} className="flex items-center justify-between py-3 text-sm">
                      <span>{o.order_items?.map((i: any) => i.books?.title).filter(Boolean).join(", ") || "Order"}</span>
                      <span className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "wishlist" && (
              <div>
                <h2 className="font-display text-xl font-bold">Wishlist</h2>
                {wishlist.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">Your wishlist is empty.</p>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {wishlist.map((w) => (
                      <div key={w.id} className="flex gap-3 rounded-xl bg-surface p-3">
                        {w.books?.cover_url && <img src={w.books.cover_url} alt={w.books?.title} className="h-20 w-14 rounded-md object-cover" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{w.books?.title}</p>
                          <p className="text-xs text-muted-foreground">{w.books?.author}</p>
                          <p className="mt-1 text-xs">${Number(w.books?.price ?? 0).toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeWishlist(w.id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "notifications" && (
              <div>
                <h2 className="font-display text-xl font-bold">Notifications</h2>
                <ul className="mt-4 divide-y divide-border/40">
                  {notifs.length === 0 && <li className="py-6 text-sm text-muted-foreground">You're all caught up.</li>}
                  {notifs.map((n) => (
                    <li key={n.id} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground">{n.body}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "orders" && (
              <div>
                <h2 className="font-display text-xl font-bold">Order history</h2>
                <ul className="mt-4 divide-y divide-border/40">
                  {orders.length === 0 && <li className="py-6 text-sm text-muted-foreground">No orders yet.</li>}
                  {orders.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <p className="font-medium">${Number(o.total).toFixed(2)} · <span className="text-muted-foreground capitalize">{o.status}</span></p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline">{o.payment_method ?? "—"}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "settings" && (
              <Tabs defaultValue="security" className="w-full">
                <TabsList>
                  <TabsTrigger value="security">Security</TabsTrigger>
                  <TabsTrigger value="activity">Activity Log</TabsTrigger>
                </TabsList>
                <TabsContent value="security" className="mt-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Reset your password if you suspect any unusual activity.</p>
                  <Link to="/forgot-password"><Button variant="outline">Reset password</Button></Link>
                </TabsContent>
                <TabsContent value="activity" className="mt-4">
                  <ul className="divide-y divide-border/40">
                    {activity.length === 0 && <li className="py-6 text-sm text-muted-foreground">No activity recorded yet.</li>}
                    {activity.map((a) => (
                      <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                        <span className="capitalize">{a.event}</span>
                        <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-gradient-card p-5 shadow-card backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary shadow-glow">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function BookGrid({ items, empty }: { items: any[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b, i) => (
        <div key={i} className="flex gap-3 rounded-xl bg-surface p-3">
          {b.cover && <img src={b.cover} alt={b.title} className="h-20 w-14 rounded-md object-cover" />}
          <div>
            <p className="text-sm font-medium">{b.title}</p>
            <p className="text-xs text-muted-foreground">Qty: {b.qty}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
