import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/**
 * Upload SIGNING endpoint.
 *
 * The file NEVER touches this server (which would blow past Vercel's ~4.5MB
 * body limit on serverless functions). Instead:
 *   1. Admin calls this endpoint with { folder, resourceType }.
 *   2. We verify the admin session and that Cloudinary is configured.
 *   3. We sign the upload params with CLOUDINARY_API_SECRET (server-only).
 *   4. We return { signature, timestamp, apiKey, cloudName, folder, resourceType }.
 *   5. The browser POSTs the file DIRECTLY to
 *      https://api.cloudinary.com/v1_1/<cloud_name>/<resource_type>/upload
 *      with those signed params — bypassing our server entirely.
 *
 * No base64 fallback: storing large files in Neon fills the free database.
 * If Cloudinary is not configured, this endpoint returns 503 with a clear
 * message instructing the admin to set the env vars.
 */

const ALLOWED_FOLDERS = new Set([
  "hero",
  "posts",
  "albums",
  "merch",
  "seniors",
  "videos",
  "events",
  "announcements",
  "story",
  "settings",
  "gallery",
  "misc",
]);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB (client-enforced)
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 MB (client-enforced, chunked upload)

function hasCloudinary() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/** Compute the Cloudinary SHA-1 signature without importing the SDK
 *  (keeps the route light and avoids bundling concerns).
 *  Cloudinary signs by sorting params alphabetically into `key=value&...`,
 *  appending the api_secret, and SHA-1 hex-digesting. */
async function sign(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const data = new TextEncoder().encode(sorted + apiSecret);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasCloudinary()) {
      return NextResponse.json(
        {
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your environment variables to enable uploads.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const folderRaw = typeof body.folder === "string" ? body.folder : "misc";
    const folder = ALLOWED_FOLDERS.has(folderRaw) ? folderRaw : "misc";
    const resourceType: "image" | "video" =
      body.resourceType === "video" ? "video" : "image";

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
    const apiKey = process.env.CLOUDINARY_API_KEY!;
    const apiSecret = process.env.CLOUDINARY_API_SECRET!;

    const timestamp = Math.round(Date.now() / 1000);
    const fullFolder = `enouement-2k27/${folder}`;

    const signature = await sign(
      { timestamp, folder: fullFolder },
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder: fullFolder,
      resourceType,
      maxImageBytes: MAX_IMAGE_BYTES,
      maxVideoBytes: MAX_VIDEO_BYTES,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Sign failed" }, { status: 500 });
  }
}
