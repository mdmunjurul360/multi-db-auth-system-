import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPER_EMAIL = "contact@edubari.bd";
const SUPER_PASSWORD = "Bot@@@@1234";

export const ensureSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    // Check if user already exists
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const existing = list?.users?.find((u) => u.email === SUPER_EMAIL);

    let userId: string;
    if (existing) {
      userId = existing.id;
      // Ensure password & confirmed status
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: SUPER_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: SUPER_EMAIL,
        password: SUPER_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: "Super Admin" },
      });
      if (error) throw error;
      userId = created.user!.id;
    }

    // Ensure super_admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "unknown" };
  }
});
