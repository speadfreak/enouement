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

type Merch = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  imageUrls: string[];
  colors: string[];
  sizes: string[];
  details: string | null;
  featured: boolean;
  order: number;
};

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  imageUrls: z.string(),
  colors: z.string(),
  sizes: z.string(),
  details: z.string().optional(),
  featured: z.boolean(),
  order: z.coerce.number().int(),
});

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Name", type: "text", required: true, full: true },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 3 },
  { name: "price", label: "Price (ETB)", type: "number", placeholder: "0.00" },
  { name: "order", label: "Order", type: "number" },
  { name: "imageUrls", label: "Image URLs", type: "image-list", full: true, folder: "merch", placeholder: "https://…, https://…" },
  { name: "colors", label: "Colors", type: "tags", placeholder: "black, white, green" },
  { name: "sizes", label: "Sizes", type: "tags", placeholder: "S, M, L, XL" },
  { name: "details", label: "Details", type: "textarea", full: true, rows: 3 },
  { name: "featured", label: "Featured", type: "boolean" },
];

const EMPTY = {
  name: "",
  description: "",
  price: "",
  imageUrls: "",
  colors: "",
  sizes: "",
  details: "",
  featured: false,
  order: 0,
};

export function MerchManager({ initial }: { initial: Merch[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Merch[]>({
    queryKey: ["admin", "merch"],
    queryFn: async () => {
      const r = await fetch("/api/admin/merch");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Merch | null>(null);
  const [deleting, setDeleting] = React.useState<Merch | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/merch", {
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
      toast.success("Merch created.");
      qc.invalidateQueries({ queryKey: ["admin", "merch"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/merch/${id}`, {
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
      toast.success("Merch updated.");
      qc.invalidateQueries({ queryKey: ["admin", "merch"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/merch/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Merch deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "merch"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Merch>[] = [
    {
      key: "image", header: "Image", render: (r) => r.imageUrls?.[0] ? (
        <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
          <img src={r.imageUrls[0]} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div className="grid size-12 place-items-center text-[10px] text-muted-foreground">—</div>
      ),
    },
    {
      key: "name", header: "Name", render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{r.name}</span>
          {r.description ? <span className="text-[11px] text-muted-foreground line-clamp-1">{r.description}</span> : null}
        </div>
      ),
    },
    {
      key: "price", header: "Price", render: (r) => r.price != null ? (
        <span className="font-mono text-sm">{Number(r.price).toLocaleString()} ETB</span>
      ) : <span className="text-muted-foreground/60">—</span>,
    },
    { key: "colors", header: "Colors", accessor: (r) => r.colors.join(", ") },
    { key: "sizes", header: "Sizes", accessor: (r) => r.sizes.join(", ") },
    {
      key: "featured", header: "Featured", render: (r) => r.featured ? (
        <Badge variant="default"><Star className="size-3" /> YES</Badge>
      ) : <span className="text-muted-foreground/60">—</span>,
    },
    { key: "order", header: "Order", accessor: (r) => r.order },
  ];

  return (
    <>
      <PageHeader
        title="Merch"
        description="Class of 2027 merchandise — hoodies, tees, mugs and more."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Merch
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
        searchKeys={[(r) => r.name, (r) => r.description ?? "", (r) => r.colors.join(" "), (r) => r.sizes.join(" ")]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Merch"
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
          title="Edit Merch"
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
