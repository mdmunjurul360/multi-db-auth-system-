import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "super_admin" | "admin" | "student";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: Role[];
  loading: boolean;
  /** True until both the session AND roles for that user have been fetched. */
  rolesLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  // Remember which user id we already loaded roles for so transient auth
  // events (TOKEN_REFRESHED, tab refocus) don't wipe roles and momentarily
  // make isAdmin=false — which was triggering redirect-to-login loops.
  const loadedFor = useRef<string | null>(null);

  const loadRoles = async (uid: string) => {
    setRolesLoading(true);
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data?.map((r) => r.role) ?? []) as Role[]);
    loadedFor.current = uid;
    setRolesLoading(false);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      const uid = sess?.user?.id ?? null;
      if (!uid) {
        setRoles([]);
        loadedFor.current = null;
        setRolesLoading(false);
        return;
      }
      // Same user as before — keep cached roles, no flicker.
      if (loadedFor.current === uid) return;
      // Defer to next tick to avoid recursive supabase calls inside the listener.
      setTimeout(() => loadRoles(uid), 0);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        loadRoles(sess.user.id);
      } else {
        setRolesLoading(false);
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return { error: error.message };
    }

    const nextSession = data.session;
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    if (nextSession?.user) {
      await loadRoles(nextSession.user.id);
    } else {
      setRoles([]);
      loadedFor.current = null;
      setRolesLoading(false);
    }
    setLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        roles,
        loading,
        rolesLoading,
        signIn,
        signUp,
        signOut,
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
        isSuperAdmin: roles.includes("super_admin"),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
