import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE = 60_000;
const GC = 10 * 60_000;

export const userDashboardQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["dashboard", "user", userId] as const,
    queryFn: async () => {
      const [{ data: p }, { data: o }, { data: w }, { data: n }, { data: a }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("orders").select("*, order_items(*, books(title, cover_url))").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("wishlist").select("*, books(title, author, cover_url, price)").eq("user_id", userId),
        supabase.from("notifications").select("*").or(`user_id.eq.${userId},user_id.is.null`).order("created_at", { ascending: false }).limit(20),
        supabase.from("activity_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      ]);
      return {
        profile: p as { id: string; email: string; full_name: string | null; avatar_url: string | null } | null,
        orders: o ?? [],
        wishlist: w ?? [],
        notifs: n ?? [],
        activity: a ?? [],
      };
    },
    staleTime: STALE,
    gcTime: GC,
    enabled: !!userId,
  });
