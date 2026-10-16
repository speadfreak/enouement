import { db } from "@/lib/db";
import { MerchManager } from "@/components/admin/merch-manager";

export const dynamic = "force-dynamic";

export default async function MerchPage() {
  const rows = await db.merchItem.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return <MerchManager initial={rows as any} />;
}
