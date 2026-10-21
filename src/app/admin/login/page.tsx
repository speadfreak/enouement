"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Sparkles, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  return (
    <React.Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-background">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res || res.error) {
        toast.error("Invalid credentials. Please try again.");
        return;
      }
      toast.success("Welcome back!");
      const next = search.get("callbackUrl") || "/admin";
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      {/* Left — branded panel */}
      <div className="relative hidden overflow-hidden bg-[#050a07] lg:block">
        {/* aurora blobs */}
        <div className="aurora bg-primary/40" style={{ width: 420, height: 420, top: -120, left: -80 }} />
        <div className="aurora bg-secondary/40" style={{ width: 380, height: 380, bottom: -120, right: -100 }} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a07] via-[#0b130e] to-[#050a07] opacity-95" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-lg bg-primary text-primary-foreground font-display text-xl font-bold glow-primary">
              E2
            </div>
            <div>
              <p className="font-display text-xl font-bold tracking-tight">ÉNOUEMENT</p>
              <p className="text-[10px] uppercase tracking-[0.4em] text-primary/80">2K27 Admin</p>
            </div>
          </div>

          <div className="space-y-6">
            <Sparkles className="size-8 text-primary glow-text" />
            <h2 className="font-display text-5xl font-bold leading-[0.95] tracking-tight xl:text-6xl">
              <span className="text-gradient">The Final Chapter</span>
              <br />
              <span className="text-foreground">starts here.</span>
            </h2>
            <p className="max-w-md text-base text-muted-foreground">
              A cinematic memory of the senior batch, Class of 2027. Sign in to manage every
              moment, story and face — preserved forever.
            </p>
            <div className="flex gap-2">
              <div className="h-1 w-12 rounded-full bg-primary glow-primary" />
              <div className="h-1 w-6 rounded-full bg-secondary" />
              <div className="h-1 w-3 rounded-full bg-accent" />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground/70">
            Restricted access · Authorized personnel only
          </p>
        </div>

        {/* grain overlay via globals */}
        <div className="grain pointer-events-none absolute inset-0 opacity-30" />
      </div>

      {/* Right — login form */}
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to site
          </Link>

          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold">
                E2
              </div>
              <div>
                <p className="font-display text-lg font-bold">ÉNOUEMENT 2K27</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Admin Console</p>
              </div>
            </div>
          </div>

          <h1 className="font-display text-3xl font-bold tracking-tight">
            Welcome <span className="text-gradient">back</span>.
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to your admin account to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wide">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@enouement2k27.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="glow-primary h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading ? <ArrowRight className="size-4" /> : null}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Forgot your password? Contact the super admin.
          </p>
        </div>
      </div>
    </div>
  );
}
