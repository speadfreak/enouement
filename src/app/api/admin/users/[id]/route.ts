import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireSuperAdmin, logAudit, getCurrentUser } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional(),
  active: z.boolean().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    const me = await requireSuperAdmin();
    const { id } = await params;
    if (me.id === id) {
      // Allow self-update for name/password only; do not allow self-deactivate or self-demotion.
    }
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const data: Record<string, any> = {};
    if (v.email !== undefined) data.email = v.email.toLowerCase();
    if (v.name !== undefined) data.name = v.name || null;
    if (v.role !== undefined) data.role = v.role;
    if (v.active !== undefined) data.active = v.active;
    if (v.password) data.passwordHash = await bcrypt.hash(v.password, 12);

    const updated = await db.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, updatedAt: true },
    });
    await logAudit("update", "User", updated.id, { email: updated.email });
    return ok(updated);
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleErr(async () => {
    const me = await requireSuperAdmin();
    const { id } = await params;
    if (me.id === id) return bad("You cannot delete your own account.", 400);
    const deleted = await db.user.delete({ where: { id } });
    await logAudit("delete", "User", deleted.id, { email: deleted.email });
    return ok({ ok: true });
  });
}

export const _r = NextResponse;
