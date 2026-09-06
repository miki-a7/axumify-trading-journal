import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const backtests = await db.backtestTrade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    const serialized = backtests.map((b) => ({
      ...b,
      entryPrice: Number(b.entryPrice),
      stopLoss: Number(b.stopLoss),
      takeProfit: Number(b.takeProfit),
      exitPrice: Number(b.exitPrice),
      rMultiple: Number(b.rMultiple),
      pnl: Number(b.pnl),
    }));

    return NextResponse.json({ backtests: serialized });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const entry = Number(body.entryPrice);
    const sl = Number(body.stopLoss);
    const tp = Number(body.takeProfit);
    const exit = Number(body.exitPrice || (body.result === "WIN" ? tp : sl));
    const direction = body.direction === "SHORT" ? "SHORT" : "LONG";

    let riskDist = Math.abs(direction === "LONG" ? entry - sl : sl - entry);
    let rewardDist = Math.abs(direction === "LONG" ? tp - entry : entry - tp);
    let calcR = riskDist > 0 && rewardDist > 0 ? rewardDist / riskDist : 1.0;

    const rMultiple = body.result === "WIN" ? calcR : body.result === "LOSS" ? -1.0 : 0.0;
    const pnl = body.result === "WIN" ? 200 * calcR : body.result === "LOSS" ? -200 : 0;

    const backtest = await db.backtestTrade.create({
      data: {
        userId: user.id,
        date: new Date(body.date || Date.now()),
        instrument: (body.instrument || "EURUSD").toUpperCase().trim(),
        session: body.session || "",
        setup: body.setup || "",
        direction,
        entryPrice: entry,
        stopLoss: sl,
        takeProfit: tp,
        exitPrice: exit,
        result: body.result || "BREAKEVEN",
        rMultiple: Number(rMultiple.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        notes: body.notes || "",
        imageUrl: body.imageUrl || null,
      },
    });

    return NextResponse.json({
      backtest: {
        ...backtest,
        entryPrice: Number(backtest.entryPrice),
        stopLoss: Number(backtest.stopLoss),
        takeProfit: Number(backtest.takeProfit),
        exitPrice: Number(backtest.exitPrice),
        rMultiple: Number(backtest.rMultiple),
        pnl: Number(backtest.pnl),
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing backtest trade ID" }, { status: 400 });

    const existing = await db.backtestTrade.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Backtest trade not found" }, { status: 404 });
    }

    await db.backtestTrade.deleteMany({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
