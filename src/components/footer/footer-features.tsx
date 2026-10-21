"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

const MemoryWall = dynamic(() => import("@/components/footer/memory-wall").then((m) => m.MemoryWall), { ssr: false });
const SharePanel = dynamic(() => import("@/components/footer/share-panel").then((m) => m.SharePanel), { ssr: false });
const InstallButton = dynamic(() => import("@/components/footer/install-button").then((m) => m.InstallButton), { ssr: false });
const SoundToggle = dynamic(() => import("@/components/footer/sound-toggle").then((m) => m.SoundToggle), { ssr: false });
const EasterEgg = dynamic(() => import("@/components/footer/easter-egg").then((m) => m.EasterEgg), { ssr: false });
const LiveCounter = dynamic(() => import("@/components/footer/live-counter").then((m) => m.LiveCounter), { ssr: false });

type Props = {
  site: {
    memoryWallEnabled?: boolean;
    shareEnabled?: boolean;
    installEnabled?: boolean;
    soundEnabled?: boolean;
    easterEggEnabled?: boolean;
    liveCounterEnabled?: boolean;
  } | null;
  visitCount: number;
};

export function FooterFeatures({ site, visitCount }: Props) {
  return (
    <>
      {/* Feature controls row */}
      <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border/40 pt-6 sm:justify-between">
        {site?.liveCounterEnabled ? (
          <Suspense fallback={null}>
            <LiveCounter count={visitCount} />
          </Suspense>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {site?.shareEnabled ? (
            <Suspense fallback={null}>
              <SharePanel />
            </Suspense>
          ) : null}
          {site?.installEnabled ? (
            <Suspense fallback={null}>
              <InstallButton />
            </Suspense>
          ) : null}
          {site?.soundEnabled ? (
            <Suspense fallback={null}>
              <SoundToggle />
            </Suspense>
          ) : null}
          {site?.easterEggEnabled ? (
            <Suspense fallback={null}>
              <EasterEgg />
            </Suspense>
          ) : null}
        </div>
      </div>

      {/* Memory wall */}
      {site?.memoryWallEnabled ? (
        <div className="border-t border-border/40 pt-6">
          <Suspense fallback={null}>
            <MemoryWall />
          </Suspense>
        </div>
      ) : null}
    </>
  );
}
