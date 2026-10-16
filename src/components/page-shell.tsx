import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getNavLinks, getSite } from "@/lib/data";

export async function PageShell({ children }: { children: React.ReactNode }) {
  const [site, navLinks] = await Promise.all([getSite(), getNavLinks()]);
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <Navbar links={navLinks} />
      <main className="flex-1">{children}</main>
      <Footer
        siteName={site?.siteName ?? "Enouement 2K27"}
        tagline={site?.tagline ?? ""}
        footerText={site?.footerText ?? ""}
        socialLinks={site?.socialLinks ?? {}}
        navLinks={navLinks}
      />
    </div>
  );
}
