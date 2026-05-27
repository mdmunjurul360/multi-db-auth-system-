import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin-signup")({
  head: () => ({
    meta: [
      { title: "Admin Signup — EduBari" },
      { name: "description", content: "Request admin access. Approval required by Super Admin." },
    ],
  }),
  component: AdminSignupPage,
});

function AdminSignupPage() {
  const { user, signUp } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let userId = user?.id;
    if (!userId) {
      if (password.length < 6) {
        setLoading(false);
        return toast.error("Password must be at least 6 characters.");
      }
      const { error: signUpErr } = await signUp(email, password, fullName);
      if (signUpErr) {
        setLoading(false);
        return toast.error(signUpErr);
      }
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    const { error } = await supabase.from("admin_requests").insert({
      user_id: userId ?? null,
      email,
      full_name: fullName,
      reason,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSubmitted(true);
    toast.success("Request submitted. A Super Admin will review it shortly.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-border/50 bg-gradient-card p-8 shadow-card backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary shadow-glow">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Apply for Admin Access</h1>
              <p className="text-sm text-muted-foreground">Approval required from Super Admin.</p>
            </div>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-lg bg-surface p-5 text-sm">
              <p className="text-foreground font-medium">Request received ✅</p>
              <p className="mt-1 text-muted-foreground">You'll get notified once your request is reviewed. You can use your account as a Student in the meantime.</p>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="text-sm text-muted-foreground">Full name</label>
                <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Work email</label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} className="mt-1" />
              </div>
              {!user && (
                <div>
                  <label className="text-sm text-muted-foreground">Password</label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                </div>
              )}
              <div>
                <label className="text-sm text-muted-foreground">Why do you need admin access?</label>
                <Textarea required rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" placeholder="Explain your role and responsibilities..." />
              </div>
              <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg bg-gradient-primary font-medium text-primary-foreground shadow-glow hover:opacity-95">
                {loading ? "Submitting..." : "Submit request"}
              </Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Just need a regular account?{" "}
            <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
