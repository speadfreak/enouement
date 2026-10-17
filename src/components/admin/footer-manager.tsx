"use client";

/**
 * FooterManager — admin panel for "Footer & Developer" page.
 *
 * Two sections:
 *   1. Developer credit form — react-hook-form + zod validated inputs for
 *      `devName`, `devRole`, and `devLink` (https). PUT to /api/admin/footer.
 *   2. Developer links table — list of all DeveloperLink rows with inline
 *      enable toggle, reorder up/down, edit, and confirm-delete. An
 *      "Add link" button opens a ResourceForm dialog (title, tagline, url,
 *      logoUrl via MediaUploader, enabled).
 */

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  GraduationCap,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";

type DeveloperLink = {
  id: string;
  title: string;
  tagline: string | null;
  url: string;
  logoUrl: string | null;
  order: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type CreditInitial = {
  devName?: string;
  devRole?: string;
  devLink?: string | null;
};

type Props = {
  creditInitial: CreditInitial;
  linksInitial: DeveloperLink[];
};

/* ------------------------------------------------------------------ */
/*  Developer credit form                                             */
/* ------------------------------------------------------------------ */

const creditSchema = z.object({
  devName: z.string().min(1, "Developer name is required").max(120),
  devRole: z.string().max(120).default("Full-Stack Developer"),
  devLink: z
    .string()
    .optional()
    .refine(
      (v) => !v || (z.string().url().safeParse(v).success && v.startsWith("https://")),
      "Must be an https:// URL"
    )
    .nullable(),
});

type CreditValues = z.infer<typeof creditSchema>;

function CreditForm({ initial }: { initial: CreditInitial }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditValues>({
    resolver: zodResolver(creditSchema) as any,
    defaultValues: {
      devName: initial.devName ?? "Joseph James",
      devRole: initial.devRole ?? "Full-Stack Developer",
      devLink: initial.devLink ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await fetch("/api/admin/footer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save developer credit.");
      throw new Error("save failed");
    }
    const data = await res.json();
    reset({
      devName: data.devName ?? values.devName,
      devRole: data.devRole ?? values.devRole,
      devLink: data.devLink ?? "",
    });
    toast.success("Developer credit saved.");
  });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">Developer credit</CardTitle>
        <CardDescription>
          Shown at the bottom of the public site as the “Crafted by” block. If a
          URL is set, the developer name links out (https only).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="footer-credit-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="devName" className="text-xs uppercase tracking-wide">
              Developer name<span className="text-primary">*</span>
            </Label>
            <Controller
              control={control}
              name="devName"
              render={({ field }) => (
                <Input
                  id="devName"
                  placeholder="Joseph James"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.devName?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.devName.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="devRole" className="text-xs uppercase tracking-wide">
              Developer role
            </Label>
            <Controller
              control={control}
              name="devRole"
              render={({ field }) => (
                <Input
                  id="devRole"
                  placeholder="Full-Stack Developer"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.devRole?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.devRole.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="devLink" className="text-xs uppercase tracking-wide">
              Developer link (optional — https only)
            </Label>
            <Controller
              control={control}
              name="devLink"
              render={({ field }) => (
                <Input
                  id="devLink"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.devLink?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.devLink.message)}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              The developer name becomes a clickable link in the footer when set.
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          type="submit"
          form="footer-credit-form"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save credit
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Developer links table + CRUD                                      */
/* ------------------------------------------------------------------ */

const linkSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  tagline: z.string().max(300).optional().nullable(),
  url: z
    .string()
    .min(1, "URL is required")
    .url("Must be a valid URL")
    .refine((u) => u.startsWith("https://"), "Only https:// URLs are allowed"),
  logoUrl: z.string().optional().nullable(),
  enabled: z.boolean().default(true),
});

const LINK_FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Learnyx Academy", full: true },
  { name: "tagline", label: "Tagline", type: "textarea", full: true, rows: 2, placeholder: "Learn. Build. Ship." },
  { name: "url", label: "URL (https only)", type: "text", required: true, full: true, placeholder: "https://example.com" },
  { name: "logoUrl", label: "Logo (optional)", type: "image", folder: "footer", full: true, accept: "image", placeholder: "https://…" },
  { name: "enabled", label: "Enabled", type: "boolean" },
];

const EMPTY_LINK = {
  title: "",
  tagline: "",
  url: "",
  logoUrl: "",
  enabled: true,
};

function DeveloperLinksSection({ initial }: { initial: DeveloperLink[] }) {
  const qc = useQueryClient();
  const queryKey = ["admin", "developer-links"];

  const { data, isLoading } = useQuery<DeveloperLink[]>({
    queryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/developer-links");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<DeveloperLink | null>(null);
  const [deleting, setDeleting] = React.useState<DeveloperLink | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/developer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to create");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Developer link created.");
      qc.invalidateQueries({ queryKey });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/developer-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to update");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Developer link updated.");
      qc.invalidateQueries({ queryKey });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/developer-links/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Developer link deleted.");
      qc.invalidateQueries({ queryKey });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleEnabled = (row: DeveloperLink) => {
    updateM.mutate({ id: row.id, values: { enabled: !row.enabled } });
  };

  const move = (row: DeveloperLink, dir: -1 | 1) => {
    const rows = data ?? [];
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= rows.length) return;
    const other = rows[swapIdx];
    // Swap order values: PUT both rows in parallel.
    updateM.mutate({ id: row.id, values: { order: other.order } });
    updateM.mutate({ id: other.id, values: { order: row.order } });
  };

  const rows = data ?? [];

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="font-display">Developer links</CardTitle>
          <CardDescription>
            “More from the developer” cards shown in the footer. Multiple cards are
            rendered in a row on the public site.
          </CardDescription>
        </div>
        <Button
          onClick={() => setOpenCreate(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add link
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Logo</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Title</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">URL</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Enabled</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Order</TableHead>
                <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-border/60">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No developer links yet. Click “Add link” to create one.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={row.id} className="border-border/60">
                    <TableCell className="px-4 py-3">
                      <div className="grid size-10 place-items-center overflow-hidden rounded-md border border-border/60 bg-muted">
                        {row.logoUrl ? (
                          <img src={row.logoUrl} alt={row.title} className="size-full object-cover" />
                        ) : (
                          <GraduationCap className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="line-clamp-1 max-w-xs font-medium">{row.title}</span>
                        {row.tagline ? (
                          <span className="line-clamp-1 max-w-xs text-[11px] text-muted-foreground">
                            {row.tagline}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[200px] items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                      >
                        <span className="truncate">{row.url}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={row.enabled}
                          onCheckedChange={() => toggleEnabled(row)}
                          aria-label={`Toggle ${row.title}`}
                        />
                        <Badge variant={row.enabled ? "default" : "outline"} className="text-[10px]">
                          {row.enabled ? "Live" : "Hidden"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => move(row, -1)}
                          disabled={idx === 0 || updateM.isPending}
                          aria-label="Move up"
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => move(row, 1)}
                          disabled={idx === rows.length - 1 || updateM.isPending}
                          aria-label="Move down"
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                        <span className="ml-1 font-mono text-xs text-muted-foreground">{row.order}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => setEditing(row)}
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(row)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New developer link"
        description="Adds a new “More from the developer” card to the public site footer."
        fields={LINK_FIELDS}
        schema={linkSchema}
        defaultValues={EMPTY_LINK}
        onSubmit={(v) => createM.mutateAsync(v)}
        submitLabel="Create link"
      />

      {editing ? (
        <ResourceForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          title="Edit developer link"
          fields={LINK_FIELDS}
          schema={linkSchema}
          defaultValues={editing}
          onSubmit={(v) => updateM.mutateAsync({ id: editing.id, values: v })}
          submitLabel="Save changes"
        />
      ) : null}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The developer link will be permanently
              removed from the public footer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleting && deleteM.mutateAsync(deleting.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

export function FooterManager({ creditInitial, linksInitial }: Props) {
  return (
    <>
      <PageHeader
        title="Footer & Developer"
        description="Manage the cinematic footer's developer credit + “More from the developer” link cards."
      />
      <div className="space-y-6">
        <CreditForm initial={creditInitial} />
        <DeveloperLinksSection initial={linksInitial} />
      </div>
    </>
  );
}

export default FooterManager;
