import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Profanity / spam filter — small curated list of obvious offenders.
// Match is case-insensitive on whole tokens; we don't try to be clever.
// ---------------------------------------------------------------------------
const BANNED_TOKENS = [
  "viagra",
  "cialis",
  "casino",
  "gambling",
  "porn",
  "sex",
  "escort",
  "loan",
  "crypto",
  "bitcoin",
  "http://",
  "https://",
  "www.",
  ".com",
  ".net",
  ".io",
  "click here",
  "buy now",
  "free money",
  "nude",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "cunt",
];

function containsBanned(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_TOKENS.some((t) => lower.includes(t));
}

const createSchema = z.object({
  name: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(140),
  honeypot: z.string().max(200).optional(),
});

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// ---------------------------------------------------------------------------
// GET — approved messages (public) OR pending (admin only)
// ---------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "approved";

    // Pending queue is admin-only.
    if (status === "pending") {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      const pending = await db.memoryWallMessage.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      return NextResponse.json(
        { items: pending.map(serialize) },
        {
          headers: {
            "Cache-Control": "private, no-store",
          },
        }
      );
    }

    // Public approved list — latest 20.
    const items = await db.memoryWallMessage.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(
      { items: items.map(serialize) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    console.error("[/api/memory-wall GET] error:", err);
    return NextResponse.json(
      { error: "Failed to load messages." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — public submission
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, message, honeypot } = parsed.data;

    // Bot trap — silently succeed so the bot doesn't retry with new tactics.
    if (honeypot && honeypot.trim().length > 0) {
      return NextResponse.json(
        { ok: true, message: "Message submitted." },
        { status: 200 }
      );
    }

    const ip = getClientIp(req);

    // Rate limit: max 3 messages per IP per minute.
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recentCount = await db.memoryWallMessage.count({
      where: { ip, createdAt: { gte: oneMinuteAgo } },
    });
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many messages. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    // Profanity / spam filter.
    if (containsBanned(message) || (name && containsBanned(name))) {
      return NextResponse.json(
        { error: "This message contains content we can't accept." },
        { status: 422 }
      );
    }

    await db.memoryWallMessage.create({
      data: {
        name: name && name.length > 0 ? name : "Anonymous",
        message,
        status: "PENDING",
        ip,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Message submitted for review." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[/api/memory-wall POST] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}

function serialize(m: {
  id: string;
  name: string;
  message: string;
  status: string;
  createdAt: Date;
}) {
  return {
    id: m.id,
    name: m.name,
    message: m.message,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  };
}
