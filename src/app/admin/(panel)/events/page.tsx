import { db } from "@/lib/db";
import { EventsManager } from "@/components/admin/events-manager";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const rows = await db.event.findMany({ orderBy: { startDate: "asc" }, take: 200 });
  return <EventsManager initial={rows as any} />;
}
