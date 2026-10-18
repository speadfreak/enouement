import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getCurrentUser, logAudit } from "@/lib/session";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors?.newPassword?.[0] || "Invalid input" },
        { status: 422 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const dbUser = await db.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.passwordHash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (await bcrypt.compare(newPassword, dbUser.passwordHash)) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400 }
      );
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash, mustChangePassword: false },
    });
    await logAudit("change-password", "User", user.id);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
