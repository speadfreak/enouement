"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Props = Omit<ImageProps, "onError"> & {
  /** Seed for deterministic gradient fallback */
  seed?: string;
  fallbackLabel?: string;
  wrapperClassName?: string;
};

const PALETTES = [
  ["#FFE600", "#00C853"],
  ["#00C853", "#B9F6CA"],
  ["#FFD60A", "#16A34A"],
  ["#FFE600", "#0B130E"],
  ["#86EFAC", "#00C853"],
  ["#FFD60A", "#050A07"],
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

/** Image with cinematic gradient fallback if the src fails to load.
 *  Use everywhere so the site looks full even before real photos are uploaded. */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  seed,
  fallbackLabel,
  fill,
  ...rest
}: Props) {
  const [error, setError] = useState(false);

  const s = hash(seed ?? (typeof src === "string" ? src : "x"));
  const [a, b] = PALETTES[s % PALETTES.length];
  const angle = (s % 4) * 45 + 90;

  // Render gradient fallback during SSR and on image error
  if (error) {
    return (
      <div
        className={cn("relative overflow-hidden", wrapperClassName, className)}
        style={{
          background: `linear-gradient(${angle}deg, ${a}, ${b})`,
        }}
        aria-label={alt}
        role="img"
      >
        <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
        {fallbackLabel && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="font-display text-xs font-bold uppercase tracking-[0.3em] text-black/70">
              {fallbackLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (fill) {
    return (
      <div className={cn("relative", wrapperClassName)}>
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          onError={() => setError(true)}
          {...rest}
        />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      {...rest}
    />
  );
}
