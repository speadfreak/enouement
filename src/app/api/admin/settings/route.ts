import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const settingsSchema = z.object({
  siteName: z.string().min(1).max(120),
  tagline: z.string().max(200),
  description: z.string().max(2000),
  footerText: z.string().max(500),
  primaryColor: z.string().max(20),
  secondaryColor: z.string().max(20),
  countdownLabel: z.string().max(120),
  countdownDate: z.string().optional().nullable(),
  socialLinks: z.string().optional().default("{}"),
  contactInfo: z.string().optional().default("{}"),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  reduceMotionDefault: z.boolean().optional().default(false),
});

function safeJson(s: string | undefined, fallback: any) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

export async function GET() {
  return handleErr(async () => {
    await requireAdmin();
    const s = await db.siteSetting.findUnique({ where: { id: "site" } });
    return ok(s ?? { id: "site" });
  });
}

export async function PUT(req: Request) {
  return handleErr(async () => {
    await requireAdmin();
    const parsed = await parseBody(req, settingsSchema);
    if (!parsed.ok) return bad(JSON.stringify(parsed.error), 422);

    const v = parsed.data;
    const data = {
      siteName: v.siteName,
      tagline: v.tagline,
      description: v.description,
      footerText: v.footerText,
      primaryColor: v.primaryColor,
      secondaryColor: v.secondaryColor,
      countdownLabel: v.countdownLabel,
      countdownDate: v.countdownDate ? new Date(v.countdownDate) : null,
      socialLinks: safeJson(v.socialLinks, {}),
      contactInfo: safeJson(v.contactInfo, {}),
      logoUrl: v.logoUrl || null,
      faviconUrl: v.faviconUrl || null,
      ogImageUrl: v.ogImageUrl || null,
      reduceMotionDefault: v.reduceMotionDefault,
    };

    const updated = await db.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });

    await logAudit("update", "SiteSetting", updated.id, { siteName: updated.siteName });

    // Revalidate all public pages so logo/siteName/footer changes appear instantly.
    // The layout tag also covers metadata (favicon, og:image, title template).
    revalidatePath("/", "layout");
    revalidateTag("site", "max");
    revalidateTag("nav", "max");

    return ok(updated);
  });
}

export const _r = NextResponse;
