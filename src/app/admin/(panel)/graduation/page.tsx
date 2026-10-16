import { db } from "@/lib/db";
import { GraduationForm } from "@/components/admin/graduation-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function GraduationPage() {
  const g = await db.graduationContent.findUnique({ where: { id: "graduation" } });
  const initial = g
    ? {
        ...g,
        program: typeof g.program === "string" ? g.program : JSON.stringify(g.program, null, 2),
        memoriesGallery: Array.isArray(g.memoriesGallery) ? g.memoriesGallery.join(", ") : "",
      }
    : { program: "[]" };

  return (
    <>
      <PageHeader title="Graduation" description="The Walk — graduation day content and program." />
      <GraduationForm initial={initial} />
    </>
  );
}
