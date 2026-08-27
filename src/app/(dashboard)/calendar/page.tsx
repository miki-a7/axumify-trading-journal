"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  RefreshCw,
  X,
  Award,
  DollarSign,
  Percent,
  Target,
} from "lucide-react";
import Link from "next/link";
import { calculateTradingStats, getISOWeekKey, TradeData } from "@/lib/calculations/stats";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026 default
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayTrades, setSelectedDayTrades] = useState<any[] | null>(null);
  const [selectedDayTitle, setSelectedDayTitle] = useState("");

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trades");
      if (res.ok) {
        const json = await res.json();
        setTrades(json.trades || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const todayMonth = () => setCurrentDate(new Date(2026, 7, 1));

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map trades into daily buckets
  const dailyMap: Record<string, any[]> = {};
  const monthTrades: any[] = [];

  trades.forEach((t) => {
    const tDate = new Date(t.date);
    if (tDate.getFullYear() === year && tDate.getMonth() === month) {
      monthTrades.push(t);
      const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(tDate.getDate()).padStart(2, "0")}`;
      if (!dailyMap[key]) dailyMap[key] = [];
      dailyMap[key].push(t);
    }
  });

  // Calculate overall monthly stats from raw trade records
  const monthStats = calculateTradingStats(
    monthTrades.map((t) => ({
      ...t,
      entryPrice: Number(t.entryPrice),
      stopLoss: Number(t.stopLoss),
      takeProfit: Number(t.takeProfit),
      actualR: Number(t.actualR),
      pnl: Number(t.pnl),
    }))
  );

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Build calendar weeks (7 days + 1 summary column)
  const calendarRows: Array<Array<any | null>> = [];
  let currentWeek: Array<any | null> = [];

  // Pad beginning of first week
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTrades = dailyMap[key] || [];

    const stats = calculateTradingStats(
      dayTrades.map((t) => ({
        ...t,
        entryPrice: Number(t.entryPrice),
        stopLoss: Number(t.stopLoss),
        takeProfit: Number(t.takeProfit),
        actualR: Number(t.actualR),
        pnl: Number(t.pnl),
      }))
    );

    currentWeek.push({
      dateStr: key,
      dayNumber: day,
      tradesCount: stats.totalTrades,
      wins: stats.winningTrades,
      losses: stats.losingTrades,
      be: stats.breakevenTrades,
      winRate: stats.winRate,
      pnl: stats.netPnl,
      r: stats.totalR,
      trades: dayTrades,
    });

    if (currentWeek.length === 7) {
      calendarRows.push(currentWeek);
      currentWeek = [];
    }
  }

  // Pad end of last week if incomplete
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    calendarRows.push(currentWeek);
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {monthNames[month]} {year}
            </h1>
            <p className="text-xs text-[#94A3B8]">
              Automated central daily and weekly performance matrix
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={todayMonth}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#101A2B] border border-[#1E293B] text-white hover:border-[#2563EB]"
          >
            Current Month
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Performance Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Monthly P&L</span>
          <span
            className={`text-lg font-extrabold font-mono ${
              monthStats.netPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}
          >
            {monthStats.netPnl >= 0 ? `+$${monthStats.netPnl}` : `-$${Math.abs(monthStats.netPnl)}`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total R</span>
          <span
            className={`text-lg font-extrabold font-mono ${
              monthStats.totalR >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
            }`}
          >
            {monthStats.totalR >= 0 ? `+${monthStats.totalR}R` : `${monthStats.totalR}R`}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Trades</span>
          <span className="text-lg font-extrabold font-mono text-white">
            {monthStats.totalTrades} ({monthStats.winningTrades}W / {monthStats.losingTrades}L)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Win Rate</span>
          <span className="text-lg font-extrabold font-mono text-[#38BDF8]">
            {monthStats.winRate}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Profit Factor</span>
          <span className="text-lg font-extrabold font-mono text-[#F59E0B]">
            {monthStats.profitFactor}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-center">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Expectancy</span>
          <span className="text-lg font-extrabold font-mono text-white">
            ${monthStats.expectancy}
          </span>
        </div>
      </div>

      {/* Days of Week + Weekly Summary Header */}
      <div className="grid grid-cols-8 gap-2 text-center text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-2.5 rounded-xl bg-[#0B1220]/60 border border-[#1E293B]">
            {day}
          </div>
        ))}
        <div className="py-2.5 rounded-xl bg-[#101A2B] border border-[#2563EB]/40 text-[#38BDF8]">
          Weekly Total
        </div>
      </div>

      {/* Calendar Grid Rows (7 Days + 1 Weekly Total Column) */}
      <div className="space-y-2.5">
        {calendarRows.map((week, rowIdx) => {
          // Calculate weekly totals from the active week cells
          const weekTrades: any[] = [];
          week.forEach((cell) => {
            if (cell && cell.trades) {
              weekTrades.push(...cell.trades);
            }
          });

          const weekStats = calculateTradingStats(
            weekTrades.map((t) => ({
              ...t,
              entryPrice: Number(t.entryPrice),
              stopLoss: Number(t.stopLoss),
              takeProfit: Number(t.takeProfit),
              actualR: Number(t.actualR),
              pnl: Number(t.pnl),
            }))
          );

          return (
            <div key={`row-${rowIdx}`} className="grid grid-cols-8 gap-2.5">
              {week.map((cell, colIdx) => {
                if (!cell) {
                  return (
                    <div
                      key={`empty-${rowIdx}-${colIdx}`}
                      className="min-h-[115px] p-2 rounded-2xl bg-[#050B14]/40 border border-[#1E293B]/40 opacity-30"
                    />
                  );
                }

                const hasTrades = cell.tradesCount > 0;
                const isProfitable = cell.pnl > 0;
                const isLosing = cell.pnl < 0;

                return (
                  <div
                    key={cell.dateStr}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDayTrades(cell.trades);
                        setSelectedDayTitle(`${monthNames[month]} ${cell.dayNumber}, ${year}`);
                      }
                    }}
                    className={`min-h-[115px] p-2.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      hasTrades
                        ? isProfitable
                          ? "bg-[#22C55E]/10 border-[#22C55E]/40 hover:border-[#22C55E]"
                          : isLosing
                          ? "bg-[#EF4444]/10 border-[#EF4444]/40 hover:border-[#EF4444]"
                          : "bg-[#F59E0B]/10 border-[#F59E0B]/40"
                        : "bg-[#0B1220] border-[#1E293B] hover:border-[#2563EB]/40 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-[#94A3B8]">{cell.dayNumber}</span>
                      {hasTrades && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#050B14] text-[#38BDF8]">
                          {cell.tradesCount} {cell.tradesCount === 1 ? "trade" : "trades"}
                        </span>
                      )}
                    </div>

                    {hasTrades ? (
                      <div className="mt-1.5 space-y-1">
                        {/* Daily P&L */}
                        <div
                          className={`text-sm font-extrabold font-mono ${
                            isProfitable ? "text-[#22C55E]" : isLosing ? "text-[#EF4444]" : "text-white"
                          }`}
                        >
                          {isProfitable ? `+$${cell.pnl}` : `-$${Math.abs(cell.pnl)}`}
                        </div>

                        {/* Breakdown: 3 trades · 2W/1L · 67% · +2.6R */}
                        <div className="text-[10px] text-[#94A3B8] font-mono leading-tight">
                          <span>{cell.wins}W/{cell.losses}L</span>
                          <span className="mx-1">•</span>
                          <span>{cell.winRate}%</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className={cell.r >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                            {cell.r >= 0 ? `+${cell.r}R` : `${cell.r}R`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#64748B] font-medium">No Trades</div>
                    )}
                  </div>
                );
              })}

              {/* Weekly Summary Column on Right */}
              <div
                className={`min-h-[115px] p-3 rounded-2xl border flex flex-col justify-between ${
                  weekStats.totalTrades > 0
                    ? weekStats.netPnl >= 0
                      ? "bg-[#101A2B] border-[#22C55E]/40"
                      : "bg-[#101A2B] border-[#EF4444]/40"
                    : "bg-[#0B1220]/80 border-[#1E293B] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-wider">
                    Week {rowIdx + 1}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#94A3B8]">
                    {weekStats.totalTrades} T
                  </span>
                </div>

                {weekStats.totalTrades > 0 ? (
                  <div className="space-y-1 my-auto">
                    <div
                      className={`text-sm font-extrabold font-mono ${
                        weekStats.netPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                      }`}
                    >
                      {weekStats.netPnl >= 0 ? `+$${weekStats.netPnl}` : `-$${Math.abs(weekStats.netPnl)}`}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold font-mono">
                      <span className={weekStats.totalR >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}>
                        {weekStats.totalR >= 0 ? `+${weekStats.totalR}R` : `${weekStats.totalR}R`}
                      </span>
                      <span className="text-[#38BDF8]">{weekStats.winRate}% WR</span>
                    </div>
                    <div className="text-[9px] text-[#94A3B8] font-mono">PF: {weekStats.profitFactor}</div>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#64748B] font-medium text-center my-auto">
                    No Activity
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Trades Popup Modal */}
      {selectedDayTrades && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-2xl w-full p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-lg font-bold text-white">Trades on {selectedDayTitle}</h2>
              <button
                onClick={() => setSelectedDayTrades(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {selectedDayTrades.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#050B14] border border-[#1E293B]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{t.instrument}</span>
                    <span
                      className={`text-xs font-bold ${
                        t.direction === "LONG" ? "text-[#22C55E]" : "text-[#EF4444]"
                      }`}
                    >
                      {t.direction}
                    </span>
                    <span className="text-xs text-[#94A3B8]">{t.session}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`font-mono font-bold text-xs ${
                        Number(t.actualR) >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                      }`}
                    >
                      {Number(t.actualR) >= 0 ? `+${Number(t.actualR)}R` : `${Number(t.actualR)}R`}
                    </span>
                    <span
                      className={`font-mono font-extrabold text-xs ${
                        Number(t.pnl) >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                      }`}
                    >
                      {Number(t.pnl) >= 0 ? `+$${Number(t.pnl)}` : `-$${Math.abs(Number(t.pnl))}`}
                    </span>
                    <Link
                      href={`/journal/${t.id}`}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8]"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
