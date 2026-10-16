"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";
import { ConfirmDelete, PageHeader } from "@/components/admin/page-header";
import { Plus } from "lucide-react";

type Announcement = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  category: string;
  pinned: boolean;
  urgent: boolean;
  published: boolean;
  publishAt: string;
  createdAt: string;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  coverUrl: z.string().optional(),
  category: z.string(),
  pinned: z.boolean(),
  urgent: z.boolean(),
  published: z.boolean(),
  publishAt: z.string().optional(),
});

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "slug", label: "Slug (auto from title if empty)", type: "text", full: true, placeholder: "auto-generated" },
  { name: "excerpt", label: "Excerpt", type: "textarea", full: true, rows: 2 },
  { name: "body", label: "Body", type: "textarea", required: true, full: true, rows: 6 },
  { name: "coverUrl", label: "Cover URL", type: "text", full: true, placeholder: "https://…" },
  {
    name: "category", label: "Category", type: "select", options: [
      { label: "News", value: "news" },
      { label: "Update", value: "update" },
      { label: "Alert", value: "alert" },
      { label: "Info", value: "info" },
    ],
  },
  { name: "publishAt", label: "Publish At", type: "datetime-local" },
  { name: "pinned", label: "Pinned", type: "boolean" },
  { name: "urgent", label: "Urgent", type: "boolean" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverUrl: "",
  category: "news",
  pinned: false,
  urgent: false,
  published: true,
  publishAt: "",
};

export function AnnouncementsManager({ initial }: { initial: Announcement[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Announcement[]>({
    queryKey: ["admin", "announcements"],
    queryFn: async () => {
      const r = await fetch("/api/admin/announcements");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Announcement | null>(null);
  const [deleting, setDeleting] = React.useState<Announcement | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/announcements", {
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
      toast.success("Announcement created.");
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/announcements/${id}`, {
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
      toast.success("Announcement updated.");
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Announcement deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "announcements"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Announcement>[] = [
    {
      key: "cover",
      header: "Cover",
      render: (r) =>
        r.coverUrl ? (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            <img src={r.coverUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="grid size-12 place-items-center text-[10px] text-muted-foreground">—</div>
        ),
    },
    { key: "title", header: "Title", render: (r) => <div className="flex flex-col gap-0.5">
      <span className="line-clamp-1 max-w-md font-medium">{r.title}</span>
      <span className="text-[11px] text-muted-foreground">/{r.slug}</span>
    </div> },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="capitalize">{r.category}</Badge> },
    { key: "flags", header: "Flags", render: (r) => (
      <div className="flex gap-1">
        {r.pinned ? <Badge variant="default" className="text-[10px]">PIN</Badge> : null}
        {r.urgent ? <Badge variant="destructive" className="text-[10px]">URGENT</Badge> : null}
        {!r.pinned && !r.urgent ? <span className="text-muted-foreground/60">—</span> : null}
      </div>
    ) },
    { key: "published", header: "Published", accessor: (r) => r.published },
  ];

  return (
    <>
      <PageHeader
        title="Announcements"
        description="News, alerts and updates for the Enouement community."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Announcement
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onEdit={(r) => setEditing(r)}
        onDelete={(r) => setDeleting(r)}
        searchKeys={[(r) => r.title, (r) => r.slug, (r) => r.category]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Announcement"
        fields={FIELDS}
        schema={schema}
        defaultValues={EMPTY}
        onSubmit={(v) => createM.mutateAsync(v)}
        submitLabel="Create"
      />

      {editing ? (
        <ResourceForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          title="Edit Announcement"
          fields={FIELDS}
          schema={schema}
          defaultValues={editing}
          onSubmit={(v) => updateM.mutateAsync({ id: editing.id, values: v })}
          submitLabel="Save changes"
        />
      ) : null}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={() => deleting && deleteM.mutateAsync(deleting.id)}
        title={`Delete "${deleting?.title}"?`}
      />
    </>
  );
}
