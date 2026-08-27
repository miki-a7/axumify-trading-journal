import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const backtests = await db.backtestTrade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ backtests });
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

    const stopDist = Math.abs(entry - sl);
    const targetDist = Math.abs(tp - entry);
    const plannedR = stopDist > 0 ? targetDist / stopDist : 1.0;
    const rMultiple = body.result === "WIN" ? plannedR : body.result === "LOSS" ? -1.0 : 0.0;
    const pnl = body.result === "WIN" ? 200 * rMultiple : body.result === "LOSS" ? -200 : 0;

    const backtest = await db.backtestTrade.create({
      data: {
        userId: user.id,
        date: new Date(body.date || Date.now()),
        instrument: body.instrument.toUpperCase(),
        session: body.session || "New York",
        setup: body.setup || "ICT FVG",
        direction: body.direction,
        entryPrice: entry,
        stopLoss: sl,
        takeProfit: tp,
        exitPrice: exit,
        result: body.result,
        rMultiple: Number(rMultiple.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        notes: body.notes || "",
      },
    });

    return NextResponse.json({ backtest }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
