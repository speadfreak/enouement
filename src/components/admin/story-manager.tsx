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

type Chapter = {
  id: string;
  title: string;
  subtitle: string | null;
  body: string;
  coverUrl: string | null;
  year: string | null;
  order: number;
  published: boolean;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  coverUrl: z.string().optional(),
  year: z.string().optional(),
  order: z.coerce.number().int(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "subtitle", label: "Subtitle", type: "text", full: true },
  { name: "body", label: "Body", type: "textarea", required: true, full: true, rows: 6 },
  { name: "coverUrl", label: "Cover URL", type: "text", full: true, placeholder: "https://…" },
  { name: "year", label: "Year", type: "text", placeholder: "2024 / Freshman Year…" },
  { name: "order", label: "Order", type: "number" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  title: "",
  subtitle: "",
  body: "",
  coverUrl: "",
  year: "",
  order: 0,
  published: true,
};

export function StoryManager({ initial }: { initial: Chapter[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Chapter[]>({
    queryKey: ["admin", "story"],
    queryFn: async () => {
      const r = await fetch("/api/admin/story");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Chapter | null>(null);
  const [deleting, setDeleting] = React.useState<Chapter | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/story", {
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
      toast.success("Chapter created.");
      qc.invalidateQueries({ queryKey: ["admin", "story"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/story/${id}`, {
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
      toast.success("Chapter updated.");
      qc.invalidateQueries({ queryKey: ["admin", "story"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/story/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Chapter deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "story"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Chapter>[] = [
    {
      key: "cover", header: "Cover", render: (r) => r.coverUrl ? (
        <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
          <img src={r.coverUrl} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div className="grid size-12 place-items-center text-[10px] text-muted-foreground">—</div>
      ),
    },
    {
      key: "title", header: "Title", render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{r.title}</span>
          {r.subtitle ? <span className="text-[11px] text-muted-foreground line-clamp-1">{r.subtitle}</span> : null}
        </div>
      ),
    },
    { key: "year", header: "Year", accessor: (r) => r.year ?? "" },
    { key: "order", header: "Order", accessor: (r) => r.order },
    { key: "published", header: "Published", accessor: (r) => r.published },
  ];

  return (
    <>
      <PageHeader
        title="Story Chapters"
        description="The narrative chapters of the Enouement journey."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Chapter
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
        searchKeys={[(r) => r.title, (r) => r.subtitle ?? "", (r) => r.year ?? ""]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Chapter"
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
          title="Edit Chapter"
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
