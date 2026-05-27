import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — EduBari" },
      { name: "description", content: "Sign in to your EduBari account." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", remember: true },
  });

  const remember = watch("remember");

  // 🔥 MongoDB Login
  const onSubmit = async (values: FormValues) => {
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const data = await res.json();
      console.log(data);

      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });

    } catch (err) {
      console.log(err);
      toast.error("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border bg-gradient-card p-8 shadow-card">
          <h1 className="text-3xl font-bold">Welcome back</h1>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>

            <div>
              <label>Email</label>
              <Input type="email" {...register("email")} className="mt-1" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div>
              <label>Password</label>
              <div className="relative mt-1">
                <Input
                  type={show ? "text" : "password"}
                  {...register("password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={remember}
                  onCheckedChange={(v) => setValue("remember", Boolean(v))}
                />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot?</Link>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-xs">or</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          <GoogleSignInButton label="Sign in with Google" />

          <p className="mt-6 text-center text-sm">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}