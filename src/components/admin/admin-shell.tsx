"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Settings,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  Images,
  Shirt,
  Megaphone,
  CalendarDays,
  GraduationCap,
  Users2,
  Video,
  Mail,
  ScrollText,
  LogOut,
  Menu,
  Home,
  Moon,
  Sun,
  ExternalLink,
  PanelTop,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Role } from "@prisma/client";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  superOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
  { href: "/admin/hero", label: "Hero", icon: ImageIcon },
  { href: "/admin/story", label: "Story", icon: BookOpen },
  { href: "/admin/posts", label: "Moments", icon: Sparkles },
  { href: "/admin/albums", label: "Gallery", icon: Images },
  { href: "/admin/merch", label: "Merch", icon: Shirt },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/graduation", label: "Graduation", icon: GraduationCap },
  { href: "/admin/seniors", label: "Seniors", icon: Users2 },
  { href: "/admin/videos", label: "Videos", icon: Video },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/footer", label: "Footer & Developer", icon: PanelTop },
  { href: "/admin/users", label: "Users", icon: ScrollText, superOnly: true },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const items = NAV.filter((n) => !n.superOnly || role === Role.SUPER_ADMIN);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname?.startsWith(href);

  const onSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/admin/login");
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground font-display font-bold">
            E2
          </div>
          <div className="leading-none">
            <p className="font-display text-base font-bold tracking-tight">ÉNOUEMENT</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">2K27</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
              )}
            >
              <Icon className={cn("size-4", active ? "text-primary" : "group-hover:text-foreground")} />
              <span className="flex-1">{n.label}</span>
              {n.superOnly ? (
                <Badge variant="outline" className="border-primary/40 text-primary text-[9px]">
                  SUPER
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="mb-2 flex items-center gap-2 px-2">
          <div className="grid size-8 place-items-center rounded-full bg-secondary/15 text-secondary text-xs font-bold">
            {(email?.[0] || "A").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{email}</p>
            <Badge variant="outline" className={cn("mt-0.5 text-[9px]", role === "SUPER_ADMIN" ? "border-primary text-primary" : "")}>
              {role}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="glass hidden w-64 shrink-0 border-r border-border/60 lg:block">
        <div className="sticky top-0 h-[100dvh]">{Sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 px-3 sm:px-5">
          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <SheetClose className="hidden" />
              {Sidebar}
            </SheetContent>
          </Sheet>

          <div className="hidden flex-1 sm:block">
            <p className="font-display text-sm font-semibold tracking-tight">
              ÉNOUEMENT <span className="text-primary">2K27</span> Admin
            </p>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/">
                <Home className="size-4" />
                <span className="hidden sm:inline">Site</span>
                <ExternalLink className="size-3 opacity-50" />
              </Link>
            </Button>
            <div className="ml-1 hidden items-center gap-2 border-l border-border/60 pl-3 sm:flex">
              <div className="grid size-7 place-items-center rounded-full bg-secondary/15 text-secondary text-[11px] font-bold">
                {(email?.[0] || "A").toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-medium">{email}</p>
                <Badge variant="outline" className={cn("text-[9px]", role === "SUPER_ADMIN" ? "border-primary text-primary" : "")}>
                  {role}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={onSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <footer className="mt-auto border-t border-border/60 px-4 py-3 text-center text-[11px] text-muted-foreground sm:px-6">
          ÉNOUEMENT 2K27 · Admin Console · <span className="text-primary/70">noindex</span>
        </footer>
      </div>
    </div>
  );
}
