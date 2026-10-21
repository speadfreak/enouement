"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReduceEffectsToggle } from "@/components/reduce-effects-toggle";

type NavLink = { label: string; href: string; icon?: string };

export function Navbar({ links = [], logoUrl, siteName }: { links?: NavLink[]; logoUrl?: string | null; siteName?: string | null }) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  // `scrolled` is intentionally NOT React state — toggling it on every scroll
  // event would re-render the entire Navbar (and its motion.header child) on
  // every frame. Instead we mutate the header's classList directly. The
  // `transition-all duration-300` on the header keeps the visual change smooth.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const on = () => {
      const s = window.scrollY > 40;
      header.classList.toggle("glass-strong", s);
      header.classList.toggle("border-b", s);
      header.classList.toggle("border-border/60", s);
      header.classList.toggle("bg-transparent", !s);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        ref={headerRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-transparent"
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 safe-t">
          {/* Logo — admin-uploaded logo or default sparkles */}
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="Home">
            {logoUrl ? (
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full shadow-lg">
                <Image src={logoUrl} alt={siteName || "Énouement 2K27 logo"} fill sizes="36px" className="object-cover" />
              </span>
            ) : (
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
                <Sparkles className="h-4 w-4" />
                <span className="absolute inset-0 animate-pulse-glow rounded-full" />
              </span>
            )}
            <span className="font-display text-base font-extrabold tracking-tight sm:text-lg">
              <span className="hidden min-[400px]:inline">ÉNOUEMENT</span>
              <span className="min-[400px]:hidden">E2</span>
              <span className="text-primary">2K27</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition hover:text-foreground ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-foreground/10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right controls — touch targets ≥44px, never collide */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Reduce effects — only on larger screens (tablet+), hidden on phones to save space */}
            <ReduceEffectsToggle className="hidden md:flex" />
            <ThemeToggle />
            {/* Hamburger — 44px touch target, visible below lg (1024px) */}
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full glass lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile fullscreen menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col bg-background lg:hidden"
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Smoky backdrop for the mobile menu */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(60% 50% at 20% 0%, rgba(255,230,0,0.15), transparent), radial-gradient(50% 40% at 80% 100%, rgba(0,200,83,0.15), transparent)",
              }}
            />
            <div className="relative flex h-16 items-center justify-between px-4 safe-t">
              <span className="font-display text-lg font-extrabold">
                ÉNOUEMENT<span className="text-primary">2K27</span>
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full glass"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex flex-1 flex-col justify-center gap-1 overflow-y-auto px-6 py-4"
              style={{ overscrollBehavior: "contain" }}
              data-lenis-prevent
            >
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={l.href}
                    className="flex min-h-[52px] items-center border-b border-border/40 py-3 font-display text-3xl font-bold tracking-tight sm:text-4xl"
                  >
                    <span className="mr-3 text-xs text-primary">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="relative flex items-center justify-between gap-3 px-6 pb-8 pt-4 safe-b">
              <div className="flex items-center gap-2">
                <ReduceEffectsToggle />
                <ThemeToggle />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Class of 2027 · Ethiopia
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
