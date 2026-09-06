import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    // Full JSON Journal Data Export
    if (format === "json") {
      const [trades, goals, propAccounts, checklists, rules, backtestTrades] = await Promise.all([
        db.trade.findMany({ where: { userId: user.id }, include: { images: true }, orderBy: { date: "desc" } }),
        db.goal.findMany({ where: { userId: user.id } }),
        db.propAccount.findMany({ where: { userId: user.id } }),
        db.checklist.findMany({ where: { userId: user.id }, include: { items: true } }),
        db.tradingRule.findMany({ where: { userId: user.id } }),
        db.backtestTrade.findMany({ where: { userId: user.id } }),
      ]);

      const journalBackup = {
        app: "AXUMIFY Personal Trading Journal",
        version: "1.0.0",
        exportedAt: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        data: {
          trades,
          goals,
          propAccounts,
          checklists,
          tradingRules: rules,
          backtestTrades,
        },
      };

      return new NextResponse(JSON.stringify(journalBackup, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename=axumify_personal_journal_backup_${new Date().toISOString().split("T")[0]}.json`,
        },
      });
    }

    // Default CSV Export
    const trades = await db.trade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    const headers = [
      "Trade ID",
      "Date",
      "Instrument",
      "Market",
      "Session",
      "Direction",
      "Entry Price",
      "Stop Loss",
      "Take Profit",
      "Exit Price",
      "Position Size",
      "Risk ($)",
      "Actual R:R",
      "Possible R:R",
      "Actual R",
      "P&L ($)",
      "MAE",
      "MFE",
      "Commission",
      "Fees",
      "Swap",
      "Slippage",
      "Result",
      "Grade",
      "Setup",
      "GC (General Confluence)",
      "EC (Execution Confluence)",
      "HTF Bias",
      "Notes",
    ];

    const rows = trades.map((t) => [
      t.id,
      new Date(t.date).toISOString().split("T")[0],
      t.instrument,
      t.market,
      t.session,
      t.direction,
      t.entryPrice,
      t.stopLoss,
      t.takeProfit,
      t.exitPrice || "",
      t.positionSize || "",
      t.riskAmount || "",
      t.actualR,
      t.possibleRR || "",
      Number(t.actualR) >= 0 ? `+${Number(t.actualR).toFixed(2)}` : `${Number(t.actualR).toFixed(2)}`,
      t.pnl,
      t.mae || "",
      t.mfe || "",
      t.commission || "",
      t.fees || "",
      t.swap || "",
      t.slippage || "",
      t.result,
      t.grade || "",
      `"${(t.setup || "").replace(/"/g, '""')}"`,
      `"${(t.gc || "").replace(/"/g, '""')}"`,
      `"${(t.ec || "").replace(/"/g, '""')}"`,
      t.htfBias || "",
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=axumify_journal_export_${new Date().toISOString().split("T")[0]}.csv`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
