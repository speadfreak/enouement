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

type Student = {
  id: string;
  name: string;
  nickname: string | null;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  section: string | null;
  club: string | null;
  order: number;
  featured: boolean;
  published: boolean;
};

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  nickname: z.string().optional(),
  photoUrl: z.string().optional(),
  quote: z.string().optional(),
  futurePlan: z.string().optional(),
  section: z.string().optional(),
  club: z.string().optional(),
  order: z.coerce.number().int(),
  featured: z.boolean(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "nickname", label: "Nickname", type: "text" },
  { name: "photoUrl", label: "Photo URL", type: "text", full: true, placeholder: "https://…" },
  { name: "quote", label: "Quote", type: "textarea", full: true, rows: 2 },
  { name: "futurePlan", label: "Future Plan", type: "textarea", full: true, rows: 2 },
  { name: "section", label: "Section", type: "text", placeholder: "A / B / Science…" },
  { name: "club", label: "Club", type: "text" },
  { name: "order", label: "Order", type: "number" },
  { name: "featured", label: "Featured", type: "boolean" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  name: "",
  nickname: "",
  photoUrl: "",
  quote: "",
  futurePlan: "",
  section: "",
  club: "",
  order: 0,
  featured: false,
  published: true,
};

export function SeniorsManager({ initial }: { initial: Student[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Student[]>({
    queryKey: ["admin", "seniors"],
    queryFn: async () => {
      const r = await fetch("/api/admin/seniors");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Student | null>(null);
  const [deleting, setDeleting] = React.useState<Student | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/seniors", {
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
      toast.success("Senior added.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/seniors/${id}`, {
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
      toast.success("Senior updated.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/seniors/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Senior deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "seniors"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Student>[] = [
    {
      key: "photo",
      header: "Photo",
      render: (r) =>
        r.photoUrl ? (
          <div className="size-12 overflow-hidden rounded-full border border-border/60 bg-muted">
            <img src={r.photoUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="grid size-12 place-items-center rounded-full border border-border/60 bg-muted text-[10px] text-muted-foreground">
            {r.name[0] ?? "?"}
          </div>
        ),
    },
    {
      key: "name", header: "Name", render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{r.name}</span>
          {r.nickname ? <span className="text-[11px] text-muted-foreground">"{r.nickname}"</span> : null}
        </div>
      ),
    },
    { key: "section", header: "Section", accessor: (r) => r.section ?? "" },
    { key: "club", header: "Club", accessor: (r) => r.club ?? "" },
    { key: "quote", header: "Quote", render: (r) => <span className="line-clamp-1 max-w-xs text-muted-foreground">{r.quote ?? "—"}</span> },
    {
      key: "featured", header: "Featured", render: (r) => r.featured ? (
        <Badge variant="default"><Star className="size-3" /> YES</Badge>
      ) : <span className="text-muted-foreground/60">—</span>,
    },
    { key: "published", header: "Published", accessor: (r) => r.published },
    { key: "order", header: "Order", accessor: (r) => r.order },
  ];

  return (
    <>
      <PageHeader
        title="Seniors"
        description="Class of 2027 senior profiles — the heart of Enouement."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            Add Senior
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
        searchKeys={[(r) => r.name, (r) => r.nickname ?? "", (r) => r.section ?? "", (r) => r.club ?? ""]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="Add Senior"
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
          title="Edit Senior"
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
        title={`Delete "${deleting?.name}"?`}
      />
    </>
  );
}
