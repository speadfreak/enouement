/**
 * Cloudinary URL optimization helper.
 *
 * Takes a Cloudinary URL (e.g. `https://res.cloudinary.com/<cloud>/image/upload/v123/img.jpg`)
 * and injects transformation params for fast LCP and minimal payload:
 *   • `f_auto`   — auto format (AVIF/WebP based on browser Accept header)
 *   • `q_auto`   — auto quality (Cloudinary picks the best q for the format)
 *   • `dpr_auto` — auto device pixel ratio (1x / 2x / 3x)
 *   • `c_limit`  — limit crop (downscale only, never stretch)
 *   • `w_<n>`    — cap width at <n> px
 *
 * If the URL already carries transformations (e.g. `/image/upload/c_fill,w_800/...`),
 * the new options are *prepended* to the existing segment so callers can chain.
 *
 * If the URL is NOT a Cloudinary delivery URL (data:, blob:, /local/path, other CDN),
 * it is returned unchanged — safe to call on every image src.
 *
 * @example
 * cloudinary("https://res.cloudinary.com/foo/image/upload/v123/img.jpg", { w: 800 })
 * // → "https://res.cloudinary.com/foo/image/upload/f_auto,q_auto,dpr_auto,c_limit,w_800/v123/img.jpg"
 *
 * cloudinary("/local/photo.jpg", { w: 800 })
 * // → "/local/photo.jpg"
 */
export type CloudinaryOptions = {
  /** Max width in CSS px. Combined with `c_limit` so Cloudinary never upscales. */
  w?: number;
  /** Optional extra transforms, e.g. ["e_grayscale", "r_max"]. */
  extra?: string[];
};

const CLOUDINARY_HOST = "res.cloudinary.com";

/** True if `url` looks like a Cloudinary delivery URL we can transform. */
function isCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : "https://example.com");
    // Match `res.cloudinary.com` exactly (the `**.cloudinary.com` remotePattern
    // in next.config is permissive, but Cloudinary only delivers optimized
    // assets from `res.cloudinary.com`).
    return u.hostname === CLOUDINARY_HOST && u.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

/** Build the transformation segment, e.g. "f_auto,q_auto,dpr_auto,c_limit,w_800". */
function buildTransform(opts: CloudinaryOptions): string {
  const parts: string[] = ["f_auto", "q_auto", "dpr_auto"];
  if (typeof opts.w === "number" && opts.w > 0) {
    parts.push("c_limit");
    parts.push(`w_${Math.round(opts.w)}`);
  }
  if (opts.extra && opts.extra.length > 0) {
    parts.push(...opts.extra.filter(Boolean));
  }
  return parts.join(",");
}

/**
 * Inject Cloudinary optimization params into a Cloudinary URL.
 * Returns the original URL unchanged if it isn't a Cloudinary URL.
 */
export function cloudinary(url: string | undefined | null, options: CloudinaryOptions = {}): string {
  if (!url) return "";
  if (typeof url !== "string") return url;
  // data: URLs, blob: URLs, relative paths, foreign hosts → return as-is.
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (!isCloudinaryUrl(url)) return url;

  try {
    // Cloudinary delivery path looks like:
    //   /<cloud>/image/upload/<optional existing transforms>/<version + public id>
    // e.g. /foo/image/upload/v12345/img.jpg
    //      /foo/image/upload/c_fill,w_800/v12345/img.jpg
    //
    // We split the URL into prefix (…/image/upload) + transform segment + suffix.
    const marker = "/image/upload/";
    const idx = url.indexOf(marker);
    if (idx === -1) return url;

    const prefix = url.slice(0, idx + marker.length); // includes trailing slash
    const rest = url.slice(idx + marker.length); // "<transforms>/<version + id>"

    const newTransform = buildTransform(options);

    // Does `rest` already start with transforms?
    // Cloudinary transform segments look like `c_fill,w_800,h_600,e_grayscale`.
    // They cannot start with `v<digits>` (that's a version) and cannot start
    // with `/` (that would mean no transforms at all → straight to version/id).
    const hasExistingTransform = rest.length > 0 && !rest.startsWith("/") && !/^v\d+/.test(rest);

    if (!hasExistingTransform) {
      // No existing transforms — insert ours between prefix and rest.
      // `rest` is either empty, starts with `/` (rare), or starts with `v123/...`.
      return `${prefix}${newTransform}/${rest}`;
    }

    // Existing transforms — split at the first `/` (end of transform segment).
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) {
      // The whole `rest` is a transform segment with no asset path (malformed).
      return `${prefix}${newTransform},${rest}`;
    }
    const existing = rest.slice(0, slashIdx); // "c_fill,w_800"
    const tail = rest.slice(slashIdx); // "/v12345/img.jpg"
    return `${prefix}${newTransform},${existing}${tail}`;
  } catch {
    // Never throw on URL mutation — fall back to the original.
    return url;
  }
}

export default cloudinary;
