import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one id required"),
  action: z.enum(["publish", "unpublish", "feature", "unfeature", "delete", "setStream"]),
  value: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, schema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);
    const { ids, action, value } = parsed.data;

    let affected = 0;
    let auditMeta: Record<string, unknown> = { action, count: ids.length };

    if (action === "delete") {
      const r = await db.student.deleteMany({ where: { id: { in: ids } } });
      affected = r.count;
    } else if (action === "publish") {
      const r = await db.student.updateMany({
        where: { id: { in: ids } },
        data: { published: true },
      });
      affected = r.count;
    } else if (action === "unpublish") {
      const r = await db.student.updateMany({
        where: { id: { in: ids } },
        data: { published: false },
      });
      affected = r.count;
    } else if (action === "feature") {
      const r = await db.student.updateMany({
        where: { id: { in: ids } },
        data: { featured: true },
      });
      affected = r.count;
    } else if (action === "unfeature") {
      const r = await db.student.updateMany({
        where: { id: { in: ids } },
        data: { featured: false },
      });
      affected = r.count;
    } else if (action === "setStream") {
      const v =
        value === "Natural" || value === "Social" ? value : (null as string | null);
      const r = await db.student.updateMany({
        where: { id: { in: ids } },
        data: { stream: v },
      });
      affected = r.count;
      auditMeta = { action, count: ids.length, value: v };
    } else {
      return bad("Unknown action", 400);
    }

    await logAudit(`bulk-${action}`, "Student", undefined, auditMeta);
    revalidateTag("students", "max");
    revalidateTag("stats", "max");
    return ok({ affected });
  });
}

export const _r = NextResponse;
