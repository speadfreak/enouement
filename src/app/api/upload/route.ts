import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/ogg"];

function hasCloudinary() {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** Upload to Cloudinary via the unsigned uploader (server-side signed). */
async function uploadToCloudinary(buffer: Buffer, opts: { folder: string; resourceType: "image" | "video" }) {
  const cloudinary = (await import("cloudinary")).v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `enouement-2k27/${opts.folder}`,
        resource_type: opts.resourceType,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve({ url: result?.secure_url || "", publicId: result?.public_id || "" });
      }
    );
    uploadStream.end(buffer);
  });
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string) || "misc";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const type = file.type;
    const isImage = ALLOWED_IMAGE.includes(type);
    const isVideo = ALLOWED_VIDEO.includes(type);
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: `File type ${type} not allowed. Allowed: ${[...ALLOWED_IMAGE, ...ALLOWED_VIDEO].join(", ")}` },
        { status: 400 }
      );
    }

    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${isImage ? "8MB" : "60MB"} for ${isImage ? "images" : "videos"}.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Cloudinary path
    if (hasCloudinary()) {
      const { url } = await uploadToCloudinary(buffer, {
        folder,
        resourceType: isImage ? "image" : "video",
      });
      return NextResponse.json({ url, type: isImage ? "image" : "video" });
    }

    // Fallback: base64 data URL (works everywhere, no external setup needed)
    // For images this is fine. For large videos this may bloat the DB record
    // that references it, but the data URL itself is stored on the media row.
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${type};base64,${base64}`;
    return NextResponse.json({ url: dataUrl, type: isImage ? "image" : "video" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
