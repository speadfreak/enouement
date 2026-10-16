import { db } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/admin/page-header";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await db.siteSetting.findUnique({ where: { id: "site" } });
  const initial = s
    ? {
        ...s,
        socialLinks: typeof s.socialLinks === "string" ? s.socialLinks : JSON.stringify(s.socialLinks, null, 2),
        contactInfo: typeof s.contactInfo === "string" ? s.contactInfo : JSON.stringify(s.contactInfo, null, 2),
      }
    : {};

  return (
    <>
      <PageHeader title="Site Settings" description="Global configuration for Enouement 2K27" />
      <SettingsForm initial={initial} />
    </>
  );
}
