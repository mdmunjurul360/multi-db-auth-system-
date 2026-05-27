import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Pencil, Trash2, Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddBookDialog, type BookForEdit } from "@/components/admin/AddBookDialog";
import { toast } from "sonner";
import { BookLoader } from "@/components/BookLoader";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/books")({
  head: () => ({ meta: [{ title: "Books — Admin" }] }),
  component: BooksPage,
});

type Book = BookForEdit & { is_published: boolean };

function BooksPage() {
  const [editing, setEditing] = useState<Book | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  // Debounce the filter so we don't re-run table filtering on every keystroke.
  const globalFilter = useDebounce(searchInput, 250);
  const [sorting, setSorting] = useState<SortingState>([]);


  // Realtime invalidation is handled globally in __root.tsx
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["books", "admin", "all"],
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Book[];
    },
  });

  const remove = async (id: string) => {
    const { error } = await supabase.from("books").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Book deleted");
  };

  const columns = useMemo<ColumnDef<Book>[]>(
    () => [
      {
        id: "book",
        accessorFn: (b) => `${b.title} ${b.author ?? ""}`,
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="inline-flex items-center gap-1">
            BOOK <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex items-center gap-3">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="h-12 w-10 rounded-md object-cover" />
              ) : (
                <div className="h-12 w-10 rounded-md bg-surface" />
              )}
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.author ?? "—"}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "CATEGORY",
        cell: ({ getValue }) => <span className="text-muted-foreground">{(getValue() as string) ?? "—"}</span>,
      },
      {
        accessorKey: "price",
        header: ({ column }) => (
          <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="inline-flex items-center gap-1">
            PRICE <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ getValue }) => <span className="font-semibold">৳{Number(getValue()).toFixed(2)}</span>,
      },
      {
        accessorKey: "is_published",
        header: "STATUS",
        cell: ({ getValue }) => {
          const pub = getValue() as boolean;
          return (
            <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${pub ? "bg-success/20 text-success" : "bg-muted/30 text-muted-foreground"}`}>
              {pub ? "PUBLISHED" : "DRAFT"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">ACTIONS</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <div className="inline-flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(row.original); setEditOpen(true); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(row.original.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: (v) => setSearchInput(typeof v === "function" ? v(searchInput) : (v as string)),

    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: "includesString",
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-gradient-card p-5 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}

            placeholder="Search title, author, category..."
            className="h-10 bg-input pl-9"
          />
        </div>
        <div className="w-full md:w-56"><AddBookDialog /></div>
      </section>

      <section className="rounded-2xl bg-gradient-card p-6 shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="text-left text-[10px] tracking-wider text-muted-foreground">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-4 py-3">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={columns.length} className="px-4 py-10"><div className="flex justify-center"><BookLoader /></div></td></tr>
              )}

              {!isLoading && table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-border/40 transition hover:bg-surface/40">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-muted-foreground">No books match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {table.getPageCount() > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {table.getFilteredRowModel().rows.length} books
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
          </div>
        )}
      </section>

      <AddBookDialog
        trigger="external"
        open={editOpen}
        onOpenChange={setEditOpen}
        editing={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
