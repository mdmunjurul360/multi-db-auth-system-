import { ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { BookLoader } from "@/components/BookLoader";

export function RequireAuth({
  children,
  adminOnly = false,
  superAdminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}) {
  const { user, loading, rolesLoading, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Wait for BOTH the session check AND the role lookup before deciding to
  // redirect. Otherwise on every route change roles are momentarily empty
  // (isAdmin=false) and the user gets bounced back to login / home.
  const needsRoleCheck = adminOnly || superAdminOnly;
  const stillResolving = loading || (!!user && needsRoleCheck && rolesLoading);

  useEffect(() => {
    if (stillResolving) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (superAdminOnly && !isSuperAdmin) {
      navigate({ to: "/" });
      return;
    }
    if (adminOnly && !isAdmin) {
      navigate({ to: "/" });
    }
  }, [user, stillResolving, isAdmin, isSuperAdmin, adminOnly, superAdminOnly, navigate]);

  if (stillResolving || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#E2F1F8]">
        <BookLoader />
      </div>
    );
  }

  if (adminOnly && !isAdmin) return null;
  if (superAdminOnly && !isSuperAdmin) return null;

  return <>{children}</>;
}
