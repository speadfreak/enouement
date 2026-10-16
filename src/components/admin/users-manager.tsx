"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataTable, type Column } from "@/components/admin/data-table";
import { ResourceForm, type FieldConfig } from "@/components/admin/resource-form";
import { ConfirmDelete, PageHeader } from "@/components/admin/page-header";
import { Plus, ShieldAlert, KeyRound } from "lucide-react";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

const schema = z.object({
  email: z.string().email("Must be a valid email"),
  name: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]),
  active: z.boolean(),
});

const FIELDS: FieldConfig[] = [
  { name: "email", label: "Email", type: "text", required: true, full: true, placeholder: "you@enouement2k27.et" },
  { name: "name", label: "Display Name", type: "text", full: true },
  {
    name: "password", label: "Password", type: "password", required: true, full: true,
    description: "Minimum 8 characters. Will be hashed with bcrypt (rounds 12).",
  },
  {
    name: "role", label: "Role", type: "select", options: [
      { label: "Admin", value: "ADMIN" },
      { label: "Super Admin", value: "SUPER_ADMIN" },
    ],
  },
  { name: "active", label: "Active", type: "boolean" },
];

const EMPTY = {
  email: "",
  name: "",
  password: "",
  role: "ADMIN" as const,
  active: true,
};

export function UsersManager({ initial, selfId }: { initial: User[]; selfId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<User[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users");
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    initialData: initial,
  });

  const [openCreate, setOpenCreate] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [deleting, setDeleting] = React.useState<User | null>(null);

  const createM = useMutation({
    mutationFn: async (values: any) => {
      const r = await fetch("/api/admin/users", {
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
      toast.success("User created.");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateM = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const r = await fetch(`/api/admin/users/${id}`, {
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
      toast.success("User updated.");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const e = await r.json().catch(() => null);
        throw new Error(e?.error || "Failed to delete");
      }
    },
    onSuccess: () => {
      toast.success("User deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = (u: User) => {
    updateM.mutate({ id: u.id, values: { active: !u.active } });
  };

  const columns: Column<User>[] = [
    {
      key: "user", header: "User", render: (r) => (
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-full bg-secondary/15 text-secondary text-xs font-bold">
            {(r.email?.[0] || "?").toUpperCase()}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{r.name || r.email}</span>
            <span className="text-[11px] text-muted-foreground">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role", header: "Role", render: (r) => (
        <Badge variant={r.role === "SUPER_ADMIN" ? "default" : "outline"} className={r.role === "SUPER_ADMIN" ? "" : "text-muted-foreground"}>
          {r.role === "SUPER_ADMIN" ? <><ShieldAlert className="size-3" /> SUPER</> : "ADMIN"}
        </Badge>
      ),
    },
    {
      key: "active", header: "Active", render: (r) => (
        <Switch checked={r.active} onCheckedChange={() => toggleActive(r)} disabled={r.id === selfId} />
      ),
    },
    {
      key: "createdAt", header: "Created", render: (r) => (
        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: "actions", header: "Extra", render: (r) => (
        <Button variant="outline" size="sm" onClick={() => setEditing(r)}>
          <KeyRound className="size-3.5" />
          Reset password
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Admin accounts that can access this console. Super-admin only."
        action={
          <Button onClick={() => setOpenCreate(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            New Admin
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
        searchKeys={[(r) => r.email, (r) => r.name ?? ""]}
        emptyLabel="No admin users yet."
      />

      <ResourceForm
        open={openCreate}
        onOpenChange={setOpenCreate}
        title="New Admin User"
        description="Create a new admin account. Password will be hashed with bcrypt."
        fields={FIELDS}
        schema={schema}
        defaultValues={EMPTY}
        onSubmit={(v) => createM.mutateAsync(v)}
        submitLabel="Create user"
      />

      {editing ? (
        <ResourceForm
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          title={`Edit · ${editing.email}`}
          description="Leave password blank to keep the existing one. (Currently password is required by the form — re-enter to change.)"
          fields={[...FIELDS.filter((f) => f.name !== "password"), { name: "password", label: "New Password (leave blank to skip)", type: "password", full: true }]}
          schema={z.object({
            email: z.string().email(),
            name: z.string().optional(),
            password: z.string().optional(),
            role: z.enum(["ADMIN", "SUPER_ADMIN"]),
            active: z.boolean(),
          })}
          defaultValues={editing}
          onSubmit={(v) => {
            const payload = { ...v };
            if (!payload.password) delete payload.password;
            return updateM.mutateAsync({ id: editing.id, values: payload });
          }}
          submitLabel="Save changes"
        />
      ) : null}

      <ConfirmDelete
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={() => deleting && deleteM.mutateAsync(deleting.id)}
        title={`Delete "${deleting?.email}"?`}
        description="This will permanently remove the admin account. This action cannot be undone."
      />
    </>
  );
}
