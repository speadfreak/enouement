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
import { Plus, Star } from "lucide-react";

type Video = {
  id: string;
  title: string;
  description: string | null;
  url: string;
  posterUrl: string | null;
  category: string;
  duration: string | null;
  featured: boolean;
  published: boolean;
  createdAt: string;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().min(1, "URL is required"),
  posterUrl: z.string().optional(),
  category: z.string(),
  duration: z.string().optional(),
  featured: z.boolean(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 3 },
  { name: "url", label: "Embed URL", type: "text", required: true, full: true, placeholder: "https://youtube.com/embed/…" },
  { name: "posterUrl", label: "Poster URL", type: "image", full: true, folder: "videos", placeholder: "https://…" },
  {
    name: "category", label: "Category", type: "select", options: [
      { label: "Event", value: "event" },
      { label: "Highlight", value: "highlight" },
      { label: "Memory", value: "memory" },
      { label: "Promo", value: "promo" },
      { label: "Trailer", value: "trailer" },
    ],
  },
  { name: "duration", label: "Duration", type: "text", placeholder: "3:42" },
  { name: "featured", label: "Featured", type: "boolean" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  title: "",
  description: "",
  url: "",
  posterUrl: "",
  category: "event",
  duration: "",
  featured: false,
  published: true,
};

export function VideosManager({ initial }: { initial: Video[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Video[]>({
    queryKey: ["admin", "videos"],
    queryFn: async () => {
      const r = await fetch("/api/admin/videos");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Video | null>(null);
  const [deleting, setDeleting] = React.useState<Video | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/videos", {
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
      toast.success("Video created.");
      qc.invalidateQueries({ queryKey: ["admin", "videos"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/videos/${id}`, {
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
      toast.success("Video updated.");
      qc.invalidateQueries({ queryKey: ["admin", "videos"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Video deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "videos"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Video>[] = [
    {
      key: "poster",
      header: "Poster",
      render: (r) =>
        r.posterUrl ? (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            <img src={r.posterUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="grid size-12 place-items-center text-[10px] text-muted-foreground">video</div>
        ),
    },
    { key: "title", header: "Title", render: (r) => (
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-1 max-w-md font-medium">{r.title}</span>
        {r.duration ? <span className="text-[11px] text-muted-foreground">{r.duration}</span> : null}
      </div>
    ) },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="capitalize">{r.category}</Badge> },
    {
      key: "featured", header: "Featured", render: (r) => r.featured ? (
        <Badge variant="default"><Star className="size-3" /> YES</Badge>
      ) : <span className="text-muted-foreground/60">—</span>,
    },
    { key: "published", header: "Published", accessor: (r) => r.published },
  ];

  return (
    <>
      <PageHeader
        title="Videos"
        description="Embeddable video content shown on the videos page."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Video
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
        searchKeys={[(r) => r.title, (r) => r.category]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Video"
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
          title="Edit Video"
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
