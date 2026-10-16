import { PageShell } from "@/components/page-shell";
import { Marquee } from "@/components/marquee";
import { MagneticButton } from "@/components/magnetic-button";
import { CountdownHero } from "@/components/graduation/countdown-hero";
import { Program } from "@/components/graduation/program";
import { WallOfSeniors } from "@/components/graduation/wall-of-seniors";
import { ThankYou } from "@/components/graduation/thank-you";
import { getGraduation, getStudents } from "@/lib/data";

export const metadata = {
  title: "Graduation — Enouement 2K27",
  description:
    "The Walk. The robe. The moment. Countdown to our graduation day, the program, and our featured seniors.",
};

export default async function GraduationPage() {
  const [graduation, students] = await Promise.all([
    getGraduation(),
    getStudents(),
  ]);

  const featured = students.filter((s) => s.featured);
  const countdownDate = graduation?.countdownDate
    ? graduation.countdownDate.toISOString()
    : null;

  return (
    <PageShell>
      <CountdownHero
        headline={graduation?.headline ?? "The Walk"}
        intro={
          graduation?.intro ??
          "Four years of laughter, tears, and growth — all leading to this single, unforgettable moment."
        }
        countdownDate={countdownDate}
      />

      <Marquee text="THE WALK · JUNE 2027" duration={28} />

      <Program
        program={(graduation?.program as any[]) ?? []}
      />

      <WallOfSeniors seniors={featured} />

      <ThankYou text={graduation?.thankYouText ?? null} />

      {/* CTA */}
      <section
        aria-label="Meet the whole batch"
        className="px-4 py-24 sm:px-6 md:py-32 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            The Whole Batch
          </p>
          <h2 className="mt-4 font-display text-4xl font-extrabold sm:text-5xl lg:text-6xl">
            Meet <span className="text-gradient">every face</span> of 2K27
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            These are the people who wrote this chapter with us. The full roster
            of seniors — featured, beloved, unforgettable.
          </p>
          <div className="mt-8 flex justify-center">
            <MagneticButton
              href="/seniors"
              className="h-12 rounded-full bg-primary px-8 font-display text-sm font-bold uppercase tracking-[0.15em] text-primary-foreground hover:glow-primary"
            >
              Meet the Batch
            </MagneticButton>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
