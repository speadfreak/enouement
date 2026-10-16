import { db } from "@/lib/db";
import { getCurrentUser, requireSuperAdmin } from "@/lib/session";
import { UsersManager } from "@/components/admin/users-manager";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  try {
    await requireSuperAdmin();
  } catch {
    return (
      <>
        <PageHeader title="Users" description="Restricted to super admins." />
        <Card className="glass border-destructive/30">
          <CardContent className="flex items-center gap-3 py-6">
            <ShieldAlert className="size-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              You don&apos;t have super-admin privileges. Ask a super admin to upgrade your account.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }
  const me = await getCurrentUser();
  const rows = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return <UsersManager initial={rows as any} selfId={me?.id ?? ""} />;
}
