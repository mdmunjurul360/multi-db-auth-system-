import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DBBook } from "@/lib/books";

export const booksKeys = {
  all: ["books"] as const,
  list: () => ["books", "list", "published"] as const,
  detail: (id: string) => ["books", "detail", id] as const,
};

/** Lightweight columns for list views — covers home, /books, search results. */
export type BookListItem = Pick<
  DBBook,
  "id" | "title" | "author" | "price" | "old_price" | "cover_url" | "rating" | "format" | "category"
>;

/**
 * List query — selects only the columns needed for cards.
 * Payload ~70% smaller than select('*'), and the DB index
 * (idx_books_published_created) makes this O(log n).
 */
export const publishedBooksQueryOptions = queryOptions({
  queryKey: booksKeys.list(),
  queryFn: async (): Promise<BookListItem[]> => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, price, old_price, cover_url, rating, format, category")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as BookListItem[];
  },
  staleTime: 5 * 60 * 1000, // 5 min — realtime listener invalidates anyway
  gcTime: 30 * 60 * 1000,
});

export const bookByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: booksKeys.detail(id),
    queryFn: async (): Promise<DBBook | null> => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as DBBook | null;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
