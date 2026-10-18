import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getDeveloperLinks, getNavLinks, getSite } from "@/lib/data";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const [site, navLinks, developerLinks] = await Promise.all([
    getSite(),
    getNavLinks(),
    getDeveloperLinks(),
  ]);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar links={navLinks} logoUrl={site?.logoUrl} siteName={site?.siteName} />
      <main className="flex-1">{children}</main>
      <Footer site={site} navLinks={navLinks} developerLinks={developerLinks} />
    </div>
  );
}
