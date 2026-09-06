import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/trades/[id]/share: Enable sharing or regenerate share token
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trade = await db.trade.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const regenerate = Boolean(body?.regenerate);
    const isShared = body?.isShared !== undefined ? Boolean(body.isShared) : true;

    // Generate token if not present or requested regeneration
    let shareToken = trade.shareToken;
    if (!shareToken || regenerate) {
      shareToken = crypto.randomBytes(16).toString("hex");
    }

    const updated = await db.trade.update({
      where: { id: params.id },
      data: {
        isShared,
        shareToken,
        sharedAt: isShared ? new Date() : trade.sharedAt,
      },
    });

    return NextResponse.json({
      success: true,
      isShared: updated.isShared,
      shareToken: updated.shareToken,
      sharedAt: updated.sharedAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update share settings" }, { status: 500 });
  }
}

// DELETE /api/trades/[id]/share: Disable/revoke sharing
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trade = await db.trade.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const updated = await db.trade.update({
      where: { id: params.id },
      data: {
        isShared: false,
        shareToken: null,
        sharedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      isShared: false,
      shareToken: null,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to revoke share link" }, { status: 500 });
  }
}
