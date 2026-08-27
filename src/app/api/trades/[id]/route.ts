import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const trade = await db.trade.findUnique({
      where: { id: params.id },
      include: { images: true },
    });

    if (!trade || trade.userId !== user.id) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    return NextResponse.json({ trade });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.trade.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    const body = await req.json();

    const updated = await db.trade.update({
      where: { id: params.id },
      data: {
        date: body.date ? new Date(body.date) : existing.date,
        instrument: body.instrument ? body.instrument.toUpperCase() : existing.instrument,
        market: body.market || existing.market,
        session: body.session || existing.session,
        direction: body.direction || existing.direction,
        timeframe: body.timeframe || existing.timeframe,
        entryPrice: body.entryPrice !== undefined ? Number(body.entryPrice) : existing.entryPrice,
        stopLoss: body.stopLoss !== undefined ? Number(body.stopLoss) : existing.stopLoss,
        takeProfit: body.takeProfit !== undefined ? Number(body.takeProfit) : existing.takeProfit,
        exitPrice: body.exitPrice !== undefined ? Number(body.exitPrice) : existing.exitPrice,
        positionSize: body.positionSize !== undefined ? Number(body.positionSize) : existing.positionSize,
        riskAmount: body.riskAmount !== undefined ? Number(body.riskAmount) : existing.riskAmount,
        riskPercentage: body.riskPercentage !== undefined ? Number(body.riskPercentage) : existing.riskPercentage,
        plannedRR: body.plannedRR !== undefined ? Number(body.plannedRR) : existing.plannedRR,
        actualR: body.actualR !== undefined ? Number(body.actualR) : existing.actualR,
        pnl: body.pnl !== undefined ? Number(body.pnl) : existing.pnl,
        result: body.result || existing.result,
        grade: body.grade || existing.grade,
        ictConcepts: Array.isArray(body.ictConcepts) ? JSON.stringify(body.ictConcepts) : existing.ictConcepts,
        setup: body.setup !== undefined ? body.setup : existing.setup,
        htfBias: body.htfBias !== undefined ? body.htfBias : existing.htfBias,
        marketCondition: body.marketCondition !== undefined ? body.marketCondition : existing.marketCondition,
        liquidityTarget: body.liquidityTarget !== undefined ? body.liquidityTarget : existing.liquidityTarget,
        entryModel: body.entryModel !== undefined ? body.entryModel : existing.entryModel,
        confirmation: body.confirmation !== undefined ? body.confirmation : existing.confirmation,
        invalidation: body.invalidation !== undefined ? body.invalidation : existing.invalidation,
        targetReason: body.targetReason !== undefined ? body.targetReason : existing.targetReason,
        reasonForEntry: body.reasonForEntry !== undefined ? body.reasonForEntry : existing.reasonForEntry,
        psychConfidence: body.psychConfidence !== undefined ? Number(body.psychConfidence) : existing.psychConfidence,
        psychPatience: body.psychPatience !== undefined ? Number(body.psychPatience) : existing.psychPatience,
        psychFear: body.psychFear !== undefined ? Number(body.psychFear) : existing.psychFear,
        psychGreed: body.psychGreed !== undefined ? Number(body.psychGreed) : existing.psychGreed,
        psychFOMO: body.psychFOMO !== undefined ? Number(body.psychFOMO) : existing.psychFOMO,
        psychRevenge: body.psychRevenge !== undefined ? Number(body.psychRevenge) : existing.psychRevenge,
        psychDiscipline: body.psychDiscipline !== undefined ? Number(body.psychDiscipline) : existing.psychDiscipline,
        psychStress: body.psychStress !== undefined ? Number(body.psychStress) : existing.psychStress,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
      include: { images: true },
    });

    return NextResponse.json({ trade: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await db.trade.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    await db.trade.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
