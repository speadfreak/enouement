"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DataTable, type Column } from "@/components/admin/data-table";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";
import { ConfirmDelete, PageHeader } from "@/components/admin/page-header";
import { Plus, Images, Trash2 } from "lucide-react";

type Media = {
  id: string;
  url: string;
  type: string;
  title: string | null;
  order: number;
};

type Album = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  category: string;
  order: number;
  published: boolean;
  media?: Media[];
  createdAt: string;
};

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  category: z.string(),
  order: z.coerce.number().int(),
  published: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, full: true },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 3 },
  { name: "coverUrl", label: "Cover URL", type: "text", full: true, placeholder: "https://…" },
  {
    name: "category", label: "Category", type: "select", options: [
      { label: "Events", value: "events" },
      { label: "Class", value: "class" },
      { label: "Sports", value: "sports" },
      { label: "Trips", value: "trips" },
      { label: "Senior", value: "senior" },
    ],
  },
  { name: "order", label: "Order", type: "number" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  title: "",
  description: "",
  coverUrl: "",
  category: "events",
  order: 0,
  published: true,
};

export function AlbumsManager({ initial }: { initial: Album[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Album[]>({
    queryKey: ["admin", "albums"],
    queryFn: async () => {
      const r = await fetch("/api/admin/albums");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Album | null>(null);
  const [deleting, setDeleting] = React.useState<Album | null>(null);
  const [mediaAlbum, setMediaAlbum] = React.useState<Album | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/albums", {
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
      toast.success("Album created.");
      qc.invalidateQueries({ queryKey: ["admin", "albums"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/albums/${id}`, {
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
      toast.success("Album updated.");
      qc.invalidateQueries({ queryKey: ["admin", "albums"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/albums/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Album deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "albums"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Album>[] = [
    {
      key: "cover",
      header: "Cover",
      render: (r) =>
        r.coverUrl ? (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            <img src={r.coverUrl} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="grid size-12 place-items-center text-muted-foreground">
            <Images className="size-4" />
          </div>
        ),
    },
    { key: "title", header: "Title", accessor: (r) => r.title },
    { key: "category", header: "Category", render: (r) => <Badge variant="outline" className="capitalize">{r.category}</Badge> },
    { key: "count", header: "Media", render: (r) => <Badge variant="secondary">{r.media?.length ?? 0}</Badge> },
    { key: "order", header: "Order", accessor: (r) => r.order },
    { key: "published", header: "Published", accessor: (r) => r.published },
    {
      key: "actionsExtra",
      header: "Media",
      render: (r) => (
        <Button variant="outline" size="sm" onClick={() => setMediaAlbum(r)}>
          <Images className="size-3.5" />
          Manage
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Gallery · Albums"
        description="Photo and video albums shown on the gallery page."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Album
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
        hideActions={false}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Album"
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
          title="Edit Album"
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
        description="This will permanently remove the album and all of its media."
      />

      {mediaAlbum ? (
        <AlbumMediaDialog
          album={mediaAlbum}
          onClose={() => setMediaAlbum(null)}
          onChanged={() => qc.invalidateQueries({ queryKey: ["admin", "albums"] })}
        />
      ) : null}
    </>
  );
}

function AlbumMediaDialog({ album, onClose, onChanged }: { album: Album; onClose: () => void; onChanged: () => void }) {
  const [url, setUrl] = React.useState("");
  const [type, setType] = React.useState<"image" | "video">("image");
  const [adding, setAdding] = React.useState(false);

  const media = album.media ?? [];

  const add = async () => {
    if (!url.trim()) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/admin/albums/${album.id}/media`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), type, order: media.length }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to add media");
      }
      toast.success("Media added.");
      setUrl("");
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  };

  const remove = async (mediaId: string) => {
    const r = await fetch(`/api/admin/albums/${album.id}/media/${mediaId}`, { method: "DELETE" });
    if (!r.ok) {
      const e = await r.json().catch(() => null);
      toast.error(e?.error || "Failed to delete media");
      return;
    }
    toast.success("Media removed.");
    onChanged();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Media · {album.title}</DialogTitle>
          <DialogDescription>Add image or video URLs to this album.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <Input
            placeholder="https://image-url.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={adding}
          />
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="image">Image</SelectItem>
              <SelectItem value="video">Video</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={add} disabled={adding || !url.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            Add
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {media.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No media yet. Add URLs above.</p>
          ) : (
            media.map((m) => (
              <div key={m.id} className="group relative overflow-hidden rounded-md border border-border/60 bg-muted">
                <img src={m.url} alt={m.title ?? ""} className="aspect-square size-full object-cover" />
                <button
                  onClick={() => remove(m.id)}
                  className="bg-destructive/90 text-white absolute right-1 top-1 grid size-7 place-items-center rounded-md opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove media"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                  <span className="truncate">{m.type}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
