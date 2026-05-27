import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-border/40">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-4">
              <Skeleton className="h-4 w-full max-w-[140px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-gradient-card p-5 shadow-card">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-2 h-6 w-20" />
        </div>
      ))}
    </>
  );
}
