import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminOrder = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  payment_method: string | null;
  reference_id: string | null;
  order_items?: { quantity: number; unit_price: number; books?: { title: string; cover_url: string | null; category: string | null } | null }[];
};

export type AdminProfile = { id: string; email: string; full_name: string | null; created_at: string };

const STALE = 60_000;
const GC = 10 * 60_000;

export const adminOrdersFullQueryOptions = queryOptions({
  queryKey: ["orders", "admin", "full"] as const,
  queryFn: async (): Promise<AdminOrder[]> => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(quantity, unit_price, books(title, cover_url, category))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminOrder[];
  },
  staleTime: STALE,
  gcTime: GC,
});

export const adminProfilesQueryOptions = queryOptions({
  queryKey: ["profiles", "admin", "list"] as const,
  queryFn: async (): Promise<AdminProfile[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminProfile[];
  },
  staleTime: STALE,
  gcTime: GC,
});

export const adminBooksCountQueryOptions = queryOptions({
  queryKey: ["books", "admin", "count"] as const,
  queryFn: async (): Promise<number> => {
    const { count, error } = await supabase.from("books").select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  },
  staleTime: STALE,
  gcTime: GC,
});

export type AdminBook = { id: string; title: string; author: string | null; price: number; cover_url: string | null; category: string | null };

export const adminBooksListQueryOptions = queryOptions({
  queryKey: ["books", "admin", "list"] as const,
  queryFn: async (): Promise<AdminBook[]> => {
    const { data, error } = await supabase
      .from("books")
      .select("id, title, author, price, cover_url, category")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AdminBook[];
  },
  staleTime: STALE,
  gcTime: GC,
});
