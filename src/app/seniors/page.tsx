import { PageShell } from "@/components/page-shell";
import { SeniorGrid } from "@/components/seniors/senior-grid";
import { getStudentsPaginated, getStudentStats } from "@/lib/data";

// ISR: regenerate at most every 60s. Cached reads (tag "students", revalidate 60)
// back the actual data; load-more is via /api/students (also cache-tagged).
export const revalidate = 60;

export const metadata = {
  title: "Seniors — Meet the Batch — Enouement 2K27",
  description:
    "Meet every face of the 2K27 senior batch — 700 students across Natural and Social streams. Search, filter, and discover the people who made our story.",
};

export const dynamic = "force-dynamic";

export default async function SeniorsPage() {
  const [{ items, total }, stats] = await Promise.all([
    getStudentsPaginated({ page: 1, pageSize: 48 }),
    getStudentStats(),
  ]);

  return (
    <PageShell>
      <SeniorGrid initial={items} initialTotal={total} stats={stats} />
    </PageShell>
  );
}
