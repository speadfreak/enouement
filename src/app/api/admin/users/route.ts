import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireSuperAdmin, logAudit, getCurrentUser } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  email: z.string().email("Must be a valid email"),
  name: z.string().optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).default("ADMIN"),
  active: z.boolean().default(true),
});

export async function GET() {
  return handleErr(async () => {
    await requireSuperAdmin();
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
    return ok(rows);
  });
}

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireSuperAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const v = parsed.data;
    const email = v.email.toLowerCase();
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return bad("A user with that email already exists.", 409);
    const passwordHash = await bcrypt.hash(v.password, 12);
    const created = await db.user.create({
      data: {
        email,
        name: v.name || null,
        passwordHash,
        role: v.role,
        active: v.active,
      },
      select: { id: true, email: true, name: true, role: true, active: true, createdAt: true, updatedAt: true },
    });
    await logAudit("create", "User", created.id, { email: created.email, role: created.role });
    return ok(created, 201);
  });
}

export const _r = NextResponse;
