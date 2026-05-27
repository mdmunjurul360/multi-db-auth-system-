import { useQuery } from "@tanstack/react-query";
import { publishedBooksQueryOptions, type BookListItem } from "@/lib/queries/books";

export type DBBook = {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  description: string | null;
  price: number;
  old_price: number | null;
  cover_url: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  format: string | null;
  rating: number | null;
  reviews_count: number | null;
  pages: number | null;
  duration: string | null;
  language: string | null;
  stock: number | null;
  what_you_will_learn: string[] | null;
  table_of_contents: { title: string; duration?: string }[] | null;
  preview_chapters: { title: string; audio_url?: string }[] | null;
  is_published: boolean;
  created_at: string;
};

/**
 * Public hook backed by TanStack Query. Returns lightweight list items
 * (subset of columns — see BookListItem). Use bookByIdQueryOptions for
 * full DBBook records on detail pages.
 *
 * The global realtime listener in __root.tsx invalidates `["books"]` keys
 * when the books table changes, so every consumer stays in sync.
 */
export function useBooks(): { books: BookListItem[]; loading: boolean } {
  const { data, isLoading } = useQuery(publishedBooksQueryOptions);
  return { books: data ?? [], loading: isLoading };
}

