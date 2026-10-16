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

type Post = {
  id: string;
  caption: string;
  tags: string[];
  mediaUrls: string[];
  mediaType: string;
  pinned: boolean;
  published: boolean;
  authorName: string;
  likeCount: number;
  createdAt: string;
};

const schema = z.object({
  caption: z.string().min(1, "Caption is required"),
  tags: z.string(),
  mediaUrls: z.string(),
  mediaType: z.enum(["image", "video", "mixed"]),
  pinned: z.boolean(),
  published: z.boolean(),
  authorName: z.string(),
});

const FIELDS: FieldConfig[] = [
  { name: "caption", label: "Caption", type: "text", required: true, full: true },
  { name: "tags", label: "Tags", type: "tags", placeholder: "senior, farewell, grad" },
  { name: "mediaUrls", label: "Media URLs", type: "url-list", full: true, placeholder: "https://…, https://…" },
  { name: "mediaType", label: "Media Type", type: "select", options: [
    { label: "Image", value: "image" },
    { label: "Video", value: "video" },
    { label: "Mixed", value: "mixed" },
  ] },
  { name: "authorName", label: "Author Name", type: "text" },
  { name: "pinned", label: "Pinned", type: "boolean" },
  { name: "published", label: "Published", type: "boolean" },
];

const EMPTY = {
  caption: "",
  tags: "",
  mediaUrls: "",
  mediaType: "image",
  pinned: false,
  published: true,
  authorName: "Enouement 2K27",
};

export function PostsManager({ initial }: { initial: Post[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Post[]>({
    queryKey: ["admin", "posts"],
    queryFn: async () => {
      const r = await fetch("/api/admin/posts");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<Post | null>(null);
  const [deleting, setDeleting] = React.useState<Post | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/posts", {
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
      toast.success("Post created.");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/posts/${id}`, {
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
      toast.success("Post updated.");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Post deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "posts"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Post>[] = [
    {
      key: "preview",
      header: "Media",
      render: (r) =>
        r.mediaUrls?.[0] ? (
          <div className="size-12 overflow-hidden rounded-md border border-border/60 bg-muted">
            <img src={r.mediaUrls[0]} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="grid size-12 place-items-center text-[10px] text-muted-foreground">no media</div>
        ),
    },
    { key: "caption", header: "Caption", render: (r) => <span className="line-clamp-1 max-w-md">{r.caption}</span> },
    { key: "authorName", header: "Author", accessor: (r) => r.authorName },
    { key: "tags", header: "Tags", accessor: (r) => r.tags.join(", ") },
    { key: "mediaType", header: "Type", render: (r) => <Badge variant="outline" className="capitalize">{r.mediaType}</Badge> },
    { key: "pinned", header: "Pinned", accessor: (r) => r.pinned },
    { key: "published", header: "Published", accessor: (r) => r.published },
    { key: "likeCount", header: "Likes", accessor: (r) => r.likeCount },
  ];

  return (
    <>
      <PageHeader
        title="Moments"
        description="Live feed posts shared by the Enouement team."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Post
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
        searchKeys={[(r) => r.caption, (r) => r.authorName, (r) => r.tags.join(" ")]}
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Post"
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
          title="Edit Post"
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
        title="Delete this post?"
        description="This will also remove any reactions associated with it."
      />
    </>
  );
}
