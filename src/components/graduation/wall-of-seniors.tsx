"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SmartImage } from "@/components/smart-image";
import { AnimatedText } from "@/components/animated-text";

export type SeniorT = {
  id: string;
  name: string;
  photoUrl: string | null;
  quote: string | null;
  futurePlan: string | null;
  nickname: string | null;
  section: string | null;
  club: string | null;
};

type Props = {
  seniors: SeniorT[];
};

export function WallOfSeniors({ seniors }: Props) {
  const [active, setActive] = useState<SeniorT | null>(null);

  if (!seniors || seniors.length === 0) return null;

  return (
    <section
      aria-label="Wall of seniors"
      className="px-4 py-24 sm:px-6 md:py-32 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">
            Featured Seniors
          </p>
          <AnimatedText
            as="h2"
            text="The Faces We'll Miss"
            className="mt-4 font-display text-4xl font-extrabold sm:text-5xl lg:text-6xl"
          />
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            A few of the people who defined our batch. Tap any card to step
            closer.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {seniors.map((s, i) => (
            <SeniorCard
              key={s.id}
              senior={s}
              index={i}
              onClick={() => setActive(s)}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl border-border p-0 sm:max-w-3xl">
          <DialogTitle className="sr-only">{active?.name}</DialogTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative aspect-[3/4] overflow-hidden sm:aspect-auto">
              {active ? (
                <SmartImage
                  src={active.photoUrl ?? ""}
                  alt={active.name}
                  fill
                  wrapperClassName="absolute inset-0"
                  className="object-cover"
                  seed={active.id}
                  fallbackLabel={active.name}
                />
              ) : null}
            </div>
            <div className="flex flex-col gap-4 p-6 sm:p-8">
              <div>
                {active?.nickname ? (
                  <p className="text-xs uppercase tracking-[0.25em] text-secondary">
                    “{active.nickname}”
                  </p>
                ) : null}
                <h3 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">
                  {active?.name}
                </h3>
              </div>

              {active?.quote ? (
                <blockquote className="border-l-2 border-primary pl-4 text-base text-foreground/90 sm:text-lg">
                  “{active.quote}”
                </blockquote>
              ) : null}

              <div className="space-y-3 text-sm sm:text-base">
                {active?.futurePlan ? (
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                      Next Stop
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {active.futurePlan}
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-4">
                  {active?.section ? (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                        Section
                      </p>
                      <p className="mt-0.5 font-display font-bold text-primary">
                        {active.section}
                      </p>
                    </div>
                  ) : null}
                  {active?.club ? (
                    <div>
                      <p className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">
                        Club
                      </p>
                      <p className="mt-0.5 font-medium text-foreground">
                        {active.club}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function SeniorCard({
  senior,
  index,
  onClick,
}: {
  senior: SeniorT;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.6, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group relative block overflow-hidden rounded-2xl border border-border text-left transition-shadow duration-300 hover:glow-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={`View profile of ${senior.name}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <SmartImage
          src={senior.photoUrl ?? ""}
          alt={senior.name}
          fill
          wrapperClassName="absolute inset-0"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          seed={senior.id}
          fallbackLabel={senior.name}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {senior.nickname ? (
          <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-primary-foreground">
            {senior.nickname}
          </span>
        ) : null}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h3 className="font-display text-lg font-extrabold leading-tight sm:text-xl">
          {senior.name}
        </h3>
        {senior.quote ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
            “{senior.quote}”
          </p>
        ) : null}
        {senior.futurePlan ? (
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.2em] text-secondary">
            {senior.futurePlan}
          </p>
        ) : null}
      </div>

      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-primary/0 transition group-hover:ring-primary/30" />
    </motion.button>
  );
}
