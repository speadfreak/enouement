"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReduceEffectsToggle } from "@/components/reduce-effects-toggle";

type NavLink = { label: string; href: string; icon?: string };

export function Navbar({ links = [] }: { links?: NavLink[] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on);
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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-strong border-b border-border/60" : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 safe-t">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2" aria-label="Home">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg">
              <Sparkles className="h-4 w-4" />
              <span className="absolute inset-0 animate-pulse-glow rounded-full" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              ENOUEMENT<span className="text-primary">2K27</span>
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

          {/* Right */}
          <div className="flex items-center gap-2">
            <ReduceEffectsToggle className="hidden sm:flex" />
            <ThemeToggle />
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full glass lg:hidden"
            >
              <Menu className="h-4 w-4" />
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
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-display text-lg font-extrabold">
                ENOUEMENT<span className="text-primary">2K27</span>
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full glass"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-1 px-6">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={l.href}
                    className="block border-b border-border/40 py-4 font-display text-4xl font-bold tracking-tight"
                  >
                    <span className="mr-3 text-sm text-primary">0{i + 1}</span>
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="px-6 pb-10 text-xs uppercase tracking-widest text-muted-foreground">
              Class of 2027 · Ethiopia
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

