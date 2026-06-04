import { Link } from "@tanstack/react-router";
import { Bell, ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { to: "/" as const, label: "Home" },
  { to: "/books" as const, label: "Books" },
];

export function SiteHeader() {
  const { user, signOut, isAdmin } = useAuth();

  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="font-display text-xl font-bold text-primary">EduBari</Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          {nav.map((n, i) => (
            <Link key={i} to={n.to} className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="transition-colors hover:text-foreground">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/cart" className="rounded-full p-2 text-muted-foreground transition hover:text-foreground" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          <button className="rounded-full p-2 text-muted-foreground transition hover:text-foreground" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Dashboard
              </Link>
              <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[140px]">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="rounded-full p-2 text-muted-foreground transition hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition">
                Login
              </Link>
              <Link to="/signup">
                <Button variant="outline" className="hidden sm:inline-flex rounded-full border-border bg-transparent font-medium hover:bg-secondary">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
