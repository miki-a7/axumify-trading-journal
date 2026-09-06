import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { tradeUpdateSchema, serializeTrade } from "@/lib/validation/trade";
import { calculateSingleTradeMetrics } from "@/lib/calculations/stats";
import { resolveImageUrl } from "@/lib/supabase/admin";
import { resolveTradeImagesForApi } from "@/lib/images/trade-image";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trade = await db.trade.findFirst({
      where: { id: params.id, userId: user.id },
      include: { images: true },
    });

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const serialized = serializeTrade(trade);
    if (serialized && serialized.images) {
      serialized.images = await resolveTradeImagesForApi(serialized.images, resolveImageUrl);
    }

    return NextResponse.json({ trade: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch trade" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.trade.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = tradeUpdateSchema.parse(body);

    const entry = validated.entryPrice !== undefined
      ? (validated.entryPrice !== null ? Number(validated.entryPrice) : null)
      : (existing.entryPrice !== null ? Number(existing.entryPrice) : null);
    const sl = validated.stopLoss !== undefined
      ? (validated.stopLoss !== null ? Number(validated.stopLoss) : null)
      : (existing.stopLoss !== null ? Number(existing.stopLoss) : null);
    const tp = validated.takeProfit !== undefined
      ? (validated.takeProfit !== null ? Number(validated.takeProfit) : null)
      : (existing.takeProfit !== null ? Number(existing.takeProfit) : null);

    let exit: number | null = null;
    if (validated.exitPrice !== undefined) {
      exit = validated.exitPrice !== null && !isNaN(Number(validated.exitPrice)) ? Number(validated.exitPrice) : null;
    } else {
      exit = existing.exitPrice !== null ? Number(existing.exitPrice) : null;
    }

    const direction = validated.direction || existing.direction;
    const riskAmt = validated.riskAmount !== undefined && validated.riskAmount !== null
      ? Number(validated.riskAmount)
      : (existing.riskAmount !== null ? Number(existing.riskAmount) : 300.0);
    // Use actualR from payload (takes precedence) or fall back to existing plannedRR as magnitude
    const rrMagnitudeInput = validated.actualR !== undefined && validated.actualR !== null && Number(validated.actualR) > 0
      ? Number(validated.actualR)
      : (validated.plannedRR !== undefined && validated.plannedRR !== null
          ? Number(validated.plannedRR)
          : (existing.plannedRR !== null ? Number(existing.plannedRR) : 2.0));

    const metrics = calculateSingleTradeMetrics({
      direction: direction,
      entryPrice: entry,
      stopLoss: sl,
      takeProfit: tp,
      exitPrice: exit,
      actualR: rrMagnitudeInput,
      riskAmount: riskAmt,
      result: validated.result || existing.result,
    });

    const plannedRR = metrics.plannedRR;
    const actualR = metrics.actualR;
    const pnl = metrics.pnl;
    const result = metrics.result;

    const possibleRR = validated.possibleRR !== undefined
      ? (validated.possibleRR !== null ? Number(validated.possibleRR) : null)
      : existing.possibleRR;

    const updated = await db.trade.update({
      where: { id: params.id },
      data: {
        date: validated.date ? new Date(validated.date) : existing.date,
        instrument: validated.instrument ? validated.instrument.toUpperCase().trim() : existing.instrument,
        market: validated.market !== undefined ? validated.market : existing.market,
        session: validated.session !== undefined ? validated.session : existing.session,
        direction: direction,
        timeframe: validated.timeframe !== undefined ? validated.timeframe : existing.timeframe,
        entryPrice: entry,
        stopLoss: sl,
        takeProfit: tp,
        exitPrice: exit,
        positionSize: validated.positionSize !== undefined
          ? (validated.positionSize !== null ? Number(validated.positionSize) : null)
          : existing.positionSize,
        riskAmount: riskAmt,
        riskPercentage: validated.riskPercentage !== undefined
          ? (validated.riskPercentage !== null ? Number(validated.riskPercentage) : null)
          : existing.riskPercentage,
        plannedRR: plannedRR,
        possibleRR: possibleRR,
        actualR: actualR,
        pnl: pnl,
        mae: validated.mae !== undefined
          ? (validated.mae !== null ? Number(validated.mae) : null)
          : existing.mae,
        mfe: validated.mfe !== undefined
          ? (validated.mfe !== null ? Number(validated.mfe) : null)
          : existing.mfe,
        commission: validated.commission !== undefined
          ? (validated.commission !== null ? Number(validated.commission) : null)
          : existing.commission,
        fees: validated.fees !== undefined
          ? (validated.fees !== null ? Number(validated.fees) : null)
          : existing.fees,
        swap: validated.swap !== undefined
          ? (validated.swap !== null ? Number(validated.swap) : null)
          : existing.swap,
        slippage: validated.slippage !== undefined
          ? (validated.slippage !== null ? Number(validated.slippage) : null)
          : existing.slippage,
        result: result,
        grade: validated.grade !== undefined ? (validated.grade || null) : existing.grade,
        ictConcepts: validated.ictConcepts !== undefined ? JSON.stringify(validated.ictConcepts) : existing.ictConcepts,
        setup: validated.setup !== undefined ? validated.setup : existing.setup,
        customTags: validated.customTags !== undefined ? JSON.stringify(validated.customTags) : existing.customTags,
        htfBias: validated.htfBias !== undefined ? validated.htfBias : existing.htfBias,
        marketCondition: validated.marketCondition !== undefined ? validated.marketCondition : existing.marketCondition,
        liquidityTarget: validated.liquidityTarget !== undefined ? validated.liquidityTarget : existing.liquidityTarget,
        entryModel: validated.entryModel !== undefined ? validated.entryModel : existing.entryModel,
        confirmation: validated.confirmation !== undefined ? validated.confirmation : existing.confirmation,
        invalidation: validated.invalidation !== undefined ? validated.invalidation : existing.invalidation,
        targetReason: validated.targetReason !== undefined ? validated.targetReason : existing.targetReason,
        reasonForEntry: validated.reasonForEntry !== undefined ? validated.reasonForEntry : existing.reasonForEntry,
        psychConfidence: validated.psychConfidence !== undefined ? Number(validated.psychConfidence) : existing.psychConfidence,
        psychPatience: validated.psychPatience !== undefined ? Number(validated.psychPatience) : existing.psychPatience,
        psychFear: validated.psychFear !== undefined ? Number(validated.psychFear) : existing.psychFear,
        psychGreed: validated.psychGreed !== undefined ? Number(validated.psychGreed) : existing.psychGreed,
        psychFOMO: validated.psychFOMO !== undefined ? Number(validated.psychFOMO) : existing.psychFOMO,
        psychRevenge: validated.psychRevenge !== undefined ? Number(validated.psychRevenge) : existing.psychRevenge,
        psychDiscipline: validated.psychDiscipline !== undefined ? Number(validated.psychDiscipline) : existing.psychDiscipline,
        psychStress: validated.psychStress !== undefined ? Number(validated.psychStress) : existing.psychStress,
        emotionBefore: validated.emotionBefore !== undefined ? validated.emotionBefore : existing.emotionBefore,
        emotionDuring: validated.emotionDuring !== undefined ? validated.emotionDuring : existing.emotionDuring,
        emotionAfter: validated.emotionAfter !== undefined ? validated.emotionAfter : existing.emotionAfter,
        followedPlan: validated.followedPlan !== undefined ? Boolean(validated.followedPlan) : existing.followedPlan,
        brokeRule: validated.brokeRule !== undefined ? Boolean(validated.brokeRule) : existing.brokeRule,
        enteredTooEarly: validated.enteredTooEarly !== undefined ? Boolean(validated.enteredTooEarly) : existing.enteredTooEarly,
        movedSL: validated.movedSL !== undefined ? Boolean(validated.movedSL) : existing.movedSL,
        closedEarly: validated.closedEarly !== undefined ? Boolean(validated.closedEarly) : existing.closedEarly,
        overtraded: validated.overtraded !== undefined ? Boolean(validated.overtraded) : existing.overtraded,
        mistakes: validated.mistakes !== undefined ? JSON.stringify(validated.mistakes) : existing.mistakes,
        positives: validated.positives !== undefined ? JSON.stringify(validated.positives) : existing.positives,
        notes: validated.notes !== undefined ? validated.notes : existing.notes,
        gc: validated.gc !== undefined ? validated.gc : existing.gc,
        ec: validated.ec !== undefined ? validated.ec : existing.ec,
        images: Array.isArray(body.images) ? {
          deleteMany: {},
          create: body.images
            .filter((img: any) => img && img.url && typeof img.url === "string" && img.url.trim() !== "")
            .map((img: any) => ({
              type: img.type || "ENTRY",
              url: img.url,
              caption: img.caption || "",
            })),
        } : undefined,
      },
      include: { images: true },
    });

    const serialized = serializeTrade(updated);
    if (serialized && serialized.images) {
      serialized.images = await resolveTradeImagesForApi(serialized.images, resolveImageUrl);
    }

    return NextResponse.json({ trade: serialized });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: `Validation Error: ${issues}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to update trade" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.trade.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    await db.trade.deleteMany({
      where: { id: params.id, userId: user.id },
    });
    return NextResponse.json({ success: true, id: params.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete trade" }, { status: 500 });
  }
}
