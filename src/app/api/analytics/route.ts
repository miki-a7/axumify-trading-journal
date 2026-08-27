import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  calculateTradingStats,
  generateEquityCurve,
  calculateTimePeriodRollups,
  filterTrades,
  TradeData,
} from "@/lib/calculations/stats";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      instrument: searchParams.get("instrument") || undefined,
      session: searchParams.get("session") || undefined,
      direction: searchParams.get("direction") || undefined,
      setup: searchParams.get("setup") || undefined,
      market: searchParams.get("market") || undefined,
      result: searchParams.get("result") || undefined,
    };

    let rawTrades: any[] = [];
    try {
      rawTrades = await db.trade.findMany({
        where: { userId: user.id },
        orderBy: { date: "asc" },
      });
    } catch (dbErr) {
      console.warn("Local DB connection error in analytics, using sample trade fallback:", dbErr);
      const { sampleTrades } = await import("@/lib/mock-data");
      rawTrades = sampleTrades;
    }

    // Map Prisma Decimal types to JS numbers
    const trades: TradeData[] = rawTrades.map((t) => ({
      ...t,
      entryPrice: Number(t.entryPrice),
      stopLoss: Number(t.stopLoss),
      takeProfit: Number(t.takeProfit),
      exitPrice: t.exitPrice ? Number(t.exitPrice) : null,
      positionSize: t.positionSize ? Number(t.positionSize) : null,
      riskAmount: t.riskAmount ? Number(t.riskAmount) : null,
      plannedRR: t.plannedRR ? Number(t.plannedRR) : null,
      actualR: Number(t.actualR),
      pnl: Number(t.pnl),
      mae: t.mae ? Number(t.mae) : null,
      mfe: t.mfe ? Number(t.mfe) : null,
      commission: t.commission ? Number(t.commission) : null,
      fees: t.fees ? Number(t.fees) : null,
      swap: t.swap ? Number(t.swap) : null,
      slippage: t.slippage ? Number(t.slippage) : null,
    }));

    // Apply centralized performance filters
    const filteredTrades = filterTrades(trades, filters);

    // Centralized stats & rollups
    const stats = calculateTradingStats(filteredTrades);
    const equityCurve = generateEquityCurve(filteredTrades);
    const timePeriodRollups = calculateTimePeriodRollups(filteredTrades);

    // Grouping by Session
    const sessionMap: Record<string, { trades: number; pnl: number; r: number; wins: number }> = {};
    const setupMap: Record<string, { trades: number; pnl: number; r: number; wins: number }> = {};
    const instrumentMap: Record<string, { trades: number; pnl: number; r: number; wins: number }> = {};
    const dayOfWeekMap: Record<string, { trades: number; pnl: number; r: number; wins: number }> = {};

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    filteredTrades.forEach((t) => {
      const isWin = t.result === "WIN";
      const sess = t.session || "Unknown";
      const setup = t.setup || "Unspecified";
      const inst = t.instrument || "Other";
      const day = daysOfWeek[new Date(t.date).getDay()];

      if (!sessionMap[sess]) sessionMap[sess] = { trades: 0, pnl: 0, r: 0, wins: 0 };
      sessionMap[sess].trades++;
      sessionMap[sess].pnl += t.pnl;
      sessionMap[sess].r += t.actualR;
      if (isWin) sessionMap[sess].wins++;

      if (!setupMap[setup]) setupMap[setup] = { trades: 0, pnl: 0, r: 0, wins: 0 };
      setupMap[setup].trades++;
      setupMap[setup].pnl += t.pnl;
      setupMap[setup].r += t.actualR;
      if (isWin) setupMap[setup].wins++;

      if (!instrumentMap[inst]) instrumentMap[inst] = { trades: 0, pnl: 0, r: 0, wins: 0 };
      instrumentMap[inst].trades++;
      instrumentMap[inst].pnl += t.pnl;
      instrumentMap[inst].r += t.actualR;
      if (isWin) instrumentMap[inst].wins++;

      if (!dayOfWeekMap[day]) dayOfWeekMap[day] = { trades: 0, pnl: 0, r: 0, wins: 0 };
      dayOfWeekMap[day].trades++;
      dayOfWeekMap[day].pnl += t.pnl;
      dayOfWeekMap[day].r += t.actualR;
      if (isWin) dayOfWeekMap[day].wins++;
    });

    const buildBreakdown = (map: Record<string, { trades: number; pnl: number; r: number; wins: number }>) =>
      Object.entries(map).map(([name, val]) => ({
        name,
        trades: val.trades,
        pnl: Number(val.pnl.toFixed(2)),
        r: Number(val.r.toFixed(2)),
        winRate: val.trades > 0 ? Number(((val.wins / val.trades) * 100).toFixed(1)) : 0,
      }));

    return NextResponse.json({
      stats,
      equityCurve,
      timePeriodRollups,
      sessionBreakdown: buildBreakdown(sessionMap),
      setupBreakdown: buildBreakdown(setupMap),
      instrumentBreakdown: buildBreakdown(instrumentMap),
      dayOfWeekBreakdown: buildBreakdown(dayOfWeekMap),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
