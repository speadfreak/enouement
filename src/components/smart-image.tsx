"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { cloudinary } from "@/lib/cloudinary";

type Props = Omit<ImageProps, "onError" | "src" | "sizes"> & {
  /** Image source — Cloudinary URLs are auto-optimized, others pass through. */
  src: string;
  /** Seed for deterministic gradient fallback */
  seed?: string;
  fallbackLabel?: string;
  wrapperClassName?: string;
  /**
   * Responsive sizes hint passed straight to next/image (drives srcset).
   * Defaults to a sensible grid layout. Override per use-case (e.g. hero
   * uses `100vw`, thumbnails use `48px`).
   */
  sizes?: string;
  /**
   * Explicit Cloudinary width cap (px). If omitted, a sensible value is
   * derived from `sizes`. Cloudinary's `c_limit` means images are never
   * upscaled — only downscaled to this max. The browser still gets a
   * srcset so it picks the right size for the viewport.
   */
  cloudinaryWidth?: number;
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

const DEFAULT_SIZES = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";

/**
 * Derive a sensible Cloudinary width cap from a `sizes` attribute.
 *
 * - `"100vw"` → 1920 (assumes max viewport ≈ 1920)
 * - `"(max-width: 768px) 100vw, 50vw"` → 960 (largest slot, 50vw × 1920)
 * - `"48px"` → 96 (2× for DPR)
 *
 * Always clamped to [100, 1920]. Returns 800 if `sizes` is empty/unknown.
 */
function deriveWidth(sizes: string | undefined, explicit?: number): number {
  if (typeof explicit === "number" && explicit > 0) return explicit;
  if (!sizes) return 800;
  let max = 0;
  // px values → 2x for retina
  const pxRe = /(\d+(?:\.\d+)?)px/g;
  let m: RegExpExecArray | null;
  while ((m = pxRe.exec(sizes)) !== null) {
    max = Math.max(max, parseFloat(m[1]) * 2);
  }
  // vw values → assume max viewport 1920px
  const vwRe = /(\d+(?:\.\d+)?)vw/g;
  while ((m = vwRe.exec(sizes)) !== null) {
    max = Math.max(max, (parseFloat(m[1]) / 100) * 1920);
  }
  if (max === 0) return 800;
  return Math.max(100, Math.min(1920, Math.round(max)));
}

/** Image with cinematic gradient fallback if the src fails to load.
 *  Use everywhere so the site looks full even before real photos are uploaded.
 *
 *  Cloudinary URLs are auto-optimized with `f_auto,q_auto,dpr_auto,c_limit,w_<n>`
 *  based on the `sizes` prop (or an explicit `cloudinaryWidth`). Non-Cloudinary
 *  URLs (data:, blob:, /local/path) pass through unchanged. */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  seed,
  fallbackLabel,
  sizes = DEFAULT_SIZES,
  cloudinaryWidth,
  fill,
  ...rest
}: Props) {
  const [error, setError] = useState(false);

  const s = hash(seed ?? (typeof src === "string" ? src : "x"));
  const [a, b] = PALETTES[s % PALETTES.length];
  const angle = (s % 4) * 45 + 90;

  // Optimize Cloudinary URLs; pass through everything else (data:, /local, etc.)
  const optimizedSrc =
    typeof src === "string" && src.length > 0
      ? cloudinary(src, { w: deriveWidth(sizes, cloudinaryWidth) })
      : src;

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
          src={optimizedSrc}
          alt={alt}
          fill
          sizes={sizes}
          className={className}
          onError={() => setError(true)}
          {...rest}
        />
      </div>
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      sizes={sizes}
      className={className}
      onError={() => setError(true)}
      {...rest}
    />
  );
}
