import { db } from "@/lib/db";
import { SeniorsManager } from "@/components/admin/seniors-manager";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function SeniorsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const page = Math.max(1, Number(getParam(sp.page) || "1") || 1);
  const pageSize = Math.min(
    500,
    Math.max(1, Number(getParam(sp.pageSize) || "25") || 25)
  );
  const q = getParam(sp.q).trim();
  const stream = getParam(sp.stream); // "" | "Natural" | "Social" | "none"
  const published = getParam(sp.published); // "" | "true" | "false"
  const featured = getParam(sp.featured); // "" | "true" | "false"

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

  const [items, total, totalCount, publishedCount, naturalCount, socialCount, withPhotoCount] =
    await Promise.all([
      db.student.findMany({
        where,
        orderBy: [{ featured: "desc" }, { order: "asc" }, { name: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.student.count({ where }),
      db.student.count(),
      db.student.count({ where: { published: true } }),
      db.student.count({ where: { stream: "Natural" } }),
      db.student.count({ where: { stream: "Social" } }),
      db.student.count({ where: { NOT: { photoUrl: null } } }),
    ]);

  return (
    <SeniorsManager
      initial={{
        items: items as any,
        total,
        page,
        pageSize,
        stats: {
          total: totalCount,
          published: publishedCount,
          natural: naturalCount,
          social: socialCount,
          withPhoto: withPhotoCount,
        },
      }}
      initialFilters={{ page, pageSize, q, stream, published, featured }}
    />
  );
}

function getParam(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}
