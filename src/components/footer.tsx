"use client";

import Link from "next/link";
import { Instagram, Send, Youtube, Sparkles } from "lucide-react";

type Props = {
  siteName: string;
  tagline: string;
  footerText: string;
  socialLinks: Record<string, string>;
  navLinks: { label: string; href: string }[];
};

export function Footer({ siteName, tagline, footerText, socialLinks, navLinks }: Props) {
  const socials = [
    { key: "instagram", icon: Instagram, label: "Instagram" },
    { key: "telegram", icon: Send, label: "Telegram" },
    { key: "tiktok", icon: Sparkles, label: "TikTok" },
    { key: "youtube", icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="mt-auto border-t border-border/60 bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
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

            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ key, icon: Icon, label }) =>
                socialLinks?.[key] ? (
                  <a
                    key={key}
                    href={socialLinks[key]}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full glass transition hover:glow-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Explore
            </h4>
            <ul className="mt-4 space-y-2.5">
              {navLinks.slice(0, 6).map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-foreground/80 transition hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              More
            </h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/videos"
                  className="text-sm text-foreground/80 transition hover:text-primary"
                >
                  Cinema
                </Link>
              </li>
              <li>
                <Link
                  href="/merch"
                  className="text-sm text-foreground/80 transition hover:text-primary"
                >
                  Batch Clothes
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-sm text-foreground/80 transition hover:text-primary"
                >
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>{footerText}</p>
          <p className="font-mono">© 2027 · Made with 💛💚</p>
        </div>
      </div>
    </footer>
  );
}
