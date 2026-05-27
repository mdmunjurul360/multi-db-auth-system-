import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — EduBari" },
      { name: "description", content: "Create your EduBari account." },
    ],
  }),
  component: SignupPage,
});

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
type FormValues = z.infer<typeof schema>;

function SignupPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  // 🔥 MongoDB Signup
  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          password: values.password,
        }),
      });

      if (!res.ok) {
        throw new Error("Signup failed");
      }

      toast.success("Account created!");
      navigate({ to: "/login" });

    } catch (err) {
      console.log(err);
      toast.error("Signup error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl bg-gradient-card p-8 shadow-card">
          <h1 className="font-display text-3xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join EduBari and start your reading journey.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>

            <div>
              <label className="text-sm text-muted-foreground">Full name</label>
              <Input {...register("fullName")} placeholder="Your name" className="mt-1" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" {...register("email")} placeholder="you@example.com" className="mt-1" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <Input type="password" {...register("password")} placeholder="••••••••" className="mt-1" />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={isSubmitting} className="h-11 w-full">
              {isSubmitting ? "Creating..." : "Sign Up"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* 🔥 Google only রাখলাম */}
          <GoogleSignInButton label="Sign up with Google" />

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}