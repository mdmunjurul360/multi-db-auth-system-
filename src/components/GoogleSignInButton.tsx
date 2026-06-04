import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { useState } from "react";

export function GoogleSignInButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const redirectTo = `${window.location.origin}/dashboard`;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectTo,
    });
    if (result.error) {
      setLoading(false);
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    window.location.assign(redirectTo);
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={loading}
      className="h-11 w-full rounded-lg border-border/60 bg-background/40 backdrop-blur-sm hover:bg-background/60"
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
      </svg>
      {loading ? "Redirecting..." : label}
    </Button>
  );
}
