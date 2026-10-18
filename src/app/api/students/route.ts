import { NextResponse } from "next/server";
import {
  getStudentsPaginated,
  type StudentSort,
  type StudentStream,
} from "@/lib/data";

export const dynamic = "force-dynamic";

const STREAMS: StudentStream[] = ["Natural", "Social"];
const SORTS: StudentSort[] = ["featured", "name-asc", "name-desc", "newest"];

function asInt(v: string | null, fallback: number, min: number, max: number) {
  if (!v) return fallback;
  const n = Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

/**
 * Public seniors explorer API.
 *
 * GET /api/students?page=1&pageSize=48&stream=Natural&section=A&club=...&q=...&sort=featured
 *
 * Returns { items, total, hasMore } of published students only.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = url.searchParams;

  const page = asInt(params.get("page"), 1, 1, 10_000);
  const pageSize = asInt(params.get("pageSize"), 48, 1, 100);

  const streamParam = params.get("stream");
  const stream: StudentStream =
    streamParam && STREAMS.includes(streamParam as StudentStream)
      ? (streamParam as StudentStream)
      : null;

  const section = params.get("section") || null;
  const club = params.get("club") || null;
  const q = params.get("q") || null;

  const sortParam = params.get("sort");
  const sort: StudentSort =
    sortParam && SORTS.includes(sortParam as StudentSort)
      ? (sortParam as StudentSort)
      : "featured";

  const result = await getStudentsPaginated({
    page,
    pageSize,
    stream,
    section,
    club,
    query: q,
    sort,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control":
        "public, s-maxage=30, stale-while-revalidate=60, max-age=0",
    },
  });
}
