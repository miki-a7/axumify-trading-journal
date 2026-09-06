import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { tradeSchema, serializeTrade } from "@/lib/validation/trade";
import { calculateSingleTradeMetrics } from "@/lib/calculations/stats";
import { resolveImageUrl } from "@/lib/supabase/admin";
import { resolveTradeImagesForApi } from "@/lib/images/trade-image";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const instrument = searchParams.get("instrument");
    const market = searchParams.get("market");
    const session = searchParams.get("session");
    const result = searchParams.get("result");
    const direction = searchParams.get("direction");
    const grade = searchParams.get("grade");
    const search = searchParams.get("search");

    const where: any = { userId: user.id };

    if (instrument && instrument !== "ALL") {
      where.instrument = { contains: instrument, mode: "insensitive" };
    }
    if (market && market !== "ALL") where.market = market;
    if (session && session !== "ALL") where.session = session;
    if (result && result !== "ALL") where.result = result;
    if (direction && direction !== "ALL") where.direction = direction;
    if (grade && grade !== "ALL") where.grade = grade;

    if (search && search.trim() !== "") {
      const q = search.trim();
      where.OR = [
        { instrument: { contains: q, mode: "insensitive" } },
        { setup: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    const trades = await db.trade.findMany({
      where,
      include: { images: true },
      orderBy: { date: "desc" },
    });

    const serializedTrades = await Promise.all(
      trades.map(async (t) => {
        const serialized = serializeTrade(t);
        if (serialized && serialized.images) {
          serialized.images = await resolveTradeImagesForApi(serialized.images, resolveImageUrl);
        }
        return serialized;
      })
    );

    return NextResponse.json({ trades: serializedTrades });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch trades" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = tradeSchema.parse(body);

    const { images, ...tradeData } = validated;

    const metrics = calculateSingleTradeMetrics({
      direction: tradeData.direction,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      takeProfit: tradeData.takeProfit,
      exitPrice: tradeData.exitPrice,
      plannedRR: tradeData.plannedRR,
      riskAmount: tradeData.riskAmount,
      actualR: tradeData.actualR,
      pnl: tradeData.pnl,
      result: tradeData.result,
    });

    const exit = tradeData.exitPrice !== undefined && tradeData.exitPrice !== null ? tradeData.exitPrice : null;
    const possRR = tradeData.possibleRR !== undefined && tradeData.possibleRR !== null ? tradeData.possibleRR : null;

    const trade = await db.trade.create({
      data: {
        userId: user.id,
        date: new Date(tradeData.date),
        instrument: tradeData.instrument.toUpperCase().trim(),
        market: tradeData.market,
        session: tradeData.session,
        direction: tradeData.direction,
        timeframe: tradeData.timeframe || "15m",
        entryPrice: tradeData.entryPrice !== undefined ? tradeData.entryPrice : null,
        stopLoss: tradeData.stopLoss !== undefined ? tradeData.stopLoss : null,
        takeProfit: tradeData.takeProfit !== undefined ? tradeData.takeProfit : null,
        exitPrice: exit,
        positionSize: tradeData.positionSize !== undefined ? tradeData.positionSize : null,
        riskAmount: tradeData.riskAmount !== undefined ? tradeData.riskAmount : 300.0,
        riskPercentage: tradeData.riskPercentage !== undefined ? tradeData.riskPercentage : null,
        plannedRR: metrics.plannedRR,
        possibleRR: possRR,
        actualR: metrics.actualR,
        pnl: metrics.pnl,
        mae: tradeData.mae !== undefined ? tradeData.mae : null,
        mfe: tradeData.mfe !== undefined ? tradeData.mfe : null,
        commission: tradeData.commission !== undefined ? tradeData.commission : null,
        fees: tradeData.fees !== undefined ? tradeData.fees : null,
        swap: tradeData.swap !== undefined ? tradeData.swap : null,
        slippage: tradeData.slippage !== undefined ? tradeData.slippage : null,
        result: metrics.result,
        grade: tradeData.grade || null,
        ictConcepts: JSON.stringify(tradeData.ictConcepts || []),
        setup: tradeData.setup || "",
        customTags: JSON.stringify(tradeData.customTags || []),
        htfBias: tradeData.htfBias || "",
        marketCondition: tradeData.marketCondition || "",
        liquidityTarget: tradeData.liquidityTarget || "",
        entryModel: tradeData.entryModel || "",
        confirmation: tradeData.confirmation || "",
        invalidation: tradeData.invalidation || "",
        targetReason: tradeData.targetReason || "",
        reasonForEntry: tradeData.reasonForEntry || "",
        psychConfidence: tradeData.psychConfidence,
        psychPatience: tradeData.psychPatience,
        psychFear: tradeData.psychFear,
        psychGreed: tradeData.psychGreed,
        psychFOMO: tradeData.psychFOMO,
        psychRevenge: tradeData.psychRevenge,
        psychDiscipline: tradeData.psychDiscipline,
        psychStress: tradeData.psychStress,
        emotionBefore: tradeData.emotionBefore || "",
        emotionDuring: tradeData.emotionDuring || "",
        emotionAfter: tradeData.emotionAfter || "",
        followedPlan: tradeData.followedPlan,
        brokeRule: tradeData.brokeRule,
        enteredTooEarly: tradeData.enteredTooEarly,
        movedSL: tradeData.movedSL,
        closedEarly: tradeData.closedEarly,
        overtraded: tradeData.overtraded,
        mistakes: JSON.stringify(tradeData.mistakes || []),
        positives: JSON.stringify(tradeData.positives || []),
        notes: tradeData.notes || "",
        gc: tradeData.gc || "",
        ec: tradeData.ec || "",
        images: {
          create: (images || [])
            .filter((img) => img && img.url && typeof img.url === "string" && img.url.trim() !== "")
            .map((img) => ({
              type: img.type,
              url: img.url,
              caption: img.caption || "",
            })),
        },
      },
      include: { images: true },
    });

    const serialized = serializeTrade(trade);
    if (serialized && serialized.images) {
      serialized.images = await resolveTradeImagesForApi(serialized.images, resolveImageUrl);
    }

    return NextResponse.json({ trade: serialized }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const issues = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      return NextResponse.json({ error: `Validation Error: ${issues}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to create trade" }, { status: 400 });
  }
}

