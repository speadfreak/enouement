"use client";

/**
 * MemoryWall — guestbook form + slow scrolling marquee of approved messages.
 *
 * Layout:
 *   - "Leave a message for the batch" header
 *   - Name input (optional, max 50), Message textarea (required, max 140, char counter)
 *   - Honeypot field (hidden, must stay empty)
 *   - Submit button (disabled while submitting, shows spinner)
 *   - Below the form: a calm CSS marquee of latest approved messages.
 *
 * API:
 *   GET  /api/memory-wall            → approved (public)
 *   POST /api/memory-wall            → submit { name?, message, honeypot? }
 *
 * Performance:
 *   - This whole component is loaded via `next/dynamic({ ssr: false })` so it
 *     never enters the first-load bundle.
 *   - The marquee is pure CSS (transform: translateX), no JS per-frame.
 *   - Fetches are aborted via AbortController on unmount.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Quote } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type ApprovedMessage = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const MAX_NAME = 50;
const MAX_MSG = 140;

const MARQUEE_CSS = `
@keyframes mw-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.mw-track {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  animation: mw-marquee 60s linear infinite;
  will-change: transform;
}
.mw-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) {
  .mw-track { animation-duration: 200s; }
}
.reduce-effects .mw-track { animation: none; }
`;

export function MemoryWall() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // must stay empty
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ApprovedMessage[]>([]);

  // Fetch approved messages on mount.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/memory-wall?status=approved", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (Array.isArray(data?.items)) setItems(data.items);
      })
      .catch(() => {
        /* Silent — marquee is decorative. */
      });
    return () => ctrl.abort();
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = message.trim();
      if (!trimmed || submitting) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/memory-wall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            message: trimmed,
            honeypot,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const msg =
            data?.error ||
            (res.status === 429
              ? "You're posting too quickly. Wait a minute."
              : res.status === 422
                ? "That message contains content we can't accept."
                : "Could not submit. Try again.");
          toast.error(msg);
          return;
        }
        toast.success(
          "Message submitted! It will appear after admin approval."
        );
        setName("");
        setMessage("");
        setHoneypot("");
      } catch {
        toast.error("Network error. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [message, name, honeypot, submitting]
  );

  // Duplicate the items list so the marquee can loop seamlessly.
  const loop = items.length > 0 ? [...items, ...items] : [];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MARQUEE_CSS }} />
      <section
        aria-label="Memory wall"
        className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">
            Memory Wall
          </span>
          <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Leave a message for the batch.
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            A wish, a memory, a goodbye. Approved messages drift across the
            wall below.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {/* Honeypot — visually hidden, real users never see it. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label htmlFor="mw-website">Website (do not fill)</label>
              <input
                id="mw-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <Input
                value={name}
                onChange={(e) =>
                  setName(e.target.value.slice(0, MAX_NAME))
                }
                maxLength={MAX_NAME}
                placeholder="Your name (optional)"
                aria-label="Your name (optional)"
                className="bg-input/40"
              />
            </div>

            <div>
              <Textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value.slice(0, MAX_MSG))
                }
                maxLength={MAX_MSG}
                placeholder="Share a memory, a wish, a goodbye…"
                aria-label="Your message"
                rows={3}
                className="bg-input/40 resize-none"
                required
              />
              <div className="mt-1.5 flex items-center justify-end">
                <span
                  className={`text-xs tabular-nums ${
                    message.length > MAX_MSG - 20
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {message.length}/{MAX_MSG}
                </span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting || !message.trim()}
              className="w-full gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Sending…" : "Leave a message"}
            </Button>
          </form>

          {/* Calm scrolling marquee of approved messages. */}
          {items.length > 0 ? (
            <div className="mt-8">
              <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                From the wall
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-surface/30 py-3">
                <div className="mw-track">
                  {loop.map((m, i) => (
                    <span
                      key={`${m.id}-${i}`}
                      className="mx-6 inline-flex max-w-md items-start gap-2 text-sm text-foreground/80"
                    >
                      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      <span className="whitespace-normal">
                        {m.message}
                        <span className="ml-2 text-muted-foreground">
                          — {m.name || "Anonymous"}
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
                {/* Edge fade masks */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-surface to-transparent"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent"
                />
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default MemoryWall;
