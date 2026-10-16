import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Badge } from "@/components/ui/badge";
import { SmartImage } from "@/components/smart-image";
import { getAnnouncement, getAnnouncements } from "@/lib/data";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnnouncement(slug);
  if (!a) return { title: "Not found" };
  return { title: a.title, description: a.excerpt ?? a.title };
}

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function AnnouncementDetailPage({ params }: Params) {
  const { slug } = await params;
  const item = await getAnnouncement(slug);
  if (!item) notFound();

  const all = await getAnnouncements();
  const others = all.filter((a) => a.slug !== item.slug).slice(0, 3);

  const d = new Date(item.publishAt);

  return (
    <PageShell>
      <article className="relative pb-24">
        {/* Header */}
        <header className="relative overflow-hidden pt-28 pb-10 md:pt-36">
          <div
            aria-hidden
            className="aurora -top-32 right-0 h-80 w-80 bg-primary/30"
          />
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <Link
              href="/announcements"
              className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
              Back to news
            </Link>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{item.category}</Badge>
              {item.urgent && (
                <Badge className="bg-destructive text-white">Urgent</Badge>
              )}
              {item.pinned && <Badge variant="outline">Pinned</Badge>}
            </div>

            <AnimatedText
              as="h1"
              text={item.title}
              className="mt-4 font-display font-extrabold text-4xl sm:text-6xl leading-[0.95] tracking-tight"
            />

            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="size-4 text-primary" />
              {MONTHS_LONG[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
            </div>
          </div>
        </header>

        {/* Cover */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl gradient-border">
            <SmartImage
              src={item.coverUrl ?? "/announcements/placeholder.jpg"}
              alt={item.title}
              fill
              seed={item.slug}
              fallbackLabel={item.title}
              className="object-cover"
              priority
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Body */}
        <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-6 lg:px-8">
          {item.excerpt && (
            <p className="font-display text-xl leading-relaxed text-foreground/90 sm:text-2xl">
              {item.excerpt}
            </p>
          )}
          <div className="mt-6 leading-relaxed text-muted-foreground [&>h1]:font-display [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:text-foreground [&>h1]:mt-8 [&>h1]:mb-3 [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-6 [&>h2]:mb-2 [&>h3]:font-display [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-foreground [&>h3]:mt-5 [&>h3]:mb-2 [&>p]:my-4 [&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-6 [&>blockquote]:border-l-2 [&>blockquote]:border-primary [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-foreground/80 [&>a]:text-primary [&>a]:underline [&>a]:underline-offset-4 [&>code]:rounded [&>code]:bg-surface [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:text-sm [&>strong]:text-foreground [&>strong]:font-semibold">
            <ReactMarkdown>{item.body}</ReactMarkdown>
          </div>

          <div className="mt-10">
            <Badge variant="outline" className="gap-1.5">
              <Tag className="size-3.5 text-primary" />
              {item.category}
            </Badge>
          </div>
        </div>

        {/* Others */}
        {others.length > 0 && (
          <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              <span className="text-gradient">More</span> stories
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((a) => {
                const dd = new Date(a.publishAt);
                return (
                  <Link
                    key={a.id}
                    href={`/announcements/${a.slug}`}
                    className="group glass flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:glow-primary"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SmartImage
                        src={a.coverUrl ?? "/announcements/placeholder.jpg"}
                        alt={a.title}
                        fill
                        seed={a.slug}
                        fallbackLabel={a.title}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="mb-2">
                        {a.category}
                      </Badge>
                      <h3 className="font-display text-lg font-bold leading-tight">
                        {a.title}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {MONTHS_LONG[dd.getMonth()]} {dd.getDate()},{" "}
                        {dd.getFullYear()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </PageShell>
  );
}
