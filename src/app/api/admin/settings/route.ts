import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/session";
import { handleErr, ok, bad, parseBody } from "@/lib/admin-route";

const httpsUrlOptional = z
  .string()
  .optional()
  .refine((u) => !u || (z.string().url().safeParse(u).success && u.startsWith("https://")), {
    message: "Must be an https:// URL",
  });

// Every field is optional so each admin tab can submit a partial slice
// (Brand & Blurb, Social Links, Feature Toggles, Ribbon). The handler merges
// the payload over the existing row so omitted fields are preserved.
const settingsSchema = z.object({
  siteName: z.string().min(1).max(120).optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  footerText: z.string().max(500).optional(),
  footerBlurb: z.string().max(1000).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  countdownLabel: z.string().max(120).optional(),
  countdownDate: z.string().optional().nullable(),
  socialLinks: z.string().optional(),
  contactInfo: z.string().optional(),
  logoUrl: z.string().optional().nullable(),
  faviconUrl: z.string().optional().nullable(),
  ogImageUrl: z.string().optional().nullable(),
  reduceMotionDefault: z.boolean().optional(),
  // Feature toggles (footer round 5)
  memoryWallEnabled: z.boolean().optional(),
  shareEnabled: z.boolean().optional(),
  installEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  easterEggEnabled: z.boolean().optional(),
  liveCounterEnabled: z.boolean().optional(),
  ribbonEnabled: z.boolean().optional(),
  // Announcement ribbon
  ribbonText: z.string().max(280).optional().nullable(),
  ribbonLink: httpsUrlOptional.nullable(),
  ribbonColor: z.string().max(20).optional(),
  ribbonExpiry: z.string().optional().nullable(),
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
    const existing = await db.siteSetting.findUnique({ where: { id: "site" } });

    const data: Record<string, unknown> = {};

    if (v.siteName !== undefined) data.siteName = v.siteName;
    if (v.tagline !== undefined) data.tagline = v.tagline;
    if (v.description !== undefined) data.description = v.description;
    if (v.footerText !== undefined) data.footerText = v.footerText;
    if (v.footerBlurb !== undefined) data.footerBlurb = v.footerBlurb;
    if (v.primaryColor !== undefined) data.primaryColor = v.primaryColor;
    if (v.secondaryColor !== undefined) data.secondaryColor = v.secondaryColor;
    if (v.countdownLabel !== undefined) data.countdownLabel = v.countdownLabel;
    if (v.countdownDate !== undefined) {
      data.countdownDate = v.countdownDate ? new Date(v.countdownDate) : null;
    }
    if (v.socialLinks !== undefined) data.socialLinks = safeJson(v.socialLinks, {});
    if (v.contactInfo !== undefined) data.contactInfo = safeJson(v.contactInfo, {});
    if (v.logoUrl !== undefined) data.logoUrl = v.logoUrl || null;
    if (v.faviconUrl !== undefined) data.faviconUrl = v.faviconUrl || null;
    if (v.ogImageUrl !== undefined) data.ogImageUrl = v.ogImageUrl || null;
    if (v.reduceMotionDefault !== undefined) data.reduceMotionDefault = v.reduceMotionDefault;

    // Feature toggles — fall back to existing when not provided.
    data.memoryWallEnabled =
      v.memoryWallEnabled !== undefined ? v.memoryWallEnabled : existing?.memoryWallEnabled ?? true;
    data.shareEnabled =
      v.shareEnabled !== undefined ? v.shareEnabled : existing?.shareEnabled ?? true;
    data.installEnabled =
      v.installEnabled !== undefined ? v.installEnabled : existing?.installEnabled ?? true;
    data.soundEnabled =
      v.soundEnabled !== undefined ? v.soundEnabled : existing?.soundEnabled ?? true;
    data.easterEggEnabled =
      v.easterEggEnabled !== undefined
        ? v.easterEggEnabled
        : existing?.easterEggEnabled ?? true;
    data.liveCounterEnabled =
      v.liveCounterEnabled !== undefined
        ? v.liveCounterEnabled
        : existing?.liveCounterEnabled ?? true;
    data.ribbonEnabled =
      v.ribbonEnabled !== undefined ? v.ribbonEnabled : existing?.ribbonEnabled ?? false;

    if (v.ribbonText !== undefined) {
      const trimmed = v.ribbonText?.trim() ?? "";
      data.ribbonText = trimmed ? trimmed : null;
    } else {
      data.ribbonText = existing?.ribbonText ?? null;
    }
    if (v.ribbonLink !== undefined) {
      const trimmed = v.ribbonLink?.trim() ?? "";
      data.ribbonLink = trimmed ? trimmed : null;
    } else {
      data.ribbonLink = existing?.ribbonLink ?? null;
    }
    if (v.ribbonColor !== undefined) {
      data.ribbonColor = v.ribbonColor || "#FFE600";
    } else {
      data.ribbonColor = existing?.ribbonColor ?? "#FFE600";
    }
    if (v.ribbonExpiry !== undefined) {
      data.ribbonExpiry = v.ribbonExpiry ? new Date(v.ribbonExpiry) : null;
    } else {
      data.ribbonExpiry = existing?.ribbonExpiry ?? null;
    }

    const updated = await db.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site", ...data },
      update: data,
    });

    await logAudit("update", "SiteSetting", updated.id, {
      siteName: updated.siteName,
      footerBlurb: updated.footerBlurb,
      ribbonEnabled: updated.ribbonEnabled,
    });

    // Revalidate all public pages so logo/siteName/footer changes appear instantly.
    // The layout tag also covers metadata (favicon, og:image, title template).
    revalidatePath("/", "layout");
    revalidateTag("site", "max");
    revalidateTag("nav", "max");
    revalidateTag("footer-links", "max");
    revalidateTag("memory-wall", "max");

    return ok(updated);
  });
}

export const _r = NextResponse;
