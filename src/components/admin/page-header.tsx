"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  action,
  backHref,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {backHref ? (
          <Link href={backHref} className="text-xs text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        ) : null}
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          <span className="text-gradient">{title}</span>
        </h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete this record?",
  description = "This action cannot be undone. The record will be permanently removed.",
  confirmLabel = "Delete",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
}) {
  const [busy, setBusy] = React.useState(false);
  return (
    <AlertDialogRoot
      open={open}
      onOpenChange={(o) => {
        if (!o) onOpenChange(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={busy} onClick={() => onOpenChange(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Deleting…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogRoot>
  );
}

// Local imports to avoid forcing this file to be a client of full ADialog
import {
  AlertDialog as AlertDialogRoot,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("glass rounded-xl p-5", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {icon ? <div className="text-primary">{icon}</div> : null}
      </div>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export { Button };
