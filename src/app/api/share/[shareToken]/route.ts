import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolveImageUrl } from "@/lib/supabase/admin";
import { resolveTradeImagesForApi } from "@/lib/images/trade-image";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { shareToken: string } }) {
  try {
    const { shareToken } = params;
    if (!shareToken || shareToken.trim() === "") {
      return NextResponse.json({ error: "Share token is required" }, { status: 400 });
    }

    const trade = await db.trade.findUnique({
      where: { shareToken },
      include: { images: true },
    });

    if (!trade || !trade.isShared) {
      return NextResponse.json(
        { error: "This shared trade is no longer available or sharing is disabled" },
        { status: 404 }
      );
    }

    // Resolve images with signed URLs
    const resolvedImages = trade.images?.length
      ? await resolveTradeImagesForApi(trade.images, resolveImageUrl)
      : [];

    // Return strictly sanitized public trade details
    const sanitizedTrade = {
      id: trade.id,
      date: trade.date,
      instrument: trade.instrument,
      market: trade.market,
      session: trade.session,
      direction: trade.direction,
      timeframe: trade.timeframe,
      entryPrice: trade.entryPrice !== null ? Number(trade.entryPrice) : null,
      stopLoss: trade.stopLoss !== null ? Number(trade.stopLoss) : null,
      takeProfit: trade.takeProfit !== null ? Number(trade.takeProfit) : null,
      exitPrice: trade.exitPrice !== null ? Number(trade.exitPrice) : null,
      positionSize: trade.positionSize !== null ? Number(trade.positionSize) : null,
      riskAmount: trade.riskAmount !== null ? Number(trade.riskAmount) : null,
      riskPercentage: trade.riskPercentage !== null ? Number(trade.riskPercentage) : null,
      plannedRR: trade.plannedRR !== null ? Number(trade.plannedRR) : null,
      possibleRR: trade.possibleRR !== null ? Number(trade.possibleRR) : null,
      actualR: Number(trade.actualR),
      pnl: Number(trade.pnl),
      result: trade.result,
      grade: trade.grade,
      ictConcepts: (() => {
        try {
          return JSON.parse(trade.ictConcepts || "[]");
        } catch {
          return [];
        }
      })(),
      setup: trade.setup || "",
      customTags: (() => {
        try {
          return JSON.parse(trade.customTags || "[]");
        } catch {
          return [];
        }
      })(),
      gc: trade.gc || "",
      ec: trade.ec || "",
      htfBias: trade.htfBias || "",
      marketCondition: trade.marketCondition || "",
      liquidityTarget: trade.liquidityTarget || "",
      entryModel: trade.entryModel || "",
      confirmation: trade.confirmation || "",
      invalidation: trade.invalidation || "",
      targetReason: trade.targetReason || "",
      reasonForEntry: trade.reasonForEntry || "",
      psychConfidence: trade.psychConfidence,
      psychPatience: trade.psychPatience,
      psychDiscipline: trade.psychDiscipline,
      emotionBefore: trade.emotionBefore || "",
      emotionDuring: trade.emotionDuring || "",
      emotionAfter: trade.emotionAfter || "",
      followedPlan: trade.followedPlan,
      mistakes: (() => {
        try {
          return JSON.parse(trade.mistakes || "[]");
        } catch {
          return [];
        }
      })(),
      positives: (() => {
        try {
          return JSON.parse(trade.positives || "[]");
        } catch {
          return [];
        }
      })(),
      notes: trade.notes || "",
      images: resolvedImages,
      sharedAt: trade.sharedAt,
    };

    return NextResponse.json({ trade: sanitizedTrade });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load shared trade" }, { status: 500 });
  }
}
