import { db } from "@/lib/db";
import { FooterManager } from "@/components/admin/footer-manager";

export const dynamic = "force-dynamic";

export default async function FooterAdminPage() {
  const [site, linkGroups, developerLinks, memoryMessages] = await Promise.all([
    db.siteSetting.findUnique({ where: { id: "site" } }),
    db.footerLinkGroup.findMany({
      orderBy: [{ order: "asc" }, { title: "asc" }],
      include: { links: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    }),
    db.developerLink.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] }),
    db.memoryWallMessage.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ]);

  const creditInitial = {
    devName: site?.devName ?? "Joseph James",
    devRole: site?.devRole ?? "Full-Stack Developer",
    devLink: site?.devLink ?? null,
  };

  // Settings initial values, normalized for client form inputs.
  const settingsInitial = site
    ? {
        ...site,
        // socialLinks is a JSON column — flatten the well-known keys to top-level
        // form fields so the "Social Links" tab can render simple inputs.
        socialInstagram: (site.socialLinks as any)?.instagram ?? "",
        socialTelegram: (site.socialLinks as any)?.telegram ?? "",
        socialTiktok: (site.socialLinks as any)?.tiktok ?? "",
        socialYoutube: (site.socialLinks as any)?.youtube ?? "",
        countdownDate: site.countdownDate
          ? new Date(site.countdownDate).toISOString().slice(0, 16)
          : "",
        ribbonExpiry: site.ribbonExpiry
          ? new Date(site.ribbonExpiry).toISOString().slice(0, 16)
          : "",
      }
    : null;

  return (
    <FooterManager
      creditInitial={creditInitial}
      linksInitial={developerLinks as any}
      linkGroupsInitial={linkGroups as any}
      settingsInitial={settingsInitial as any}
      memoryMessagesInitial={memoryMessages as any}
    />
  );
}
