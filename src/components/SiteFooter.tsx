import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/40 mt-24">
      <div className="container mx-auto flex flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-display text-xl font-bold text-primary">EduBari</div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Elevating academic rigor through elite digital experiences.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/" className="hover:text-foreground">Terms of Service</Link>
          <Link to="/" className="hover:text-foreground">Refund Policy</Link>
          <Link to="/" className="hover:text-foreground">Contact Us</Link>
        </div>
        <p className="text-xs text-muted-foreground">© 2026 EduBari Premium Bookstore. All rights reserved.</p>
      </div>
    </footer>
  );
}
