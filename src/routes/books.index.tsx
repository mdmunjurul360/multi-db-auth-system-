import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, Star } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookCover } from "@/components/BookCover";
import { Button } from "@/components/ui/button";
import { addToCart, buyNow } from "@/lib/cart";
import { useBooks } from "@/lib/books";
import { publishedBooksQueryOptions } from "@/lib/queries/books";

export const Route = createFileRoute("/books/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(publishedBooksQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Books — EduBari" },
      { name: "description", content: "Browse the full EduBari catalog of premium digital, audio and print books." },
    ],
  }),
  component: BooksPage,
});


function BooksPage() {
  const { books, loading } = useBooks();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">All Books</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">The full premium EduBari catalog.</p>
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
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-10 sm:px-6 sm:py-12">
        <h1 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">All Books</h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">The full premium EduBari catalog.</p>

        {books.length === 0 ? (
          <div className="mt-16 rounded-2xl bg-gradient-card p-12 text-center shadow-card">
            <p className="text-muted-foreground">No books published yet. Check back soon.</p>
          </div>
        ) : (
          <section className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((b, idx) => {
              const payload = {
                id: b.id,
                title: b.title,
                author: b.author ?? "Unknown",
                img: b.cover_url || "",
                price: Number(b.price),
              };
              return (
                <article key={b.id} className="group overflow-hidden rounded-2xl bg-gradient-card p-3 shadow-card transition hover:shadow-glow">
                  <Link to="/books/$bookId" params={{ bookId: b.id }} className="block relative overflow-hidden rounded-xl">
                    <BookCover
                      src={payload.img}
                      alt={b.title}
                      size="md"
                      priority={idx < 4}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-background/60 text-muted-foreground backdrop-blur">
                      <Eye className="h-4 w-4" />
                    </span>
                  </Link>

                  <div className="px-1 pb-2 pt-4">
                    <div className="flex items-center gap-2 text-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(Number(b.rating ?? 0)) ? "fill-warning" : "opacity-30"}`} />
                      ))}
                    </div>
                    <p className="mt-2 font-display text-base font-semibold">{b.title}</p>
                    <p className="text-sm text-muted-foreground">by {payload.author}</p>
                    <div className="mt-3 text-lg font-bold">৳ {payload.price.toFixed(2)}</div>
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => { addToCart(payload); toast.success("Added to cart"); navigate({ to: "/cart" }); }}
                        className="h-10 w-full rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow hover:opacity-95"
                      >
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => { buyNow(payload); navigate({ to: "/checkout" }); }}
                        variant="outline"
                        className="h-10 w-full rounded-lg border-border bg-transparent font-medium hover:bg-secondary"
                      >
                        Direct Order
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
