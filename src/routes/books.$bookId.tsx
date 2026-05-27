import { useMemo, useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Clock, Languages, BookOpen, Heart, Share2, CheckCircle2, Lock, Play, Pause, Tag, FileText, Headphones, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { addToCart, buyNow } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import type { DBBook } from "@/lib/books";
import { bookByIdQueryOptions } from "@/lib/queries/books";
import bookCosmos from "@/assets/book-cosmos.jpg";

export const Route = createFileRoute("/books/$bookId")({
  loader: ({ context, params }) => {
    void context.queryClient.ensureQueryData(bookByIdQueryOptions(params.bookId));
  },
  component: BookDetailsPage,
});

type Tab = "description" | "reviews" | "preview" | "features";

function BookDetailsPage() {
  const { bookId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: book, isLoading: loading } = useQuery(bookByIdQueryOptions(bookId));
  const notFound = !loading && !book;
  const [tab, setTab] = useState<Tab>("description");
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`book-${bookId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "books", filter: `id=eq.${bookId}` },
        () => queryClient.invalidateQueries({ queryKey: ["books", "detail", bookId] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bookId, queryClient]);

  const derived = useMemo(() => {
    if (!book) return null;
    const price = Number(book.price);
    const oldPrice = book.old_price ? Number(book.old_price) : 0;
    const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
    return { price, oldPrice, discount };
  }, [book]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr_300px]">
            <Skeleton className="mx-auto aspect-[4/5] w-full max-w-xs rounded-2xl lg:max-w-none" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4 sm:h-12" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (notFound || !book || !derived) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Book not found</h1>
          <p className="mt-3 text-muted-foreground">This book may have been removed or is no longer available.</p>
          <Link to="/books"><Button className="mt-6 rounded-full bg-gradient-primary text-primary-foreground shadow-glow">Browse all books</Button></Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const cover = book.cover_url || bookCosmos;
  const { price, oldPrice, discount } = derived;
  const rating = Number(book.rating ?? 0);
  const reviewsCount = Number(book.reviews_count ?? 0);
  const inStock = (book.stock ?? 0) > 0 || book.is_published;
  const formatLabel = book.audio_url && book.pdf_url
    ? "Digital + Audio"
    : book.audio_url ? "Audio" : book.pdf_url ? "Digital" : (book.format ?? "Hard Copy").replace(/^\w/, (c) => c.toUpperCase());

  const learn = book.what_you_will_learn ?? [];
  const toc = book.table_of_contents ?? [];
  const previews = book.preview_chapters ?? [];

  const payload = { id: book.id, title: book.title, author: book.author ?? "Unknown", img: cover, price };

  const handleAdd = () => { addToCart(payload); toast.success("Added to cart"); };
  const handleBuy = () => { buyNow(payload); navigate({ to: "/checkout" }); };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
        {/* HERO */}
        <section className="rounded-3xl bg-gradient-card p-4 shadow-card sm:p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr_320px]">
            <div className="mx-auto w-full max-w-xs lg:max-w-none">
              <div className="overflow-hidden rounded-2xl shadow-glow">
                <img src={cover} alt={book.title} className="aspect-[4/5] w-full object-cover" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
                {book.category && <span className="rounded-full bg-primary/15 px-2.5 py-1 text-primary">{book.category}</span>}
                {book.audio_url && <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent-foreground">Audiobook</span>}
                {book.pdf_url && <span className="rounded-full bg-secondary/30 px-2.5 py-1">Digital</span>}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl md:text-4xl lg:text-5xl break-words">{book.title}</h1>
              {book.author && <p className="mt-3 text-muted-foreground">By {book.author}</p>}
              <div className="mt-3 flex items-center gap-2 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? "fill-warning text-warning" : "text-muted-foreground/40"}`} />
                ))}
                <span className="text-muted-foreground">
                  {rating > 0 ? `${rating.toFixed(1)} (${reviewsCount.toLocaleString()} Reviews)` : "No ratings yet"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {book.duration && <Stat icon={<Clock className="h-4 w-4" />} label="Duration" value={book.duration} />}
                {book.pages != null && <Stat icon={<BookOpen className="h-4 w-4" />} label="Pages" value={String(book.pages)} />}
                <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Status" value={inStock ? "In Stock" : "Sold Out"} />
                <Stat icon={<Languages className="h-4 w-4" />} label="Language" value={book.language ?? "English"} />
              </div>
            </div>

            {/* Buy box */}
            <aside className="h-fit rounded-2xl bg-surface-elevated p-6">
              <div className="flex items-baseline gap-3">
                {oldPrice > price && <span className="text-sm text-muted-foreground line-through">৳{oldPrice.toFixed(2)}</span>}
                <span className="font-display text-4xl font-bold">৳{price.toFixed(2)}</span>
                {discount > 0 && (
                  <span className="rounded-md bg-destructive/20 px-2 py-1 text-xs font-semibold text-destructive">{discount}% OFF</span>
                )}
              </div>
              <Button onClick={handleBuy} className="mt-5 h-12 w-full rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow hover:opacity-95">
                Buy Now
              </Button>
              <Button onClick={handleAdd} variant="outline" className="mt-2 h-12 w-full rounded-xl border-border bg-transparent">
                Add to Cart
              </Button>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <button className="inline-flex items-center gap-2 hover:text-foreground"><Heart className="h-4 w-4" /> Wishlist</button>
                <button
                  onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success("Link copied"); }}
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
              <div className="mt-5 space-y-2 border-t border-border/40 pt-4 text-xs text-muted-foreground">
                <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Verified EduBari Edition</p>
                <p className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Lifetime access on purchase</p>
              </div>
            </aside>
          </div>
        </section>

        {/* TABS */}
        <section className="mt-8">
          <div className="flex flex-wrap gap-2 border-b border-border/50">
            {([
              ["description", "Description"],
              ["reviews", "Reviews"],
              ["preview", "Preview"],
              ["features", "Features"],
            ] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative px-4 py-3 text-sm font-medium transition ${tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
                {tab === key && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-primary" />}
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              {tab === "description" && (
                <>
                  <h2 className="font-display text-2xl font-bold">Master the Digital Frontier</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                    {book.description?.trim()
                      ? book.description
                      : "No description provided yet. The author has not added a summary for this title."}
                  </p>

                  {previews.length > 0 && (
                    <div className="mt-6 rounded-2xl bg-surface-elevated p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold inline-flex items-center gap-2"><Headphones className="h-4 w-4 text-primary" /> Audiobook Preview</p>
                        <p className="text-xs text-muted-foreground">{previews.length} sample{previews.length > 1 ? "s" : ""}</p>
                      </div>
                      <ul className="mt-4 space-y-2">
                        {previews.map((p, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 rounded-xl bg-background/50 px-3 py-2">
                            <div className="flex min-w-0 items-center gap-3">
                              <button
                                onClick={() => setPlaying(playing === i ? null : i)}
                                className="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                                aria-label="Play sample"
                              >
                                {playing === i ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </button>
                              <span className="truncate text-sm">{p.title}</span>
                            </div>
                            {p.audio_url && playing === i && (
                              <audio autoPlay controls src={p.audio_url} className="ml-3 max-w-[200px]" onEnded={() => setPlaying(null)} />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Locked Download */}
                  <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-surface-elevated p-6 text-center">
                    <Lock className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-3 font-semibold">Locked Download</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Full high-resolution PDF and source files are available to verified purchasers.
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      {book.pdf_url ? (
                        <a href={book.pdf_url} target="_blank" rel="noreferrer">
                          <Button className="rounded-full bg-gradient-primary px-5 text-primary-foreground shadow-glow">
                            <FileText className="mr-2 h-4 w-4" /> Preview Chapter 1
                          </Button>
                        </a>
                      ) : (
                        <Button disabled className="rounded-full">Preview Chapter 1</Button>
                      )}
                      <Button onClick={handleBuy} variant="outline" className="rounded-full border-border bg-transparent">Unlock Now</Button>
                    </div>
                  </div>
                </>
              )}

              {tab === "reviews" && (
                <div className="rounded-2xl bg-surface-elevated p-6 text-sm">
                  {reviewsCount > 0 ? (
                    <p>{reviewsCount.toLocaleString()} verified review{reviewsCount > 1 ? "s" : ""} · average {rating.toFixed(1)} / 5.</p>
                  ) : (
                    <p className="text-muted-foreground">No reviews yet. Be the first to share your thoughts after reading.</p>
                  )}
                </div>
              )}

              {tab === "preview" && (
                <div className="rounded-2xl bg-surface-elevated p-6">
                  {book.audio_url ? (
                    <audio controls src={book.audio_url} className="w-full">Your browser does not support audio.</audio>
                  ) : book.pdf_url ? (
                    <iframe src={book.pdf_url} title="PDF preview" className="aspect-[4/3] w-full rounded-xl border border-border/40" />
                  ) : (
                    <p className="text-sm text-muted-foreground">A preview will be available soon.</p>
                  )}
                </div>
              )}

              {tab === "features" && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {[
                    book.audio_url && "Narrated audiobook",
                    book.pdf_url && "Downloadable PDF",
                    book.pages && `${book.pages} pages`,
                    book.duration && `${book.duration} listening time`,
                    book.language && `${book.language} language`,
                    "Lifetime access",
                  ].filter(Boolean).map((f, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated px-4 py-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              )}

              {/* WHAT YOU WILL LEARN + TOC */}
              {(learn.length > 0 || toc.length > 0) && (
                <section className="mt-10 grid gap-6 md:grid-cols-2">
                  {learn.length > 0 && (
                    <div className="rounded-2xl bg-surface-elevated p-6">
                      <h3 className="font-display text-lg font-bold">What You Will Learn</h3>
                      <ul className="mt-4 space-y-3 text-sm">
                        {learn.map((l, i) => (
                          <li key={i} className="flex gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {toc.length > 0 && (
                    <div className="rounded-2xl bg-surface-elevated p-6">
                      <h3 className="font-display text-lg font-bold">Table of Contents</h3>
                      <ul className="mt-4 space-y-2 text-sm">
                        {toc.map((c, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
                            <span>{c.title}</span>
                            {c.duration && <span className="text-xs text-muted-foreground">{c.duration}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Side details */}
            <aside className="space-y-6">
              <div className="rounded-2xl bg-surface-elevated p-5">
                <h3 className="font-display text-lg font-semibold">Details</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <DetailRow label="Author" value={book.author ?? "—"} />
                  <DetailRow label="Category" value={book.category ?? "—"} />
                  <DetailRow label="Format" value={formatLabel} />
                  <DetailRow label="Language" value={book.language ?? "English"} />
                  {book.pages != null && <DetailRow label="Pages" value={String(book.pages)} />}
                  {book.duration && <DetailRow label="Duration" value={book.duration} />}
                  <DetailRow label="Price" value={`৳ ${price.toFixed(2)}`} />
                  <DetailRow label="Rating" value={rating > 0 ? `${rating.toFixed(1)} / 5` : "Not rated"} />
                </ul>
              </div>
              {book.category && (
                <div className="rounded-2xl bg-surface-elevated p-5">
                  <h3 className="font-display text-lg font-semibold inline-flex items-center gap-2"><Tag className="h-4 w-4" /> Category</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{book.category}</p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-elevated p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex justify-between gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </li>
  );
}
