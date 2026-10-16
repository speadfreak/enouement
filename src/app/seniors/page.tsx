import { PageShell } from "@/components/page-shell";
import { SeniorGrid } from "@/components/seniors/senior-grid";
import { getStudents } from "@/lib/data";

export const metadata = {
  title: "Seniors — Meet the Batch — Enouement 2K27",
  description:
    "Meet every face of the 2K27 senior batch — search, filter by section, and discover the people who made our story.",
};

export default async function SeniorsPage() {
  const students = await getStudents();

  return (
    <PageShell>
      <SeniorGrid seniors={students} />
    </PageShell>
  );
}
