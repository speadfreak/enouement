import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Activity, User as UserIcon } from "lucide-react";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  meta: any;
  createdAt: Date;
  user: { email: string; name: string | null } | null;
};

export default async function AuditPage() {
  const rows = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: true },
  });

  const columns: Column<AuditLog>[] = [
    {
      key: "when",
      header: "When",
      render: (r) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs">{new Date(r.createdAt).toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-full bg-secondary/15 text-secondary text-[10px] font-bold">
            <UserIcon className="size-3" />
          </div>
          <span className="text-xs">{r.user?.email ?? "system"}</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (r) => {
        const variant =
          r.action === "create" ? "default" :
          r.action === "delete" ? "destructive" :
          r.action === "update" ? "secondary" :
          "outline";
        return <Badge variant={variant as any} className="capitalize text-[10px]">{r.action}</Badge>;
      },
    },
    {
      key: "entity",
      header: "Entity",
      render: (r) => <Badge variant="outline" className="text-[10px]">{r.entity}</Badge>,
    },
    { key: "entityId", header: "ID", accessor: (r) => r.entityId ?? "" },
    {
      key: "meta",
      header: "Meta",
      render: (r) => r.meta ? (
        <pre className="max-w-md overflow-x-auto rounded-md bg-muted/30 p-2 text-[10px] text-muted-foreground">
          {JSON.stringify(r.meta, null, 1)}
        </pre>
      ) : <span className="text-muted-foreground/60">—</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Log"
        description="Recent admin actions, newest first. Read-only — entries cannot be modified."
      />
      <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="size-3.5 text-primary" />
        Showing last {rows.length} events.
      </div>
      <DataTable
        columns={columns}
        rows={rows as any}
        rowKey={(r) => r.id}
        hideActions
        searchKeys={[(r) => r.action, (r) => r.entity, (r) => r.user?.email ?? "", (r) => r.entityId ?? ""]}
        emptyLabel="No activity yet."
      />
    </>
  );
}
