import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { tradeSchema } from "@/lib/validation/trade";

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

    if (instrument) where.instrument = { contains: instrument };
    if (market && market !== "ALL") where.market = market;
    if (session && session !== "ALL") where.session = session;
    if (result && result !== "ALL") where.result = result;
    if (direction && direction !== "ALL") where.direction = direction;
    if (grade && grade !== "ALL") where.grade = grade;

    if (search) {
      where.OR = [
        { instrument: { contains: search } },
        { setup: { contains: search } },
        { notes: { contains: search } },
      ];
    }

    try {
      const trades = await db.trade.findMany({
        where,
        include: { images: true },
        orderBy: { date: "desc" },
      });
      return NextResponse.json({ trades });
    } catch (dbErr) {
      console.warn("Local DB connection error, using sample trade fallback:", dbErr);
      const { sampleTrades } = await import("@/lib/mock-data");
      return NextResponse.json({ trades: sampleTrades });
    }
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

    // Automatic calculation calculations fallback
    const entry = tradeData.entryPrice;
    const sl = tradeData.stopLoss;
    const tp = tradeData.takeProfit;
    const exit = tradeData.exitPrice ?? (tradeData.result === "WIN" ? tp : tradeData.result === "LOSS" ? sl : entry);

    const stopDistance = Math.abs(entry - sl);
    const targetDistance = Math.abs(tp - entry);
    const plannedRR = tradeData.plannedRR || (stopDistance > 0 ? Number((targetDistance / stopDistance).toFixed(2)) : 1.0);

    const riskAmt = tradeData.riskAmount || 250.0;
    let actualR = tradeData.actualR !== undefined ? Number(tradeData.actualR) : 0.0;
    let pnl = tradeData.pnl !== undefined ? Number(tradeData.pnl) : 0.0;

    // Auto-calculate PnL if actualR is set but pnl is 0
    if (pnl === 0 && actualR !== 0 && riskAmt > 0) {
      pnl = Number((riskAmt * actualR).toFixed(2));
    }

    // Determine result based on actualR if result was default
    let result = tradeData.result;
    if (actualR > 0 && result === "BREAKEVEN") result = "WIN";
    else if (actualR < 0 && result === "BREAKEVEN") result = "LOSS";
    else if (actualR === 0) result = "BREAKEVEN";

    const trade = await db.trade.create({
      data: {
        userId: user.id,
        date: new Date(tradeData.date),
        instrument: tradeData.instrument.toUpperCase(),
        market: tradeData.market,
        session: tradeData.session,
        direction: tradeData.direction,
        timeframe: tradeData.timeframe,
        entryPrice: tradeData.entryPrice,
        stopLoss: tradeData.stopLoss,
        takeProfit: tradeData.takeProfit,
        exitPrice: exit,
        positionSize: tradeData.positionSize || 1.0,
        riskAmount: riskAmt,
        riskPercentage: tradeData.riskPercentage || 1.0,
        plannedRR: plannedRR,
        actualR: actualR,
        pnl: pnl,
        mae: tradeData.mae !== undefined ? tradeData.mae : null,
        mfe: tradeData.mfe !== undefined ? tradeData.mfe : null,
        commission: tradeData.commission !== undefined ? tradeData.commission : null,
        fees: tradeData.fees !== undefined ? tradeData.fees : null,
        swap: tradeData.swap !== undefined ? tradeData.swap : null,
        slippage: tradeData.slippage !== undefined ? tradeData.slippage : null,
        result: tradeData.result,
        grade: tradeData.grade,
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
        images: {
          create: images.map((img) => ({
            type: img.type,
            url: img.url,
            caption: img.caption || "",
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create trade" }, { status: 400 });
  }
}
