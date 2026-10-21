import { after } from "next/server";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  getApprovedMemoryMessages,
  getDeveloperLinks,
  getFooterLinkGroups,
  getNavLinks,
  getSite,
  getVisitCount,
  incrementVisitCount,
} from "@/lib/data";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const [
    site,
    navLinks,
    developerLinks,
    footerLinkGroups,
    memoryMessages,
    visitCount,
  ] = await Promise.all([
    getSite(),
    getNavLinks(),
    getDeveloperLinks(),
    getFooterLinkGroups(),
    getApprovedMemoryMessages(20),
    getVisitCount(),
  ]);

  // Fire-and-forget the visit counter increment after the response has been
  // sent. Runs once per RSC render, never blocks the paint, and only when the
  // live counter feature is enabled. Best-effort: swallows its own errors.
  if (site?.liveCounterEnabled) {
    after(async () => {
      await incrementVisitCount();
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar links={navLinks} logoUrl={site?.logoUrl} siteName={site?.siteName} />
      <main className="flex-1">{children}</main>
      <Footer
        site={site}
        developerLinks={developerLinks}
        footerLinkGroups={footerLinkGroups}
        memoryMessages={memoryMessages}
        visitCount={visitCount.count}
      />
    </div>
  );
}
