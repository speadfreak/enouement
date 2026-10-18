"use client";

/**
 * DeveloperLinkCard — premium "More from the developer" card.
 *
 * Visual stack:
 *   ┌────────────────────────────────────────────┐
 *   │ (rotating gradient border — conic spin)    │
 *   │  ┌──────────────────────────────────────┐  │
 *   │  │ [icon/logo]   Title (bold)          │  │
 *   │  │              Tagline (muted)         │  │
 *   │  │                                   │  │
 *   │  │              [Visit →]              │  │
 *   │  │  (spotlight follows cursor)       │  │
 *   │  └──────────────────────────────────────┘  │
 *   └────────────────────────────────────────────┘
 *
 * Behaviours:
 *   • Rotating gradient border — a conic-gradient layer that spins inside
 *     an `overflow:hidden` wrapper; an inner content card covers everything
 *     except a 1px ring, so only the spinning ring is visible.
 *   • Hover spotlight — radial gradient follows the cursor (framer-motion
 *     `useMotionTemplate`).
 *   • Hover tilt — rotateX/rotateY from cursor position (±6deg, useSpring).
 *   • Logo via SmartImage (with gradient fallback) or a lucide icon
 *     (`GraduationCap`) when no logoUrl is set.
 *   • "Visit →" button uses MagneticButton and opens in a new tab.
 *   • Only renders if `url` is https (admin has already validated, but the
 *     card double-checks to be safe).
 */

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { GraduationCap, ArrowUpRight } from "lucide-react";
import { MagneticButton } from "@/components/magnetic-button";
import { SmartImage } from "@/components/smart-image";
import type { DeveloperLink } from "@prisma/client";

const CSS = `
@keyframes dlc-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.dlc-card {
  position: relative;
  display: block;
  width: 100%;
  border-radius: 1rem;
  padding: 1px;                 /* the visible "border" thickness */
  overflow: hidden;
  isolation: isolate;
  /* fallback background gradient (visible before JS / reduced motion) */
  background: linear-gradient(135deg, rgba(255,230,0,0.6), rgba(0,200,83,0.4) 50%, rgba(185,246,202,0.5));
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.dlc-spin-layer {
  position: absolute;
  inset: -60%;
  z-index: 0;
  background: conic-gradient(
    from 0deg,
    #ffe600 0deg,
    #00c853 90deg,
    #b9f6ca 180deg,
    #ffe600 270deg,
    #ffe600 360deg
  );
  animation: dlc-spin 5s linear infinite;
  will-change: transform;
}

.dlc-inner {
  position: relative;
  z-index: 1;
  border-radius: calc(1rem - 1px);
  background: linear-gradient(180deg, rgba(11,19,14,0.96), rgba(5,10,7,0.98));
  overflow: hidden;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-height: 220px;
}

.dlc-spotlight {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.dlc-card[data-hovered="true"] .dlc-spotlight {
  opacity: 1;
}

.dlc-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  height: 100%;
  flex: 1;
}

.dlc-icon-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dlc-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(255,230,0,0.18), rgba(0,200,83,0.12));
  border: 1px solid rgba(255,230,0,0.18);
  color: #ffe600;
  flex-shrink: 0;
  overflow: hidden;
  position: relative;
}

.dlc-title {
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  color: rgba(243, 255, 232, 0.96);
  line-height: 1.15;
}

.dlc-tagline {
  font-size: 0.825rem;
  line-height: 1.5;
  color: rgba(243, 255, 232, 0.62);
  flex: 1;
}

.dlc-visit {
  align-self: flex-start;
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border-radius: 0.6rem;
  background: linear-gradient(135deg, #ffe600, #00c853);
  color: #050a07;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  text-decoration: none;
  position: relative;
  will-change: transform;
  transition: filter 0.2s ease;
}
.dlc-visit:hover {
  filter: brightness(1.1) drop-shadow(0 0 12px rgba(255, 230, 0, 0.5));
}

@media (prefers-reduced-motion: reduce) {
  .dlc-spin-layer { animation: none !important; }
}
`;

function isHttps(url: string): boolean {
  return /^https:\/\//i.test(url);
}

type Props = {
  link: DeveloperLink;
  className?: string;
};

export function DeveloperLinkCard({ link, className = "" }: Props) {
  // Tilt motion values (hooks must be called unconditionally before any return)
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const sRotateX = useSpring(rotateX, { stiffness: 150, damping: 18 });
  const sRotateY = useSpring(rotateY, { stiffness: 150, damping: 18 });

  // Spotlight position (0-100%)
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(220px circle at ${spotX}% ${spotY}%, rgba(255,230,0,0.18), transparent 60%)`;

  // Defensive: skip rendering if URL is not https (admin should have validated
  // already, but never trust a stored value to be safe to put in an href)
  if (!isHttps(link.url)) return null;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotateX.set((0.5 - py) * 10);
    rotateY.set((px - 0.5) * 12);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <motion.div
        className={`dlc-card ${className}`}
        data-hovered="false"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).setAttribute("data-hovered", "true");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).setAttribute("data-hovered", "false");
          handleLeave();
        }}
        onMouseMove={handleMove}
        style={{
          rotateX: sRotateX,
          rotateY: sRotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 800,
        }}
      >
        {/* Rotating gradient ring */}
        <span aria-hidden className="dlc-spin-layer" />

        <div className="dlc-inner">
          {/* Spotlight overlay (radial gradient following cursor) */}
          <motion.div aria-hidden className="dlc-spotlight" style={{ background: spotlight }} />

          <div className="dlc-content">
            <div className="dlc-icon-row">
              <span className="dlc-icon">
                {link.logoUrl ? (
                  <SmartImage
                    src={link.logoUrl}
                    alt={`${link.title} logo`}
                    width={32}
                    height={32}
                    className="object-cover"
                    fallbackLabel={link.title.slice(0, 2).toUpperCase()}
                    seed={link.id}
                  />
                ) : (
                  <GraduationCap className="size-5" />
                )}
              </span>
              <span className="dlc-title">{link.title}</span>
            </div>

            {link.tagline ? <p className="dlc-tagline">{link.tagline}</p> : null}

            <MagneticButton
              href={link.url}
              strength={0.35}
              className="dlc-visit"
            >
              Visit
              <ArrowUpRight className="size-4" />
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default DeveloperLinkCard;
