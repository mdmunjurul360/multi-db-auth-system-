import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — EduBari" },
      { name: "description", content: "Reset your EduBari password." },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});
type FormValues = z.infer<typeof schema>;

function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(values.email);
    toast.success("Check your inbox for the reset link.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-border/50 bg-gradient-card p-8 shadow-card backdrop-blur-xl">
          <h1 className="font-display text-3xl font-bold">Forgot password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-surface p-4 text-sm text-muted-foreground">
              We've sent a password reset link to <strong className="text-foreground">{sent}</strong>. Check your inbox.
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <Button type="submit" disabled={isSubmitting} className="h-11 w-full rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow hover:opacity-95">
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered? <Link to="/login" className="text-primary hover:underline">Back to login</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
