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

type Hero = {
  id: string;
  type: string;
  url: string;
  posterUrl: string | null;
  title: string | null;
  duration: number;
  transition: string;
  order: number;
  enabled: boolean;
  createdAt: string;
};

const schema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().min(1, "URL is required"),
  posterUrl: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  duration: z.coerce.number().int().min(500).max(60000),
  transition: z.enum(["fade", "zoom", "slide"]),
  order: z.coerce.number().int(),
  enabled: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "type", label: "Type", type: "select", required: true, options: [
    { label: "Image", value: "image" },
    { label: "Video", value: "video" },
  ] },
  { name: "url", label: "URL", type: "image", accept: "both", required: true, full: true, folder: "hero", placeholder: "https://…", description: "Background image or video for the hero slide." },
  { name: "posterUrl", label: "Poster URL (for videos)", type: "image", full: true, folder: "hero", placeholder: "https://…" },
  { name: "title", label: "Title", type: "text", full: true },
  { name: "duration", label: "Duration (ms)", type: "number", placeholder: "6000" },
  { name: "transition", label: "Transition", type: "select", options: [
    { label: "Fade", value: "fade" },
    { label: "Zoom", value: "zoom" },
    { label: "Slide", value: "slide" },
  ] },
  { name: "order", label: "Order", type: "number" },
  { name: "enabled", label: "Enabled", type: "boolean" },
];

const EMPTY = {
  type: "image",
  url: "",
  posterUrl: "",
  title: "",
  duration: 6000,
  transition: "fade",
  order: 0,
  enabled: true,
};

export function HeroManager({ initial }: { initial: Hero[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Hero[]>({
    queryKey: ["admin", "hero"],
    queryFn: async () => {
      const r = await fetch("/api/admin/hero");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Hero | null>(null);
  const [deleting, setDeleting] = React.useState<Hero | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/hero", {
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
      toast.success("Hero media created.");
      qc.invalidateQueries({ queryKey: ["admin", "hero"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/hero/${id}`, {
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
      toast.success("Hero media updated.");
      qc.invalidateQueries({ queryKey: ["admin", "hero"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/hero/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Hero media deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "hero"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Hero>[] = [
    { key: "order", header: "#", accessor: (r) => r.order },
    {
      key: "preview",
      header: "Preview",
      render: (r) =>
        r.type === "video" ? (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            {r.posterUrl ? (
              <img src={r.posterUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-[10px] text-muted-foreground">video</div>
            )}
          </div>
        ) : (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            <img src={r.url} alt="" className="size-full object-cover" />
          </div>
        ),
    },
    { key: "title", header: "Title", accessor: (r) => r.title || "" },
    { key: "type", header: "Type", render: (r) => <Badge variant="outline" className="capitalize">{r.type}</Badge> },
    { key: "transition", header: "Transition", render: (r) => <Badge variant="outline" className="capitalize">{r.transition}</Badge> },
    { key: "duration", header: "Duration", accessor: (r) => `${r.duration}ms` },
    { key: "enabled", header: "Enabled", accessor: (r) => r.enabled },
  ];

  return (
    <>
      <PageHeader
        title="Hero Media"
        description="Background media for the landing hero. Drag-reorder not implemented — set order manually."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Hero Slide
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
        searchKeys={[(r) => r.title ?? "", (r) => r.url]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Hero Media"
        description="Add a new background slide for the hero section."
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
          title="Edit Hero Media"
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
        title={`Delete "${deleting?.title || "this slide"}"?`}
        description="This will remove the hero slide from rotation."
      />
    </>
  );
}
