import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function currentMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ---------------------------------------------------------------------------
// In-memory per-IP throttle — 1 visit increment per IP per hour.
// Survives a single warm process. On a serverless cold start the throttle
// window simply resets; worst case is a duplicate +1, not a security issue.
// ---------------------------------------------------------------------------
const HOUR_MS = 60 * 60 * 1000;
const ipThrottle = new Map<string, number>();

function throttleOk(ip: string): boolean {
  const now = Date.now();
  const last = ipThrottle.get(ip);
  if (last === undefined) {
    ipThrottle.set(ip, now);
    return true;
  }
  if (now - last >= HOUR_MS) {
    ipThrottle.set(ip, now);
    return true;
  }
  return false;
}

// Periodically prune the map so it doesn't grow unbounded.
let lastPrune = Date.now();
function maybePrune() {
  const now = Date.now();
  if (now - lastPrune < 5 * 60 * 1000) return;
  lastPrune = now;
  for (const [k, v] of ipThrottle) {
    if (now - v >= HOUR_MS) ipThrottle.delete(k);
  }
}

// ---------------------------------------------------------------------------
// POST — increment visit counter (rate-limited per IP per hour)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    maybePrune();
    const ip = getClientIp(req);
    const month = currentMonth();

    // Throttle: one increment per IP per hour.
    if (!throttleOk(ip)) {
      // Return the current count without incrementing.
      const row = await db.visitCounter.findUnique({ where: { id: "visits" } });
      return NextResponse.json({ count: row?.count ?? 0, throttled: true });
    }

    // Upsert the counter row — resets when the month changes.
    const updated = await db.visitCounter.upsert({
      where: { id: "visits" },
      update: {
        // If the month changed, reset count to 1; otherwise increment.
        count: { increment: 1 },
        month,
      },
      create: {
        id: "visits",
        count: 1,
        month,
      },
    });

    // If the stored month doesn't match the current month, reset.
    // (Handles the case where the row existed from a previous month.)
    if (updated.month !== month) {
      const reset = await db.visitCounter.update({
        where: { id: "visits" },
        data: { count: 1, month },
      });
      return NextResponse.json({ count: reset.count });
    }

    return NextResponse.json({ count: updated.count });
  } catch (err) {
    console.error("[/api/visit POST] error:", err);
    return NextResponse.json(
      { error: "Failed to record visit." },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// GET — read the current monthly counter (used by the footer for SSR seed)
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const month = currentMonth();
    const row = await db.visitCounter.findUnique({ where: { id: "visits" } });
    // If the row is stale (different month), report 0 — the next POST will reset.
    const count = row && row.month === month ? row.count : 0;
    return NextResponse.json(
      { count, month },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    console.error("[/api/visit GET] error:", err);
    return NextResponse.json({ count: 0, month: currentMonth() });
  }
}
