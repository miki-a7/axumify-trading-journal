import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, timezone: user.timezone, currency: user.currency } });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const data = {
    name: typeof body.name === "string" ? body.name.trim() || null : user.name,
    timezone: typeof body.timezone === "string" && body.timezone.trim() ? body.timezone.trim() : user.timezone,
    currency: typeof body.currency === "string" && body.currency.trim() ? body.currency.trim() : user.currency,
  };
  const updated = await db.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ user: { id: updated.id, name: updated.name, email: updated.email, timezone: updated.timezone, currency: updated.currency } });
}
