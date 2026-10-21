import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { PageHeader, StatCard } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Images, CalendarDays, Megaphone, Mail, Video, Users2, Plus, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [posts, students, events, announcements, unreadMessages, videos, albums, hero, auditLogs] =
    await Promise.all([
      db.post.count(),
      db.student.count(),
      db.event.count(),
      db.announcement.count(),
      db.contactMessage.count({ where: { handled: false } }),
      db.video.count(),
      db.album.count(),
      db.heroMedia.count(),
      db.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }),
    ]);

  const stats = [
    { label: "Posts", value: posts, icon: <Sparkles className="size-5" />, href: "/admin/posts" },
    { label: "Students", value: students, icon: <Users2 className="size-5" />, href: "/admin/seniors" },
    { label: "Events", value: events, icon: <CalendarDays className="size-5" />, href: "/admin/events" },
    { label: "Albums", value: albums, icon: <Images className="size-5" />, href: "/admin/albums" },
    { label: "Videos", value: videos, icon: <Video className="size-5" />, href: "/admin/videos" },
    { label: "Announcements", value: announcements, icon: <Megaphone className="size-5" />, href: "/admin/announcements" },
    { label: "Unread Messages", value: unreadMessages, icon: <Mail className="size-5" />, href: "/admin/messages", highlight: unreadMessages > 0 },
    { label: "Hero Slides", value: hero, icon: <Sparkles className="size-5" />, href: "/admin/hero" },
  ];

  const quickActions = [
    { label: "New Post", href: "/admin/posts" },
    { label: "New Announcement", href: "/admin/announcements" },
    { label: "New Event", href: "/admin/events" },
    { label: "New Senior", href: "/admin/seniors" },
    { label: "New Video", href: "/admin/videos" },
    { label: "New Album", href: "/admin/albums" },
    { label: "Edit Site Settings", href: "/admin/settings" },
    { label: "Edit Graduation", href: "/admin/graduation" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name || user?.email}. Here's what's happening with Énouement 2K27 today.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="block">
            <StatCard
              label={s.label}
              value={s.value}
              icon={s.icon}
              hint={s.highlight ? "Needs attention" : "View all →"}
              className={s.highlight ? "ring-1 ring-primary/40 glow-primary" : "hover:ring-1 hover:ring-border"}
            />
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Recent Activity</CardTitle>
            <CardDescription>Last actions in the admin console</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {auditLogs.map((log) => (
                  <li key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-secondary/15 text-secondary">
                      <Clock className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">{log.action}</span>{" "}
                        <span className="text-muted-foreground">on</span>{" "}
                        <Badge variant="outline" className="text-[10px]">{log.entity}</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.user?.email ?? "system"} · {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="ghost" size="sm" className="mt-3">
              <Link href="/admin/audit">
                View full audit log <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display">Quick Actions</CardTitle>
            <CardDescription>Jump straight to common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((a) => (
                <Button key={a.label} asChild variant="outline" className="justify-start text-xs">
                  <Link href={a.href}>
                    <Plus className="size-3.5" />
                    {a.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
