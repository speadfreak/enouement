import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.role || (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN)) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.SUPER_ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function logAudit(action: string, entity: string, entityId?: string, meta?: any) {
  const user = await getCurrentUser();
  await db.auditLog.create({
    data: {
      userId: user?.id,
      action,
      entity,
      entityId,
      meta: meta ?? undefined,
    },
  });
}
