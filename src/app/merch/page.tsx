import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AnimatedText } from "@/components/animated-text";
import { Marquee } from "@/components/marquee";
import { MerchShowcase } from "@/components/merch/merch-showcase";
import { getMerch } from "@/lib/data";

export const metadata: Metadata = {
  title: "Merch",
  description:
    "The official batch clothes of Enouement 2K27 — hoodies, tees, and the memories stitched in.",
};

export default async function MerchPage() {
  const items = await getMerch();

  return (
    <PageShell>
      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div
          aria-hidden
          className="aurora -top-32 left-1/4 h-80 w-80 bg-primary/30"
        />
        <div
          aria-hidden
          className="aurora -top-20 right-0 h-72 w-72 bg-secondary/30"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Batch Clothes
          </p>
          <AnimatedText
            as="h1"
            text="Wear the Memory"
            className="mt-4 font-display font-extrabold text-5xl sm:text-7xl leading-[0.95] tracking-tight"
          />
          <p className="mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Stitched for the class of 2027. Pick your color, lock your size,
            and reserve before the deadline.
          </p>
        </div>
      </section>

      <Marquee text="Limited Edition" className="text-primary" />

      {/* SHOWCASE */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MerchShowcase items={items} />
        </div>
      </section>
    </PageShell>
  );
}
