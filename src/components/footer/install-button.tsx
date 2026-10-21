"use client";

/**
 * InstallButton — PWA install prompt capture + iOS hint.
 *
 * Behaviour:
 *   - On Chromium-based browsers (Chrome/Edge Android, desktop PWA), we
 *     capture the global `beforeinstallprompt` event in a ref. Once captured,
 *     we render an "Install Énouement" button. Clicking it calls
 *     `deferredPrompt.prompt()`, then reads `userChoice`. After choice we
 *     dismiss the prompt so it doesn't show again.
 *   - On iOS Safari we cannot trigger an install programmatically, so we
 *     render a hint with a tap-target that explains how to "Add to Home
 *     Screen".
 *   - On unsupported browsers, we render nothing.
 *
 * Performance:
 *   - This component is `next/dynamic({ ssr: false })` from the footer, so
 *     it only loads in the browser. The event listener is added lazily on
 *     mount and removed on unmount.
 *   - The captured prompt is held in a `ref` so we don't trigger a re-render
 *     on capture — only when we set `promptable=true`.
 */

import { useEffect, useRef, useState } from "react";
import { Download, Share, Plus, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  // iPadOS 13+ reports as Mac, so also check for touch + Mac.
  const isIPad =
    /Macintosh/i.test(ua) &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  const isStandalone =
    typeof window !== "undefined" &&
    (window.navigator as any).standalone === true;
  return (isIOS || isIPad) && !isStandalone;
}

export function InstallButton() {
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [promptable, setPromptable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    setIsIOS(detectIOS());

    function onPrompt(e: Event) {
      e.preventDefault();
      deferredRef.current = e as BeforeInstallPromptEvent;
      setPromptable(true);
    }
    function onInstalled() {
      deferredRef.current = null;
      setPromptable(false);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const p = deferredRef.current;
    if (!p) return;
    try {
      await p.prompt();
      const choice = await p.userChoice;
      if (choice.outcome === "accepted") {
        // Hide immediately — they took the action.
        setPromptable(false);
      }
      deferredRef.current = null;
    } catch {
      /* Silent — the browser may have blocked the prompt. */
    }
  };

  if (!promptable && !isIOS) return null;

  if (promptable) {
    return (
      <Button
        type="button"
        onClick={handleInstall}
        variant="outline"
        size="sm"
        className="gap-2 rounded-full border-primary/40 hover:bg-primary hover:text-primary-foreground"
      >
        <Download className="h-4 w-4" />
        Install Énouement
      </Button>
    );
  }

  // iOS hint.
  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setHintOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/40 px-4 text-sm font-medium transition hover:bg-primary hover:text-primary-foreground"
      >
        <Plus className="h-4 w-4" />
        Add to Home Screen
      </button>
      {hintOpen ? (
        <div className="glass max-w-xs rounded-xl p-3 text-xs text-muted-foreground">
          Tap the <Share className="inline h-3 w-3 align-text-bottom" /> Share
          button in Safari's toolbar, then choose{" "}
          <span className="font-medium text-foreground">
            “Add to Home Screen”
          </span>{" "}
          <Home className="inline h-3 w-3 align-text-bottom" />.
        </div>
      ) : null}
    </div>
  );
}

export default InstallButton;
