"use client";

/**
 * FooterManager — admin panel for the "Footer & Developer" page (Round 5).
 *
 * Eight tabs:
 *   1. Brand & Blurb     — site identity + footer blurb + countdown.
 *   2. Link Groups       — CRUD footer link groups and nested links.
 *   3. Social Links      — instagram / telegram / tiktok / youtube URLs.
 *   4. Developer Credit  — devName / devRole / devLink.
 *   5. Developer Links   — "More from the developer" cards.
 *   6. Feature Toggles   — 7 site-wide feature switches.
 *   7. Memory Wall       — moderation queue with bulk approve.
 *   8. Ribbon            — announcement ribbon (text/link/color/expiry).
 *
 * All mutations go through the admin API routes which check `requireAdmin`,
 * validate with zod, write an audit log entry, and call revalidateTag.
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
  PanelTop,
  Type,
  Link as LinkIcon,
  Share2,
  Code,
  ToggleRight,
  MessageSquare,
  Megaphone,
  Eye,
  CheckCircle2,
  XCircle,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

type FooterLink = {
  id: string;
  groupId: string;
  label: string;
  href: string;
  isNew: boolean;
  order: number;
  createdAt: string;
};

type FooterLinkGroup = {
  id: string;
  title: string;
  order: number;
  visible: boolean;
  links: FooterLink[];
};

type MemoryWallMessage = {
  id: string;
  name: string;
  message: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  ip: string | null;
  createdAt: string;
  updatedAt: string;
};

type CreditInitial = {
  devName?: string;
  devRole?: string;
  devLink?: string | null;
};

type SettingsInitial = {
  siteName?: string;
  tagline?: string;
  description?: string;
  footerText?: string;
  footerBlurb?: string;
  primaryColor?: string;
  secondaryColor?: string;
  countdownLabel?: string;
  countdownDate?: string;
  socialInstagram?: string;
  socialTelegram?: string;
  socialTiktok?: string;
  socialYoutube?: string;
  memoryWallEnabled?: boolean;
  shareEnabled?: boolean;
  installEnabled?: boolean;
  soundEnabled?: boolean;
  easterEggEnabled?: boolean;
  liveCounterEnabled?: boolean;
  ribbonEnabled?: boolean;
  ribbonText?: string | null;
  ribbonLink?: string | null;
  ribbonColor?: string;
  ribbonExpiry?: string;
} | null;

type Props = {
  creditInitial: CreditInitial;
  linksInitial: DeveloperLink[];
  linkGroupsInitial: FooterLinkGroup[];
  settingsInitial: SettingsInitial;
  memoryMessagesInitial: MemoryWallMessage[];
};

const TABS = [
  { value: "brand", label: "Brand & Blurb", icon: Type },
  { value: "groups", label: "Link Groups", icon: LinkIcon },
  { value: "social", label: "Social Links", icon: Share2 },
  { value: "credit", label: "Developer Credit", icon: Code },
  { value: "devlinks", label: "Developer Links", icon: ExternalLink },
  { value: "toggles", label: "Feature Toggles", icon: ToggleRight },
  { value: "memory", label: "Memory Wall", icon: MessageSquare },
  { value: "ribbon", label: "Ribbon", icon: Megaphone },
] as const;

/* ================================================================== */
/*  Tab 1 — Brand & Blurb                                             */
/* ================================================================== */

const brandSchema = z.object({
  siteName: z.string().min(1, "Site name is required").max(120),
  tagline: z.string().max(200).default(""),
  footerBlurb: z.string().max(1000).default(""),
  footerText: z.string().max(500).default(""),
  countdownLabel: z.string().max(120).default(""),
  countdownDate: z.string().optional().nullable(),
});
type BrandValues = z.infer<typeof brandSchema>;

function BrandBlurbTab({ initial }: { initial: SettingsInitial }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandValues>({
    resolver: zodResolver(brandSchema) as any,
    defaultValues: {
      siteName: initial?.siteName ?? "Énouement 2K27",
      tagline: initial?.tagline ?? "",
      footerBlurb: initial?.footerBlurb ?? "",
      footerText: initial?.footerText ?? "",
      countdownLabel: initial?.countdownLabel ?? "Graduation Day",
      countdownDate: initial?.countdownDate ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        siteName: values.siteName,
        tagline: values.tagline,
        footerBlurb: values.footerBlurb,
        footerText: values.footerText,
        countdownLabel: values.countdownLabel,
        countdownDate: values.countdownDate || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save brand & blurb.");
      throw new Error("save failed");
    }
    const data = await res.json();
    reset({
      siteName: data.siteName ?? values.siteName,
      tagline: data.tagline ?? values.tagline,
      footerBlurb: data.footerBlurb ?? values.footerBlurb,
      footerText: data.footerText ?? values.footerText,
      countdownLabel: data.countdownLabel ?? values.countdownLabel,
      countdownDate: data.countdownDate
        ? new Date(data.countdownDate).toISOString().slice(0, 16)
        : "",
    });
    toast.success("Brand & blurb saved.");
  });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">Brand &amp; blurb</CardTitle>
        <CardDescription>
          The site name, tagline, footer blurb and countdown shown at the bottom
          of the public site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="footer-brand-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="siteName" className="text-xs uppercase tracking-wide">
              Site name<span className="text-primary">*</span>
            </Label>
            <Controller
              control={control}
              name="siteName"
              render={({ field }) => (
                <Input
                  id="siteName"
                  placeholder="Énouement 2K27"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.siteName?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.siteName.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-xs uppercase tracking-wide">
              Tagline
            </Label>
            <Controller
              control={control}
              name="tagline"
              render={({ field }) => (
                <Input
                  id="tagline"
                  placeholder="The Final Chapter — Class of 2027"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.tagline?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.tagline.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="footerBlurb" className="text-xs uppercase tracking-wide">
              Footer blurb
            </Label>
            <Controller
              control={control}
              name="footerBlurb"
              render={({ field }) => (
                <Textarea
                  id="footerBlurb"
                  rows={3}
                  placeholder="A cinematic memory of the senior batch — every moment, every face, every story, preserved forever."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.footerBlurb?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.footerBlurb.message)}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              A short paragraph shown next to the brand mark in the footer.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="footerText" className="text-xs uppercase tracking-wide">
              Footer text (bottom bar)
            </Label>
            <Controller
              control={control}
              name="footerText"
              render={({ field }) => (
                <Input
                  id="footerText"
                  placeholder="Énouement 2K27 — Class of 2027. Made with love."
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.footerText?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.footerText.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="countdownLabel" className="text-xs uppercase tracking-wide">
              Countdown label
            </Label>
            <Controller
              control={control}
              name="countdownLabel"
              render={({ field }) => (
                <Input
                  id="countdownLabel"
                  placeholder="Graduation Day"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.countdownLabel?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.countdownLabel.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="countdownDate" className="text-xs uppercase tracking-wide">
              Countdown date
            </Label>
            <Controller
              control={control}
              name="countdownDate"
              render={({ field }) => (
                <Input
                  id="countdownDate"
                  type="datetime-local"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.countdownDate?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.countdownDate.message)}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          type="submit"
          form="footer-brand-form"
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
              Save brand &amp; blurb
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ================================================================== */
/*  Tab 2 — Link Groups                                                */
/* ================================================================== */

const groupSchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  order: z.coerce.number().int().min(0).max(100000).default(0),
  visible: z.boolean().default(true),
});

const GROUP_FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Explore", full: true },
  { name: "order", label: "Order (0 = first)", type: "number", placeholder: "0" },
  { name: "visible", label: "Visible", type: "boolean" },
];

const EMPTY_GROUP = { title: "", order: 0, visible: true };

const footerLinkSchema = z.object({
  label: z.string().min(1, "Label is required").max(120),
  href: z.string().min(1, "URL is required").max(500),
  isNew: z.boolean().default(false),
  order: z.coerce.number().int().min(0).max(100000).default(0),
});

const FOOTER_LINK_FIELDS: FieldConfig[] = [
  { name: "label", label: "Label", type: "text", required: true, placeholder: "Home", full: true },
  { name: "href", label: "URL", type: "text", required: true, full: true, placeholder: "/" },
  { name: "order", label: "Order (0 = first)", type: "number", placeholder: "0" },
  { name: "isNew", label: "Show “NEW” badge", type: "boolean" },
];

const EMPTY_LINK = { label: "", href: "", isNew: false, order: 0 };

function LinkGroupsTab({ initial }: { initial: FooterLinkGroup[] }) {
  const qc = useQueryClient();
  const queryKey = ["admin", "footer-link-groups"];

  const { data, isLoading } = useQuery<FooterLinkGroup[]>({
    queryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/footer-link-groups");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreateGroup, setOpenCreateGroup] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<FooterLinkGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = React.useState<FooterLinkGroup | null>(null);
  // Per-group link dialog state
  const [linkDialog, setLinkDialog] = React.useState<{
    groupId: string;
    editing: FooterLink | null;
  } | null>(null);

  const createGroupM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/footer-link-groups", {
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
      toast.success("Group created.");
      qc.invalidateQueries({ queryKey });
      setOpenCreateGroup(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateGroupM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/footer-link-groups/${id}`, {
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
      toast.success("Group updated.");
      qc.invalidateQueries({ queryKey });
      setEditingGroup(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteGroupM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/footer-link-groups/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Group deleted (with all its links).");
      qc.invalidateQueries({ queryKey });
      setDeletingGroup(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // --- Link mutations ---
  const createLinkM = useMutation({
    mutationFn: async ({ groupId, values }: { groupId: string; values: any }) => {
      const r = await fetch("/api/admin/footer-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, groupId }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to create link");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Link created.");
      qc.invalidateQueries({ queryKey });
      setLinkDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateLinkM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/footer-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to update link");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Link updated.");
      qc.invalidateQueries({ queryKey });
      setLinkDialog(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteLinkM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/footer-links/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete link");
      }
    },
    onSuccess: () => {
      toast.success("Link deleted.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deletingLink, setDeletingLink] = React.useState<FooterLink | null>(null);

  const toggleGroupVisible = (g: FooterLinkGroup) =>
    updateGroupM.mutate({ id: g.id, values: { visible: !g.visible } });

  const moveGroup = (g: FooterLinkGroup, dir: -1 | 1) => {
    const groups = data ?? [];
    const idx = groups.findIndex((x) => x.id === g.id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= groups.length) return;
    const other = groups[swapIdx];
    updateGroupM.mutate({ id: g.id, values: { order: other.order } });
    updateGroupM.mutate({ id: other.id, values: { order: g.order } });
  };

  const moveLink = (group: FooterLinkGroup, link: FooterLink, dir: -1 | 1) => {
    const links = group.links;
    const idx = links.findIndex((x) => x.id === link.id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    const other = links[swapIdx];
    updateLinkM.mutate({ id: link.id, values: { order: other.order } });
    updateLinkM.mutate({ id: other.id, values: { order: link.order } });
  };

  const groups = data ?? [];

  return (
    <Card className="glass">
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="font-display">Footer link groups</CardTitle>
          <CardDescription>
            Each group renders as a column in the public footer. Add nested
            links per group, reorder, and toggle visibility.
          </CardDescription>
        </div>
        <Button
          onClick={() => setOpenCreateGroup(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add group
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Inbox className="size-6" />
            <span>No link groups yet. Click “Add group” to create one.</span>
          </div>
        ) : (
          groups.map((group, idx) => (
            <div
              key={group.id}
              className={cn(
                "rounded-lg border border-border/60 bg-card/40 transition-shadow",
                !group.visible && "opacity-60"
              )}
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-4 py-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <LinkIcon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold">{group.title}</span>
                    <Badge variant={group.visible ? "default" : "outline"} className="text-[10px]">
                      {group.visible ? "Visible" : "Hidden"}
                    </Badge>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      order: {group.order} · {group.links.length} link{group.links.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={group.visible}
                    onCheckedChange={() => toggleGroupVisible(group)}
                    aria-label={`Toggle ${group.title} visibility`}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => moveGroup(group, -1)}
                    disabled={idx === 0 || updateGroupM.isPending}
                    aria-label="Move group up"
                  >
                    <ArrowUp className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => moveGroup(group, 1)}
                    disabled={idx === groups.length - 1 || updateGroupM.isPending}
                    aria-label="Move group down"
                  >
                    <ArrowDown className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditingGroup(group)}
                    aria-label="Edit group"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingGroup(group)}
                    aria-label="Delete group"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLinkDialog({ groupId: group.id, editing: null })}
                  >
                    <Plus className="size-3.5" />
                    Add link
                  </Button>
                </div>
              </div>

              <div className="px-2 py-2">
                {group.links.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-muted-foreground">
                    No links in this group yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/60 hover:bg-transparent">
                          <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide">Label</TableHead>
                          <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide">URL</TableHead>
                          <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide">New?</TableHead>
                          <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide">Order</TableHead>
                          <TableHead className="h-9 px-3 text-right text-[11px] uppercase tracking-wide">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.links.map((link, lidx) => (
                          <TableRow key={link.id} className="border-border/40">
                            <TableCell className="px-3 py-2.5">
                              <span className="font-medium">{link.label}</span>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-[240px] items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary"
                              >
                                <span className="truncate">{link.href}</span>
                                <ExternalLink className="size-3 shrink-0" />
                              </a>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <Switch
                                checked={link.isNew}
                                onCheckedChange={() =>
                                  updateLinkM.mutate({ id: link.id, values: { isNew: !link.isNew } })
                                }
                                aria-label={`Toggle NEW on ${link.label}`}
                              />
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7"
                                  onClick={() => moveLink(group, link, -1)}
                                  disabled={lidx === 0 || updateLinkM.isPending}
                                  aria-label="Move link up"
                                >
                                  <ArrowUp className="size-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-7"
                                  onClick={() => moveLink(group, link, 1)}
                                  disabled={lidx === group.links.length - 1 || updateLinkM.isPending}
                                  aria-label="Move link down"
                                >
                                  <ArrowDown className="size-3" />
                                </Button>
                                <span className="ml-1 font-mono text-xs text-muted-foreground">{link.order}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
                                  onClick={() => setLinkDialog({ groupId: group.id, editing: link })}
                                  aria-label="Edit link"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingLink(link)}
                                  aria-label="Delete link"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      {/* Create group dialog */}
      <ResourceForm
        open={openCreateGroup}
        onOpenChange={setOpenCreateGroup}
        title="New link group"
        description="Creates a new column in the public footer. Add nested links afterwards."
        fields={GROUP_FIELDS}
        schema={groupSchema}
        defaultValues={EMPTY_GROUP}
        onSubmit={(v) => createGroupM.mutateAsync(v)}
        submitLabel="Create group"
      />

      {/* Edit group dialog */}
      {editingGroup ? (
        <ResourceForm
          open={!!editingGroup}
          onOpenChange={(o) => !o && setEditingGroup(null)}
          title="Edit link group"
          fields={GROUP_FIELDS}
          schema={groupSchema}
          defaultValues={editingGroup}
          onSubmit={(v) => updateGroupM.mutateAsync({ id: editingGroup.id, values: v })}
          submitLabel="Save changes"
        />
      ) : null}

      {/* Create / edit link dialog */}
      {linkDialog ? (
        <ResourceForm
          open={!!linkDialog}
          onOpenChange={(o) => !o && setLinkDialog(null)}
          title={linkDialog.editing ? "Edit link" : "New link"}
          description="Footer links render inside their parent group."
          fields={FOOTER_LINK_FIELDS}
          schema={footerLinkSchema}
          defaultValues={
            linkDialog.editing
              ? {
                  label: linkDialog.editing.label,
                  href: linkDialog.editing.href,
                  isNew: linkDialog.editing.isNew,
                  order: linkDialog.editing.order,
                }
              : EMPTY_LINK
          }
          onSubmit={(v) =>
            linkDialog.editing
              ? updateLinkM.mutateAsync({ id: linkDialog.editing.id, values: v })
              : createLinkM.mutateAsync({ groupId: linkDialog.groupId, values: v })
          }
          submitLabel={linkDialog.editing ? "Save changes" : "Create link"}
        />
      ) : null}

      {/* Delete group confirm */}
      <AlertDialog
        open={!!deletingGroup}
        onOpenChange={(o) => !o && setDeletingGroup(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group “{deletingGroup?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group and all {deletingGroup?.links.length ?? 0}{" "}
              link{(deletingGroup?.links.length ?? 0) === 1 ? "" : "s"} inside it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletingGroup && deleteGroupM.mutateAsync(deletingGroup.id)}
            >
              Delete group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete link confirm */}
      <AlertDialog
        open={!!deletingLink}
        onOpenChange={(o) => !o && setDeletingLink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete link “{deletingLink?.label}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the link from the footer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deletingLink && deleteLinkM.mutateAsync(deletingLink.id)}
            >
              Delete link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/* ================================================================== */
/*  Tab 3 — Social Links                                               */
/* ================================================================== */

const httpsOptional = z
  .string()
  .optional()
  .refine((v) => !v || (z.string().url().safeParse(v).success && v.startsWith("https://")), {
    message: "Must be an https:// URL",
  });

const socialSchema = z.object({
  instagram: httpsOptional,
  telegram: httpsOptional,
  tiktok: httpsOptional,
  youtube: httpsOptional,
});
type SocialValues = z.infer<typeof socialSchema>;

function SocialLinksTab({ initial }: { initial: SettingsInitial }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SocialValues>({
    resolver: zodResolver(socialSchema) as any,
    defaultValues: {
      instagram: initial?.socialInstagram ?? "",
      telegram: initial?.socialTelegram ?? "",
      tiktok: initial?.socialTiktok ?? "",
      youtube: initial?.socialYoutube ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Only include non-empty URLs in the JSON object.
    const socialLinks: Record<string, string> = {};
    (Object.keys(values) as (keyof SocialValues)[]).forEach((k) => {
      const v = (values as any)[k];
      if (v && v.trim()) socialLinks[k] = v.trim();
    });

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socialLinks: JSON.stringify(socialLinks) }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save social links.");
      throw new Error("save failed");
    }
    reset({
      instagram: socialLinks.instagram ?? "",
      telegram: socialLinks.telegram ?? "",
      tiktok: socialLinks.tiktok ?? "",
      youtube: socialLinks.youtube ?? "",
    });
    toast.success("Social links saved.");
  });

  const fields: { name: keyof SocialValues; label: string; placeholder: string }[] = [
    { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
    { name: "telegram", label: "Telegram", placeholder: "https://t.me/…" },
    { name: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@…" },
    { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  ];

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">Social links</CardTitle>
        <CardDescription>
          The icons rendered next to the brand mark in the footer. Leave a field
          empty to hide that icon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="footer-social-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name} className="text-xs uppercase tracking-wide">
                {f.label}
              </Label>
              <Controller
                control={control}
                name={f.name}
                render={({ field }) => (
                  <Input
                    id={f.name}
                    type="url"
                    placeholder={f.placeholder}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors[f.name]?.message ? (
                <p className="text-[11px] text-destructive">{String(errors[f.name]?.message)}</p>
              ) : null}
            </div>
          ))}
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          type="submit"
          form="footer-social-form"
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
              Save social links
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ================================================================== */
/*  Tab 4 — Developer Credit                                           */
/* ================================================================== */

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

/* ================================================================== */
/*  Tab 5 — Developer Links (CRUD table)                                */
/* ================================================================== */

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

const EMPTY_LINK_DEFAULTS = {
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
        defaultValues={EMPTY_LINK_DEFAULTS}
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

/* ================================================================== */
/*  Tab 6 — Feature Toggles                                            */
/* ================================================================== */

type ToggleDef = {
  key:
    | "memoryWallEnabled"
    | "shareEnabled"
    | "installEnabled"
    | "soundEnabled"
    | "easterEggEnabled"
    | "liveCounterEnabled"
    | "ribbonEnabled";
  label: string;
  description: string;
};

const FEATURE_TOGGLES: ToggleDef[] = [
  {
    key: "memoryWallEnabled",
    label: "Memory Wall",
    description: "Public visitors can submit short messages that you moderate here.",
  },
  {
    key: "shareEnabled",
    label: "Share buttons",
    description: "Social share buttons on moments, announcements, and event pages.",
  },
  {
    key: "installEnabled",
    label: "Install as PWA",
    description: "Show the “Add to home screen” install prompt for the PWA.",
  },
  {
    key: "soundEnabled",
    label: "Sound effects",
    description: "Ambient UI sound effects (hover, click, transitions).",
  },
  {
    key: "easterEggEnabled",
    label: "Easter eggs",
    description: "Hidden interactions (e.g. Konami code, mascot clicks).",
  },
  {
    key: "liveCounterEnabled",
    label: "Live visitor counter",
    description: "Real-time visit counter shown in the footer.",
  },
  {
    key: "ribbonEnabled",
    label: "Announcement ribbon",
    description: "Top ribbon banner (configure text/link/color in the Ribbon tab).",
  },
];

function FeatureTogglesTab({ initial }: { initial: SettingsInitial }) {
  const [state, setState] = React.useState<Record<ToggleDef["key"], boolean>>({
    memoryWallEnabled: initial?.memoryWallEnabled ?? true,
    shareEnabled: initial?.shareEnabled ?? true,
    installEnabled: initial?.installEnabled ?? true,
    soundEnabled: initial?.soundEnabled ?? true,
    easterEggEnabled: initial?.easterEggEnabled ?? true,
    liveCounterEnabled: initial?.liveCounterEnabled ?? true,
    ribbonEnabled: initial?.ribbonEnabled ?? false,
  });
  const [saving, setSaving] = React.useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to save toggles.");
        return;
      }
      toast.success("Feature toggles saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">Feature toggles</CardTitle>
        <CardDescription>
          Master switches for the round-5 footer features. Disabled features
          hide their UI but preserve stored data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {FEATURE_TOGGLES.map((t, i) => (
          <React.Fragment key={t.key}>
            {i > 0 ? <Separator /> : null}
            <div className="flex items-start justify-between gap-4 py-2">
              <div className="space-y-0.5">
                <Label htmlFor={t.key} className="cursor-pointer text-sm font-medium">
                  {t.label}
                </Label>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={state[t.key] ? "default" : "outline"}
                  className={cn("text-[10px]", !state[t.key] && "text-muted-foreground")}
                >
                  {state[t.key] ? "ON" : "OFF"}
                </Badge>
                <Switch
                  id={t.key}
                  checked={state[t.key]}
                  onCheckedChange={(c) => setState((s) => ({ ...s, [t.key]: c }))}
                  aria-label={t.label}
                />
              </div>
            </div>
          </React.Fragment>
        ))}
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          onClick={onSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save toggles
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ================================================================== */
/*  Tab 7 — Memory Wall moderation                                     */
/* ================================================================== */

type MemoryFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

const STATUS_RANK: Record<MemoryWallMessage["status"], number> = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
};

function StatusBadge({ status }: { status: MemoryWallMessage["status"] }) {
  if (status === "PENDING") {
    return (
      <Badge className="border-transparent bg-yellow-400/90 text-black hover:bg-yellow-400/90 text-[10px]">
        PENDING
      </Badge>
    );
  }
  if (status === "APPROVED") {
    return (
      <Badge className="border-transparent bg-emerald-500 text-white hover:bg-emerald-500 text-[10px]">
        APPROVED
      </Badge>
    );
  }
  return (
    <Badge className="border-transparent bg-red-500 text-white hover:bg-red-500 text-[10px]">
      REJECTED
    </Badge>
  );
}

function MemoryWallTab({ initial }: { initial: MemoryWallMessage[] }) {
  const qc = useQueryClient();
  const queryKey = ["admin", "memory-wall"];
  const [filter, setFilter] = React.useState<MemoryFilter>("ALL");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const { data, isLoading, isFetching } = useQuery<MemoryWallMessage[]>({
    queryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/memory-wall");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const rows = React.useMemo(() => {
    const all = (data ?? []).slice().sort((a, b) => {
      const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      if (r !== 0) return r;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (filter === "ALL") return all;
    return all.filter((m) => m.status === filter);
  }, [data, filter]);

  const pendingCount = (data ?? []).filter((m) => m.status === "PENDING").length;
  const allPendingSelected =
    pendingCount > 0 && rows.filter((r) => r.status === "PENDING").every((r) => selected.has(r.id));

  // Clear selection whenever the filter or dataset changes.
  React.useEffect(() => {
    setSelected(new Set());
  }, [filter, data]);

  const updateStatusM = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MemoryWallMessage["status"] }) => {
      const r = await fetch(`/api/admin/memory-wall/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to update");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/memory-wall/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Message deleted.");
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkM = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: "approve" | "reject" | "delete" }) => {
      const r = await fetch("/api/admin/memory-wall/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Bulk action failed");
      }
      return r.json();
    },
    onSuccess: (data) => {
      toast.success(
        `${data.action === "delete" ? "Deleted" : data.action === "approve" ? "Approved" : "Rejected"} ${data.count} message${data.count === 1 ? "" : "s"}.`
      );
      setSelected(new Set());
      qc.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [deleting, setDeleting] = React.useState<MemoryWallMessage | null>(null);

  const toggleOne = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllPending = () => {
    const pendingIds = rows.filter((r) => r.status === "PENDING").map((r) => r.id);
    if (allPendingSelected) {
      setSelected((s) => {
        const next = new Set(s);
        pendingIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        pendingIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const selectedIds = Array.from(selected);
  const selectedPendingIds = selectedIds.filter((id) =>
    rows.some((r) => r.id === id && r.status === "PENDING")
  );

  return (
    <Card className="glass">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="font-display">Memory wall moderation</CardTitle>
            <CardDescription>
              Approve, reject, or delete submitted messages. Approved messages
              appear in the public memory wall.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as MemoryFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending only</SelectItem>
                <SelectItem value="APPROVED">Approved only</SelectItem>
                <SelectItem value="REJECTED">Rejected only</SelectItem>
              </SelectContent>
            </Select>
            {isFetching ? (
              <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {pendingCount} pending
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {(data ?? []).filter((m) => m.status === "APPROVED").length} approved
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {(data ?? []).filter((m) => m.status === "REJECTED").length} rejected
          </Badge>
          {pendingCount > 0 ? (
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAllPending}
              className="ml-auto"
            >
              <Checkbox checked={allPendingSelected} className="mr-2" />
              {allPendingSelected ? "Deselect" : "Select"} all pending
            </Button>
          ) : null}
        </div>
        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-2">
            <span className="text-xs font-medium">
              {selectedIds.length} selected
              {selectedPendingIds.length > 0 ? ` (${selectedPendingIds.length} pending)` : ""}
            </span>
            <div className="ml-auto flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={bulkM.isPending}
                onClick={() => bulkM.mutate({ ids: selectedIds, action: "approve" })}
              >
                <CheckCircle2 className="size-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkM.isPending}
                onClick={() => bulkM.mutate({ ids: selectedIds, action: "reject" })}
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={bulkM.isPending}
                onClick={() => bulkM.mutate({ ids: selectedIds, action: "delete" })}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="h-11 w-10 px-3 text-xs uppercase tracking-wide">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Name</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Message</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Status</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">Date</TableHead>
                <TableHead className="h-11 px-4 text-xs uppercase tracking-wide">IP</TableHead>
                <TableHead className="h-11 px-4 text-right text-xs uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="border-border/60">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-muted" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow className="border-border/60 hover:bg-transparent">
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="size-6" />
                      <span>
                        {filter === "ALL"
                          ? "No messages submitted yet."
                          : `No ${filter.toLowerCase()} messages.`}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((m) => (
                  <TableRow key={m.id} className="border-border/60">
                    <TableCell className="px-3 py-3">
                      <Checkbox
                        checked={selected.has(m.id)}
                        onCheckedChange={() => toggleOne(m.id)}
                        aria-label={`Select message from ${m.name}`}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-medium">{m.name || "Anonymous"}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="line-clamp-2 max-w-md text-xs text-muted-foreground">
                        {m.message}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {m.ip ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {m.status !== "APPROVED" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-emerald-500 hover:text-emerald-600"
                            onClick={() => updateStatusM.mutate({ id: m.id, status: "APPROVED" })}
                            aria-label="Approve"
                            title="Approve"
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        ) : null}
                        {m.status !== "REJECTED" ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-yellow-500 hover:text-yellow-600"
                            onClick={() => updateStatusM.mutate({ id: m.id, status: "REJECTED" })}
                            aria-label="Reject"
                            title="Reject"
                          >
                            <XCircle className="size-4" />
                          </Button>
                        ) : null}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleting(m)}
                          aria-label="Delete"
                          title="Delete"
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

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              From <span className="font-medium text-foreground">{deleting?.name || "Anonymous"}</span>
              : “{deleting?.message?.slice(0, 120) ?? ""}”
              <br />
              This cannot be undone.
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

/* ================================================================== */
/*  Tab 8 — Ribbon                                                     */
/* ================================================================== */

const ribbonSchema = z.object({
  ribbonEnabled: z.boolean().default(false),
  ribbonText: z.string().max(280).optional().nullable(),
  ribbonLink: z
    .string()
    .optional()
    .refine((v) => !v || (z.string().url().safeParse(v).success && v.startsWith("https://")), {
      message: "Must be an https:// URL",
    })
    .nullable(),
  ribbonColor: z.string().max(20).default("#FFE600"),
  ribbonExpiry: z.string().optional().nullable(),
});
type RibbonValues = z.infer<typeof ribbonSchema>;

function RibbonTab({ initial }: { initial: SettingsInitial }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RibbonValues>({
    resolver: zodResolver(ribbonSchema) as any,
    defaultValues: {
      ribbonEnabled: initial?.ribbonEnabled ?? false,
      ribbonText: initial?.ribbonText ?? "",
      ribbonLink: initial?.ribbonLink ?? "",
      ribbonColor: initial?.ribbonColor ?? "#FFE600",
      ribbonExpiry: initial?.ribbonExpiry ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: Record<string, unknown> = {
      ribbonEnabled: values.ribbonEnabled,
      ribbonColor: values.ribbonColor,
      ribbonExpiry: values.ribbonExpiry || null,
    };
    if (values.ribbonText !== undefined) {
      payload.ribbonText = values.ribbonText;
    }
    if (values.ribbonLink !== undefined) {
      payload.ribbonLink = values.ribbonLink;
    }

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast.error(err?.error || "Failed to save ribbon.");
      throw new Error("save failed");
    }
    const data = await res.json();
    reset({
      ribbonEnabled: data.ribbonEnabled ?? values.ribbonEnabled,
      ribbonText: data.ribbonText ?? "",
      ribbonLink: data.ribbonLink ?? "",
      ribbonColor: data.ribbonColor ?? values.ribbonColor,
      ribbonExpiry: data.ribbonExpiry
        ? new Date(data.ribbonExpiry).toISOString().slice(0, 16)
        : "",
    });
    toast.success("Ribbon saved.");
  });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="font-display">Announcement ribbon</CardTitle>
        <CardDescription>
          A thin banner pinned to the top of the public site. Set an expiry date
          to auto-hide the ribbon after it expires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="footer-ribbon-form" onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-card/40 p-3">
              <div>
                <Label htmlFor="ribbonEnabled" className="text-sm font-medium">
                  Ribbon enabled
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Toggle the ribbon on/off without losing its content.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={initial?.ribbonEnabled ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {initial?.ribbonEnabled ? "ON" : "OFF"}
                </Badge>
                <Controller
                  control={control}
                  name="ribbonEnabled"
                  render={({ field }) => (
                    <Switch
                      id="ribbonEnabled"
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                      aria-label="Toggle ribbon enabled"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ribbonText" className="text-xs uppercase tracking-wide">
              Ribbon text
            </Label>
            <Controller
              control={control}
              name="ribbonText"
              render={({ field }) => (
                <Input
                  id="ribbonText"
                  placeholder="🎉 Graduation ceremony tickets are live!"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.ribbonText?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.ribbonText.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ribbonLink" className="text-xs uppercase tracking-wide">
              Ribbon link (https)
            </Label>
            <Controller
              control={control}
              name="ribbonLink"
              render={({ field }) => (
                <Input
                  id="ribbonLink"
                  type="url"
                  placeholder="https://forms.example.com/tickets"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.ribbonLink?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.ribbonLink.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ribbonExpiry" className="text-xs uppercase tracking-wide">
              Ribbon expiry
            </Label>
            <Controller
              control={control}
              name="ribbonExpiry"
              render={({ field }) => (
                <Input
                  id="ribbonExpiry"
                  type="datetime-local"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            <p className="text-[11px] text-muted-foreground">
              When set, the ribbon auto-hides after this date/time.
            </p>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="ribbonColor" className="text-xs uppercase tracking-wide">
              Ribbon color
            </Label>
            <div className="flex items-center gap-3">
              <Controller
                control={control}
                name="ribbonColor"
                render={({ field }) => (
                  <input
                    id="ribbonColor"
                    type="color"
                    value={field.value ?? "#FFE600"}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    className="size-10 cursor-pointer rounded-md border border-border/60 bg-transparent p-1"
                    aria-label="Ribbon color"
                  />
                )}
              />
              <Controller
                control={control}
                name="ribbonColor"
                render={({ field }) => (
                  <Input
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    className="max-w-[140px] font-mono text-xs"
                    placeholder="#FFE600"
                  />
                )}
              />
              <div
                className="ml-auto h-8 flex-1 max-w-[280px] rounded-md border border-border/60"
                style={{ backgroundColor: control._formValues?.ribbonColor || "#FFE600" }}
                aria-hidden
              />
            </div>
            {errors.ribbonColor?.message ? (
              <p className="text-[11px] text-destructive">{String(errors.ribbonColor.message)}</p>
            ) : null}
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t border-border/60 pt-4">
        <Button
          type="submit"
          form="footer-ribbon-form"
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
              Save ribbon
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/* ================================================================== */
/*  Main                                                               */
/* ================================================================== */

export function FooterManager({
  creditInitial,
  linksInitial,
  linkGroupsInitial,
  settingsInitial,
  memoryMessagesInitial,
}: Props) {
  return (
    <>
      <PageHeader
        title="Footer & Developer"
        description="Round 5 footer: brand, link groups, social, developer credit, feature toggles, memory wall, ribbon."
        action={
          <Badge variant="outline" className="hidden items-center gap-1.5 border-primary/30 text-primary sm:inline-flex">
            <PanelTop className="size-3.5" />
            Round 5
          </Badge>
        }
      />
      <Tabs defaultValue="brand" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-auto flex-nowrap overflow-x-auto p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="gap-1.5 px-3 py-1.5 text-xs sm:text-sm"
                >
                  <Icon className="size-3.5" />
                  <span className="whitespace-nowrap">{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="brand" className="mt-4">
          <BrandBlurbTab initial={settingsInitial} />
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <LinkGroupsTab initial={linkGroupsInitial} />
        </TabsContent>
        <TabsContent value="social" className="mt-4">
          <SocialLinksTab initial={settingsInitial} />
        </TabsContent>
        <TabsContent value="credit" className="mt-4">
          <CreditForm initial={creditInitial} />
        </TabsContent>
        <TabsContent value="devlinks" className="mt-4">
          <DeveloperLinksSection initial={linksInitial} />
        </TabsContent>
        <TabsContent value="toggles" className="mt-4">
          <FeatureTogglesTab initial={settingsInitial} />
        </TabsContent>
        <TabsContent value="memory" className="mt-4">
          <MemoryWallTab initial={memoryMessagesInitial} />
        </TabsContent>
        <TabsContent value="ribbon" className="mt-4">
          <RibbonTab initial={settingsInitial} />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default FooterManager;
