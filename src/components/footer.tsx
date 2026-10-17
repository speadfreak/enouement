import Link from "next/link";
import { Instagram, Send, Youtube, Sparkles, Mail, Heart } from "lucide-react";
import { Marquee } from "@/components/marquee";
import { Countdown } from "@/components/hero/countdown";
import { FooterCinematicWordmark } from "@/components/footer/cinematic-wordmark";
import { DevCredit } from "@/components/footer/dev-credit";
import { DeveloperLinkCard } from "@/components/footer/developer-link-card";
import type { DeveloperLink } from "@prisma/client";

type SocialLinks = Record<string, string>;

type NavLink = { label: string; href: string };

type Site = {
  siteName: string;
  tagline: string;
  footerText: string;
  socialLinks: SocialLinks;
  countdownLabel?: string | null;
  countdownDate?: Date | string | null;
  devName?: string | null;
  devRole?: string | null;
  devLink?: string | null;
};

type Props = {
  site: Site | null;
  navLinks: NavLink[];
  developerLinks: DeveloperLink[];
};

const SOCIALS: { key: string; icon: typeof Instagram; label: string }[] = [
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "telegram", icon: Send, label: "Telegram" },
  { key: "tiktok", icon: Sparkles, label: "TikTok" },
  { key: "youtube", icon: Youtube, label: "YouTube" },
  { key: "email", icon: Mail, label: "Email" },
];

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label + l.href}>
            <Link
              href={l.href}
              {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group inline-flex items-center text-sm text-foreground/80 transition-all duration-300 hover:translate-x-1 hover:text-primary hover:glow-primary"
            >
              <span className="mr-0 h-px w-0 bg-primary transition-all duration-300 group-hover:mr-2 group-hover:w-4" />
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer({ site, navLinks, developerLinks }: Props) {
  const siteName = site?.siteName ?? "Enouement 2K27";
  const tagline = site?.tagline ?? "";
  const footerText = site?.footerText ?? "";
  const socialLinks = site?.socialLinks ?? {};
  const devName = site?.devName || "Joseph James";
  const devRole = site?.devRole || "Full-Stack Developer";
  const devLink = site?.devLink || null;
  const countdownDate = site?.countdownDate;
  const countdownLabel = site?.countdownLabel || "Graduation Day";

  const exploreLinks = navLinks.slice(0, 6).map((l) => ({ label: l.label, href: l.href }));
  const moreLinks: { label: string; href: string; external?: boolean }[] = [
    { label: "Cinema", href: "/videos" },
    { label: "Batch Clothes", href: "/merch" },
    { label: "Admin", href: "/admin" },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border/60 bg-surface/40 pt-20 pb-10">
      {/* ambient gradient washes for cinematic depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, rgba(255,230,0,0.06), transparent 60%), radial-gradient(40% 60% at 80% 100%, rgba(0,200,83,0.06), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Giant cinematic wordmark — fills width */}
        <FooterCinematicWordmark className="mb-6" />

        {/* Marquee strip */}
        <Marquee
          text="CLASS OF 2027 · THE FINAL CHAPTER · ETHIOPIA · ENOUEMENT 2K27"
          duration={36}
          className="mb-16"
        />

        {/* Live countdown to graduation (compact) */}
        {countdownDate ? (
          <div className="mb-16 flex justify-center">
            <div className="max-w-xl">
              <Countdown date={new Date(countdownDate)} label={countdownLabel} />
            </div>
          </div>
        ) : null}

        {/* Middle link columns + dev credit */}
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand / dev credit */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight">
                {siteName}
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">{tagline}</p>

            <div className="mt-8">
              <DevCredit devName={devName} devRole={devRole} devLink={devLink} />
            </div>

            <div className="mt-8 flex items-center gap-3">
              {SOCIALS.map(({ key, icon: Icon, label }) => {
                const href = socialLinks?.[key];
                if (!href) return null;
                return (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="glass flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 hover:glow-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore */}
          <FooterLinkColumn title="Explore" links={exploreLinks} />

          {/* More */}
          <FooterLinkColumn title="More" links={moreLinks} />
        </div>

        {/* Developer link cards */}
        {developerLinks.length > 0 ? (
          <div className="mt-16">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
              <h3 className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                More from the developer
              </h3>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {developerLinks.map((link) => (
                <DeveloperLinkCard key={link.id} link={link} />
              ))}
            </div>
          </div>
        ) : null}

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>{footerText}</p>
          <p className="font-mono">
            © {year} · Made with{" "}
            <Heart className="inline h-3 w-3 fill-primary text-primary" /> by {devName}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
