import { PageShell } from "@/components/page-shell";
import { Timeline } from "@/components/story/timeline";
import { getStoryChapters } from "@/lib/data";

// ISR: regenerate this page at most every 60s. Cached reads in
// getStoryChapters (tag "story", revalidate 300) back the actual data.
export const revalidate = 60;

export const metadata = {
  title: "Our Story — Énouement 2K27",
  description:
    "The journey to 2K27 — a cinematic scroll through the chapters that shaped our senior batch.",
};

export default async function StoryPage() {
  const chapters = await getStoryChapters();

  return (
    <PageShell>
      <Timeline chapters={chapters} />
    </PageShell>
  );
}
