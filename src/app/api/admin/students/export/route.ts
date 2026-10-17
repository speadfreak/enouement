import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { handleErr } from "@/lib/admin-route";

const HEADERS = [
  "name",
  "nickname",
  "section",
  "stream",
  "club",
  "quote",
  "futurePlan",
  "photoUrl",
] as const;

/** Escape a CSV field: wrap in quotes if it contains comma, quote, newline. */
function csvField(v: string | null | undefined): string {
  const s = v ?? "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(values: (string | null | undefined)[]): string {
  return values.map(csvField).join(",");
}

export async function GET(req: Request) {
  return handleErr(async () => {
    await requireAdmin();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const stream = url.searchParams.get("stream") || ""; // "" | "Natural" | "Social" | "none"
    const published = url.searchParams.get("published") || ""; // "" | "true" | "false"
    const featured = url.searchParams.get("featured") || ""; // "" | "true" | "false"

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { nickname: { contains: q, mode: "insensitive" } },
        { section: { contains: q, mode: "insensitive" } },
        { club: { contains: q, mode: "insensitive" } },
      ];
    }
    if (stream === "Natural" || stream === "Social") {
      where.stream = stream;
    } else if (stream === "none") {
      where.stream = null;
    }
    if (published === "true") where.published = true;
    else if (published === "false") where.published = false;
    if (featured === "true") where.featured = true;
    else if (featured === "false") where.featured = false;

    const rows = await db.student.findMany({
      where,
      orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
      take: 5000,
    });

    const lines: string[] = [];
    lines.push(csvRow([...HEADERS] as string[]));
    for (const r of rows) {
      lines.push(
        csvRow([
          r.name,
          r.nickname,
          r.section,
          r.stream,
          r.club,
          r.quote,
          r.futurePlan,
          r.photoUrl,
        ])
      );
    }
    const csv = lines.join("\r\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="seniors.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}

export const _r = NextResponse;
