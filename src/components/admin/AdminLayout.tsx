import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BarChart3, BookOpen, ShoppingBag, UserCircle2,
  BellRing, Settings, LogOut, Search, Bell, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { AddBookDialog } from "./AddBookDialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const nav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: UserCircle2 },
  { to: "/admin/notifications", label: "Notifications", icon: BellRing },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];


export function AdminLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [openMobile, setOpenMobile] = useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");


  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar (desktop) + slide-over (mobile) */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/40 bg-sidebar/95 p-5 backdrop-blur-xl transition-transform md:sticky md:top-0 md:z-30 md:h-screen md:translate-x-0",
            openMobile ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col">
              <span className="font-display text-xl font-bold text-primary">EduBari</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Premium Management</span>
            </Link>
            <button
              onClick={() => setOpenMobile(false)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
            {nav.map((n) => {
              const active = isActive(n.to, n.exact);
              return (
                <Link
                  key={n.to}
                  to={n.to as "/admin"}
                  onClick={() => setOpenMobile(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-sidebar-accent/30 hover:text-foreground",
                  )}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 pt-4">
            <AddBookDialog />
            <Link to="/admin/settings" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" /> Settings
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" /> Logout {user?.email ? `(${user.email})` : ""}
            </button>
          </div>
        </aside>

        {openMobile && (
          <div
            onClick={() => setOpenMobile(false)}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          />
        )}

        {/* Main */}
        <main className="flex min-h-screen flex-1 flex-col p-4 md:p-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpenMobile(true)}
                className="grid h-10 w-10 place-items-center rounded-lg bg-surface text-muted-foreground md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <PageTitle path={path} />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search orders, books, users..." className="h-10 w-72 bg-surface pl-9" />
              </div>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
              <div className="h-10 w-10 rounded-full bg-gradient-primary shadow-glow" aria-label="Profile" />
            </div>
          </header>

          <div className="mt-8 flex-1">
            <Outlet />
          </div>

          <footer className="mt-10 flex flex-col gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p><span className="font-display text-base font-bold text-primary">EduBari</span> · © 2026 EduBari Premium Bookstore. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/" className="hover:text-foreground">Privacy Policy</Link>
              <Link to="/" className="hover:text-foreground">Terms of Service</Link>
              <Link to="/" className="hover:text-foreground">Contact Us</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

function PageTitle({ path }: { path: string }) {
  const map: Record<string, { title: string; sub: string }> = {
    "/admin": { title: "Welcome, Admin", sub: "Here's what's happening with your bookstore today." },
    "/admin/analytics": { title: "Analytics", sub: "Track sales, users, and book performance." },
    "/admin/books": { title: "Book Management", sub: "Add, edit, and organize your catalog." },
    "/admin/orders": { title: "Orders", sub: "Track payments, fulfilment and delivery." },
    "/admin/customers": { title: "Customers", sub: "Activity, purchases and engagement." },
    "/admin/notifications": { title: "Notifications", sub: "Send announcements and system alerts." },
    "/admin/settings": { title: "Settings", sub: "Website, payments, security and APIs." },
  };
  const meta = map[path] ?? map["/admin"];
  return (
    <div>
      <h1 className="font-display text-2xl font-bold md:text-3xl">{meta.title}</h1>
      <p className="text-sm text-muted-foreground">{meta.sub}</p>
    </div>
  );
}
