import { NextResponse } from "next/server";
import { z } from "zod";

/** JSON success response */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

/** JSON error response */
export function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

/** Parse + validate a JSON request body with a zod schema.
 *  Generic over the schema so the inferred output type flows to callers. */
export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S
): Promise<{ ok: true; data: z.infer<S> } | { ok: false; error: any }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { ok: false, error: { formErrors: ["Invalid JSON body"], fieldErrors: {} } };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, error: result.error.flatten() };
  }
  return { ok: true, data: result.data };
}

/** Convert a string to a URL-safe slug */
export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Wrap an async route handler with try/catch that maps known auth errors to 401/403 */
export function handleErr(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((e: any) => {
    const msg = e?.message ?? "Server error";
    if (msg === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Prisma known errors
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "A record with that unique field already exists." }, { status: 409 });
    }
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  });
}
