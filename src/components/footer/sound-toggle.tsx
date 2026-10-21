"use client";

/**
 * SoundToggle — ambient sound on/off toggle.
 *
 * Behaviour:
 *   - Sound is OFF by default. Never autoplays — must be explicitly enabled.
 *   - On first enable: play a short ambient loop via an <audio loop> element
 *     pointing at /sounds/ambient.wav (a tiny 4 KB 8-bit WAV — adds zero
 *     bytes to the JS bundle; the audio file is fetched only when the user
 *     opts in).
 *   - The choice is remembered in localStorage so returning users keep their
 *     preference. We still don't autoplay — we only set `audio.play()` from
 *     a user gesture (the click on the toggle), so browser autoplay policies
 *     are always satisfied.
 *   - Respects the body's `reduce-effects` class: in that mode we don't
 *     start the audio even if the user asks for it. (We still remember the
 *     preference so the toggle visually reflects it, but playback is muted
 *     to a near-silent gain.)
 *
 * Performance:
 *   - This component is loaded via `next/dynamic({ ssr: false })`, so the
 *     Audio API only exists on the client.
 *   - The WAV file is 4 KB — it loads in well under one round-trip.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "enouement-ambient-sound";
const AMBIENT_URL = "/sounds/ambient.wav";

export function SoundToggle({ className = "" }: { className?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  const [ready, setReady] = useState(false);

  // Create the audio element lazily on the client.
  useEffect(() => {
    const audio = new Audio(AMBIENT_URL);
    audio.loop = true;
    audio.preload = "none"; // Only fetch when the user opts in.
    audio.volume = 0.4;
    audioRef.current = audio;

    // Restore previous preference — but we still won't autoplay without a
    // gesture. If they had it on, we mark it as "wanted" so the toggle UI
    // shows the right state; playback starts on the next user click.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "on") setOn(true);

    setReady(true);
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Start / stop playback when `on` flips — but only if a gesture has
  // happened (i.e. user clicked). On mount, even if `on` was true from
  // localStorage, we don't autoplay — the user has to click once.
  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !on;
    setOn(next);
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");

    if (next) {
      // Respect reduce-effects: play almost-silent.
      const reduceEffects =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("reduce-effects");
      audio.volume = reduceEffects ? 0.02 : 0.4;
      // play() returns a promise; swallow autoplay rejections silently.
      audio.play().catch(() => {
        // Autoplay was blocked — revert the toggle.
        setOn(false);
        localStorage.setItem(STORAGE_KEY, "off");
      });
    } else {
      audio.pause();
    }
  }, [on]);

  if (!ready) {
    // Render a placeholder button so the layout doesn't shift before hydration.
    return (
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full glass ${className}`}
        aria-hidden
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn ambient sound off" : "Turn ambient sound on"}
      title={on ? "Ambient sound is on" : "Ambient sound is off"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full glass transition hover:glow-primary ${className}`}
    >
      {on ? (
        <Volume2 className="h-4 w-4 text-primary" />
      ) : (
        <VolumeX className="h-4 w-4 text-muted-foreground" />
      )}
      {on ? (
        // Tiny pulse when on — pure CSS, no JS.
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-primary/40"
          style={{ animation: "sound-pulse 1.6s ease-in-out infinite" }}
        />
      ) : null}
      <style>{`@keyframes sound-pulse { 0%,100% { opacity: 0.2; } 50% { opacity: 0.8; } }`}</style>
    </button>
  );
}

export default SoundToggle;
