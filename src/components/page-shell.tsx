import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getNavLinks, getSite } from "@/lib/data";
import { db } from "@/lib/db";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const [site, navLinks, developerLinks] = await Promise.all([
    getSite(),
    getNavLinks(),
    db.developerLink.findMany({
      where: { enabled: true },
      orderBy: { order: "asc" },
    }),
  ]);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar links={navLinks} />
      <main className="flex-1">{children}</main>
      <Footer site={site} navLinks={navLinks} developerLinks={developerLinks} />
    </div>
  );
}
