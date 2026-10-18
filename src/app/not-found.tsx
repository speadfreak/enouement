import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { MagneticButton } from "@/components/magnetic-button";

export const metadata = {
  title: "Lost in the Memory — 404",
  description:
    "This page drifted off the timeline. Find your way back to the story of Enouement 2K27.",
};

export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-24">
      {/* Ambient aurora washes */}
      <div
        aria-hidden
        className="aurora"
        style={{
          width: 460,
          height: 460,
          top: "-15%",
          left: "-15%",
          background: "var(--primary)",
          opacity: 0.18,
        }}
      />
      <div
        aria-hidden
        className="aurora"
        style={{
          width: 520,
          height: 520,
          bottom: "-20%",
          right: "-15%",
          background: "var(--secondary)",
          opacity: 0.18,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          color: "var(--foreground)",
        }}
      />

      <div className="relative mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[0.65rem] uppercase tracking-[0.3em] text-primary sm:text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Lost frame
        </span>

        <p
          aria-hidden
          className="mt-6 font-display font-black leading-none text-gradient"
          style={{ fontSize: "clamp(5rem, 28vw, 11rem)" }}
        >
          404
        </p>

        <h1 className="mt-2 font-display text-3xl font-extrabold leading-[0.95] tracking-tight sm:text-5xl">
          Off the timeline.
        </h1>

        <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground sm:text-base">
          This page drifted out of frame — or never made it into the final cut.
          Let&apos;s get you back to the story of the Class of 2K27.
        </p>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <MagneticButton
            href="/"
            className="min-h-[44px] rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:glow-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </MagneticButton>
          <MagneticButton
            href="/story"
            strength={0.3}
            className="min-h-[44px] rounded-full glass px-7 py-3.5 text-sm font-semibold text-foreground hover:glow-primary"
          >
            <Compass className="mr-2 h-4 w-4" />
            Re-enter the story
          </MagneticButton>
        </div>

        <p className="mt-12 text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
          Enouement 2K27 · Ethiopia
        </p>
      </div>
    </main>
  );
}
