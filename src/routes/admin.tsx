import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — EduBari" },
      { name: "description", content: "EduBari premium management dashboard." },
    ],
  }),
  component: () => (
    <RequireAuth adminOnly>
      <AdminLayout />
    </RequireAuth>
  ),
});

