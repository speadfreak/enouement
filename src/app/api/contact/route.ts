import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  subject: z.string().max(120).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
  // Honeypot — must be empty
  website: z.string().max(0).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    // Simple rate limit: no more than one message per email per 60s.
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const recent = await db.contactMessage.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo },
      },
      select: { createdAt: true },
    });
    if (recent) {
      return NextResponse.json(
        { error: "You're sending messages too quickly. Please wait a minute." },
        { status: 429 }
      );
    }

    await db.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || null,
        message,
      },
    });

    return NextResponse.json(
      { ok: true, message: "Message received." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/contact] error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
