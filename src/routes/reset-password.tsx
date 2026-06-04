import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — EduBari" },
      { name: "description", content: "Set a new password for your EduBari account." },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
type FormValues = z.infer<typeof schema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) return toast.error(error.message);
    toast.success("Password updated. Please sign in again.");
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-gradient-card p-8 shadow-card backdrop-blur-xl">
          <h1 className="font-display text-3xl font-bold">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password to secure your account.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Input type="password" placeholder="New password" aria-invalid={!!errors.password} {...register("password")} />
              {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div>
              <Input type="password" placeholder="Confirm password" aria-invalid={!!errors.confirm} {...register("confirm")} />
              {errors.confirm && <p className="mt-1 text-xs text-destructive">{errors.confirm.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow hover:opacity-95">
              {isSubmitting ? "Updating..." : "Update password"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Back to login</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
