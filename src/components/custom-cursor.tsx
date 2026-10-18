"use client";

/**
 * CustomCursor — a fixed-position dot + lerped ring.
 *
 * Performance notes:
 *
 *   • One rAF loop only. It writes directly to `ref.style.transform` —
 *     never to React state — so a mousemove storm never triggers re-renders.
 *   • The ring is driven by an exponential lerp toward the mouse, so it
 *     "trails" the dot. The rAF loop auto-stops once the ring has caught up
 *     to the pointer (within 0.5px) and is restarted on the next mousemove.
 *     → zero CPU while the pointer is idle.
 *   • Hover / press state is communicated to the ring via `transform: scale()`
 *     (composed into the same matrix) and `background` only — never via
 *     width/height/top/left, which would trigger layout + paint instead of
 *     compositor-only work.
 *   • Only mounts its event listeners on devices that match
 *     `(hover: hover) and (pointer: fine)`. Touch / coarse-pointer devices
 *     skip the effect entirely (and the CSS hides the dots via
 *     `@media (hover: none)` in globals.css).
 */

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Coarse-pointer + touch devices get the native cursor only.
    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = 0,
      my = 0, // pointer position
      rx = 0,
      ry = 0; // ring position (lerped)
    let targetScale = 1,
      curScale = 1; // hover / press scale, also lerped
    let hovering = false;
    let down = false;
    let raf = 0;

    const writeRing = () => {
      ring.style.transform =
        `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${curScale.toFixed(3)})`;
    };

    const writeRingStyle = () => {
      ring.style.background = hovering
        ? "color-mix(in srgb, var(--primary) 18%, transparent)"
        : "transparent";
    };

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      curScale += (targetScale - curScale) * 0.22;

      writeRing();

      const settled =
        Math.abs(mx - rx) < 0.5 &&
        Math.abs(my - ry) < 0.5 &&
        Math.abs(targetScale - curScale) < 0.01;
      if (settled) {
        raf = 0;
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const ensureRaf = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // The dot tracks the pointer 1:1, no lerp.
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ensureRaf();
    };

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const isHover = !!t?.closest(
        "a, button, [data-cursor='hover'], input, textarea, select",
      );
      if (isHover !== hovering) {
        hovering = isHover;
        targetScale = down ? 0.8 : hovering ? 1.47 : 1;
        writeRingStyle();
        ensureRaf();
      }
    };

    const downHandler = () => {
      down = true;
      targetScale = 0.8;
      ensureRaf();
    };
    const upHandler = () => {
      down = false;
      targetScale = hovering ? 1.47 : 1;
      ensureRaf();
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", downHandler);
    window.addEventListener("mouseup", upHandler);

    // Kick the loop once so the ring snaps to the pointer on first move.
    ensureRaf();

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", downHandler);
      window.removeEventListener("mouseup", upHandler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </>
  );
}

export default CustomCursor;
