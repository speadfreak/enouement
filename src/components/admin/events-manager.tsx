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

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  body: string | null;
  coverUrl: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  category: string;
  published: boolean;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  body: z.string().optional(),
  coverUrl: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  category: z.string(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "slug", label: "Slug (auto if empty)", type: "text", full: true, placeholder: "auto-generated" },
  { name: "description", label: "Short Description", type: "textarea", full: true, rows: 2 },
  { name: "body", label: "Full Description / Body", type: "textarea", full: true, rows: 5 },
  { name: "coverUrl", label: "Cover URL", type: "image", full: true, folder: "events", placeholder: "https://…" },
  { name: "location", label: "Location", type: "text" },
  {
    name: "category", label: "Category", type: "select", options: [
      { label: "Senior", value: "senior" },
      { label: "Farewell", value: "farewell" },
      { label: "Graduation", value: "graduation" },
      { label: "Special", value: "special" },
    ],
  },
  { name: "startDate", label: "Start Date", type: "datetime-local", required: true },
  { name: "endDate", label: "End Date", type: "datetime-local" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  title: "",
  slug: "",
  description: "",
  body: "",
  coverUrl: "",
  location: "",
  startDate: "",
  endDate: "",
  category: "special",
  published: true,
};

export function EventsManager({ initial }: { initial: Event[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Event[]>({
    queryKey: ["admin", "events"],
    queryFn: async () => {
      const r = await fetch("/api/admin/events");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Event | null>(null);
  const [deleting, setDeleting] = React.useState<Event | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/events", {
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
      toast.success("Event created.");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/events/${id}`, {
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
      toast.success("Event updated.");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Event deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "events"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Event>[] = [
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
    {
      key: "title", header: "Title", render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="line-clamp-1 max-w-md font-medium">{r.title}</span>
          <span className="text-[11px] text-muted-foreground">/{r.slug} · {r.location || "—"}</span>
        </div>
      ),
    },
    {
      key: "startDate", header: "When", render: (r) => {
        const d = new Date(r.startDate);
        return <span className="text-xs">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>;
      },
    },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="capitalize">{r.category}</Badge> },
    { key: "published", header: "Published", accessor: (r) => r.published },
  ];

  return (
    <>
      <PageHeader
        title="Events"
        description="Senior week, farewell, graduation and special events."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Event
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
        searchKeys={[(r) => r.title, (r) => r.slug, (r) => r.location ?? "", (r) => r.category]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Event"
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
          title="Edit Event"
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
