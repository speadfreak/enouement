import { db } from "@/lib/db";
import { SeniorsManager } from "@/components/admin/seniors-manager";

export const dynamic = "force-dynamic";

export default async function SeniorsPage() {
  const rows = await db.student.findMany({
    orderBy: [{ featured: "desc" }, { order: "asc" }],
    take: 500,
  });
  return <SeniorsManager initial={rows as any} />;
}
