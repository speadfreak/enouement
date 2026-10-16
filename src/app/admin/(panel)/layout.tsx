import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: { default: "Admin · Enouement 2K27", template: "%s · Admin · Enouement 2K27" },
  description: "Enouement 2K27 admin console",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell email={user.email ?? ""} role={(user.role as Role) ?? Role.ADMIN}>
      {children}
    </AdminShell>
  );
}
