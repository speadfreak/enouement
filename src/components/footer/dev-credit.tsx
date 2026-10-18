"use client";

/**
 * DevCredit — the "Crafted by" block shown at the finale.
 *
 * Layout:
 *   "Crafted by" (small uppercase muted)
 *   {JOSEPH JAMES}     ← animated gradient name with a blinking cursor after it
 *   Full-Stack Developer  (muted)
 *
 *   • Name uses an animated flowing yellow→green gradient (background-clip: text).
 *   • A `{ }` / `_` cursor motif blinks at the end of the name.
 *   • On hover (or if the name links out via `devLink`), a glowing underline
 *     draws from left to right via framer-motion `whileHover` scaleX 0→1.
 *
 * Accessibility: name is wrapped in an `<a>` only when `devLink` is set; the
 * cursor is `aria-hidden`.
 */

import { motion } from "framer-motion";
import { useState } from "react";

const PRIMARY = "#ffe600";
const SECONDARY = "#00c853";
const ACCENT = "#b9f6ca";

const CSS = `
@keyframes dc-gradient-flow {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes dc-cursor-blink {
  0%, 49%   { opacity: 1; }
  50%, 100%  { opacity: 0; }
}

.dc-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.35rem;
}
@media (min-width: 768px) {
  .dc-root {
    align-items: flex-start;
    text-align: left;
  }
}

.dc-label {
  font-size: 0.7rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(243, 255, 232, 0.55);
  font-family: var(--font-mono), ui-monospace, monospace;
}

.dc-name-wrap {
  position: relative;
  display: inline-flex;
  align-items: baseline;
  gap: 0.2em;
  padding-bottom: 0.35rem;
  cursor: default;
}
.dc-name-wrap[data-link="true"] {
  cursor: pointer;
}

.dc-name {
  font-family: var(--font-display), "Syne", system-ui, sans-serif;
  font-weight: 800;
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  letter-spacing: -0.02em;
  line-height: 1;
  background: linear-gradient(90deg, ${PRIMARY} 0%, ${SECONDARY} 35%, ${ACCENT} 65%, ${PRIMARY} 100%);
  background-size: 200% 100%;
  -webkit-background-clip: text;
          background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: dc-gradient-flow 8s linear infinite;
  filter: drop-shadow(0 0 18px rgba(255, 230, 0, 0.18));
}

.dc-cursor {
  display: inline-block;
  font-family: var(--font-mono), ui-monospace, monospace;
  font-weight: 700;
  font-size: clamp(1.4rem, 5vw, 2.4rem);
  color: ${PRIMARY};
  animation: dc-cursor-blink 1.05s steps(1) infinite;
  margin-left: 0.1em;
  transform: translateY(-0.05em);
  text-shadow: 0 0 14px rgba(255, 230, 0, 0.65);
}

.dc-underline {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: linear-gradient(90deg, ${PRIMARY}, ${SECONDARY}, ${ACCENT});
  background-size: 200% 100%;
  transform-origin: left center;
  border-radius: 2px;
  box-shadow: 0 0 12px rgba(255, 230, 0, 0.65), 0 0 20px rgba(0, 200, 83, 0.4);
}

.dc-role {
  font-size: 0.8rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(243, 255, 232, 0.65);
  font-family: var(--font-mono), ui-monospace, monospace;
}

@media (prefers-reduced-motion: reduce) {
  .dc-name { animation: none !important; filter: none; }
  .dc-cursor { animation: none !important; opacity: 0.8; }
}
`;

type Props = {
  devName: string;
  devRole: string;
  devLink?: string | null;
};

export function DevCredit({ devName, devRole, devLink }: Props) {
  const [hovered, setHovered] = useState(false);
  const isLink = !!devLink && /^https:\/\//i.test(devLink);

  const NameWrap = isLink ? "a" : "div";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="dc-root">
        <span className="dc-label">Crafted by</span>

        <NameWrap
          {...(isLink
            ? {
                href: devLink!,
                target: "_blank",
                rel: "noopener noreferrer",
                "aria-label": `${devName} — ${devRole} (opens in new tab)`,
              }
            : {})}
          className="dc-name-wrap"
          data-link={isLink ? "true" : "false"}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span className="dc-name">{devName}</span>
          <span className="dc-cursor" aria-hidden>
            {"{ }"}
          </span>
          <motion.span
            aria-hidden
            className="dc-underline"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isLink ? { scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 } : { scaleX: 0, opacity: 0 }}
            whileHover={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </NameWrap>

        <span className="dc-role">{devRole}</span>
      </div>
    </>
  );
}

export default DevCredit;
