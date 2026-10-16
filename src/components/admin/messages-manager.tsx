"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ConfirmDelete, PageHeader } from "@/components/admin/page-header";
import { Mail, Eye } from "lucide-react";

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  handled: boolean;
  createdAt: string;
};

export function MessagesManager({ initial }: { initial: Message[] }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Message[]>({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const r = await fetch("/api/admin/messages");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [viewing, setViewing] = React.useState<Message | null>(null);
  const [deleting, setDeleting] = React.useState<Message | null>(null);

  const toggleM = useMutation({
    mutationFn: async ({ id, handled }: { id: string; handled: boolean }) => {
      const r = await fetch(`/api/admin/messages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handled }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to update");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("Message deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "messages"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns: Column<Message>[] = [
    {
      key: "from",
      header: "From",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{r.name}</span>
          <span className="text-[11px] text-muted-foreground">{r.email}</span>
        </div>
      ),
    },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-md">{r.subject || "(no subject)"}</span> },
    { key: "message", header: "Message", render: (r) => <span className="line-clamp-2 max-w-lg text-xs text-muted-foreground">{r.message}</span> },
    {
      key: "createdAt", header: "Received", render: (r) => {
        const d = new Date(r.createdAt);
        return <span className="text-xs text-muted-foreground">{d.toLocaleString()}</span>;
      },
    },
    {
      key: "handled",
      header: "Handled",
      render: (r) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={r.handled}
            onCheckedChange={(checked) => toggleM.mutate({ id: r.id, handled: checked })}
          />
          {r.handled ? (
            <Badge variant="secondary" className="text-[10px]">DONE</Badge>
          ) : (
            <Badge variant="default" className="text-[10px]">NEW</Badge>
          )}
        </div>
      ),
    },
    {
      key: "view",
      header: "",
      render: (r) => (
        <Button variant="ghost" size="sm" onClick={() => setViewing(r)}>
          <Eye className="size-3.5" />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Messages"
        description="Inbox of contact-form submissions. Mark as handled or delete."
      />

      <DataTable
        columns={columns}
        rows={data ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onDelete={(r) => setDeleting(r)}
        searchKeys={[(r) => r.name, (r) => r.email, (r) => r.subject ?? "", (r) => r.message]}
        emptyLabel="No messages yet."
        hideActions={false}
      />

      {viewing ? (
        <Dialog open onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-display text-xl flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                {viewing.subject || "(no subject)"}
              </DialogTitle>
              <DialogDescription>
                From <span className="font-medium text-foreground">{viewing.name}</span>{" "}
                &lt;{viewing.email}&gt; · {new Date(viewing.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border border-border/60 bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm">{viewing.message}</pre>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant={viewing.handled ? "outline" : "default"}
                onClick={() => {
                  toggleM.mutate({ id: viewing.id, handled: !viewing.handled });
                  setViewing({ ...viewing, handled: !viewing.handled });
                }}
              >
                Mark as {viewing.handled ? "new" : "handled"}
              </Button>
              <Button variant="ghost" onClick={() => setViewing(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={() => deleting && deleteM.mutateAsync(deleting.id)}
        title={`Delete message from "${deleting?.name}"?`}
      />
    </>
  );
}
