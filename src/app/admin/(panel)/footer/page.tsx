import { db } from "@/lib/db";
import { FooterManager } from "@/components/admin/footer-manager";

export const dynamic = "force-dynamic";

export default async function FooterAdminPage() {
  const [site, links] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: "site" } }),
    db.developerLink.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
  ]);

  const creditInitial = {
    devName: site?.devName ?? "Joseph James",
    devRole: site?.devRole ?? "Full-Stack Developer",
    devLink: site?.devLink ?? null,
  };

  return (
    <FooterManager
      creditInitial={creditInitial}
      linksInitial={links as any}
    />
  );
}
