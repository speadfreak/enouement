"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to change password.");
        return;
      }
      toast.success("Password changed successfully!");
      await update();
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-[100dvh] place-items-center overflow-hidden bg-background px-4">
      {/* aurora blobs */}
      <div className="aurora bg-primary/30" style={{ width: 420, height: 420, top: -100, left: -80 }} />
      <div className="aurora bg-secondary/30" style={{ width: 380, height: 380, bottom: -100, right: -80 }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground glow-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Set a new <span className="text-gradient">password</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session?.user?.mustChangePassword
              ? "For security, please choose a new password before continuing."
              : "Update your password to keep your account secure."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="glass-strong space-y-5 rounded-2xl border border-border p-6">
          <div className="space-y-1.5">
            <Label htmlFor="current" className="text-xs uppercase tracking-wide">
              Current password
            </Label>
            <div className="relative">
              <Input
                id="current"
                type={show ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={show ? "Hide" : "Show"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new" className="text-xs uppercase tracking-wide">
              New password
            </Label>
            <Input
              id="new"
              type={show ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
            <p className="text-[11px] text-muted-foreground">Minimum 8 characters.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs uppercase tracking-wide">
              Confirm new password
            </Label>
            <Input
              id="confirm"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="glow-primary h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? "Updating…" : "Update password"}
            {!loading ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Sign out instead
          </button>
        </div>
      </div>
    </div>
  );
}
