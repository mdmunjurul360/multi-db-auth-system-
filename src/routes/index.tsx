import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { memo } from "react";
import { Eye, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookCover } from "@/components/BookCover";
import { BookLoader } from "@/components/BookLoader";
import { Button } from "@/components/ui/button";
import { addToCart, buyNow } from "@/lib/cart";
import { useBooks } from "@/lib/books";
import { publishedBooksQueryOptions } from "@/lib/queries/books";


export const Route = createFileRoute("/")({
  // Prefetch the books list during navigation — data is in cache before render,
  // eliminating the "Loading books…" flash.
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(publishedBooksQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "EduBari — Premium Books Students Love" },
      { name: "description", content: "Dive into the most-read selections across our premium catalog, from digital masterclasses to classic hardcovers." },
      { property: "og:title", content: "EduBari — Premium Books Students Love" },
      { property: "og:description", content: "Premium digital and physical books curated for ambitious students." },
    ],
  }),
  component: HomePage,
});


type Book = {
  id: string;
  title: string;
  author: string;
  cover: string;
  price: number;
  oldPrice: number;
  rating: number;
  reviews: string;
  badge: { label: string; tone: "primary" | "warning" | "success" | "info" };
};

const badgeStyles: Record<Book["badge"]["tone"], string> = {
  primary: "bg-primary/90 text-primary-foreground",
  warning: "bg-warning/90 text-background",
  success: "bg-success/90 text-background",
  info: "bg-info/90 text-background",
};

function HomePage() {
  const { books: dbBooks, loading } = useBooks();

  const all: Book[] = dbBooks.slice(0, 8).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author ? `by ${b.author}` : "",
    cover: b.cover_url || "",
    price: Number(b.price),
    oldPrice: Number(b.price) * 1.4,
    rating: Math.round(Number(b.rating ?? 4)),
    reviews: "",
    badge: { label: (b.format ?? "BOOK").toUpperCase(), tone: "primary" },
  }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 pt-10 sm:px-6 sm:pt-12">
        <section>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Popular Books Students Love
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Dive into the most-read selections across our premium catalog, from digital
            masterclasses to classic hardcovers.
          </p>
        </section>

        {loading ? (
          <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gradient-card p-3 shadow-card">
                <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-primary/10" />
                <div className="space-y-2 px-1 pb-2 pt-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-primary/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-primary/10" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-primary/10" />
                  <div className="h-9 w-full animate-pulse rounded bg-primary/10" />
                </div>
              </div>
            ))}
          </section>
        ) : all.length === 0 ? (

          <div className="mt-16 rounded-2xl bg-gradient-card p-12 text-center shadow-card">
            <p className="text-muted-foreground">No books published yet. Check back soon.</p>
          </div>
        ) : (
          <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {all.map((b, idx) => (
              // First 4 cards are above the fold on desktop → LCP candidates.
              <BookCard key={b.id} book={b} priority={idx < 4} />
            ))}
          </section>
        )}

        <div className="mt-10 text-center">
          <Link to="/books">
            <Button variant="outline" className="rounded-full border-border bg-transparent">View all books</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

const BookCard = memo(function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
  const navigate = useNavigate();
  const payload = { id: book.id, title: book.title, author: book.author, img: book.cover, price: book.price };

  const handleAdd = () => {
    addToCart(payload);
    toast.success(`Added "${book.title}" to cart`);
    navigate({ to: "/cart" });
  };

  const handleBuy = () => {
    buyNow(payload);
    navigate({ to: "/checkout" });
  };

  return (
    <article className="group overflow-hidden rounded-2xl bg-gradient-card p-3 shadow-card transition hover:shadow-glow">
      <Link to="/books/$bookId" params={{ bookId: book.id }} className="block relative overflow-hidden rounded-xl">
        <BookCover
          src={book.cover}
          alt={book.title}
          size="md"
          priority={priority}
          className="transition-transform duration-500 group-hover:scale-105"
        />

        <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[10px] font-bold tracking-wider ${badgeStyles[book.badge.tone]}`}>
          {book.badge.label}
        </span>
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/60 text-muted-foreground backdrop-blur transition hover:text-foreground" aria-label="Preview">
          <Eye className="h-4 w-4" />
        </span>
      </Link>
      <div className="px-1 pb-2 pt-4">
        <div className="flex items-center gap-2 text-warning">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < book.rating ? "fill-warning" : "opacity-30"}`} />
          ))}
          <span className="text-xs text-muted-foreground">{book.reviews}</span>
        </div>
        <Link to="/books/$bookId" params={{ bookId: book.id }} className="mt-2 block font-display text-base font-semibold hover:text-primary transition-colors">{book.title}</Link>
        <p className="text-sm text-muted-foreground">{book.author}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold">${book.price.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground line-through">${book.oldPrice.toFixed(2)}</span>
        </div>
        <div className="mt-4 space-y-2">
          <Button onClick={handleAdd} className="h-10 w-full rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow hover:opacity-95">
            Add to Cart
          </Button>
          <Button onClick={handleBuy} variant="outline" className="h-10 w-full rounded-lg border-border bg-transparent font-medium hover:bg-secondary">
            Direct Order
          </Button>
        </div>
      </div>
    </article>
  );
});

