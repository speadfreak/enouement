import { db } from "@/lib/db";
import { MessagesManager } from "@/components/admin/messages-manager";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const rows = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return <MessagesManager initial={rows as any} />;
}
