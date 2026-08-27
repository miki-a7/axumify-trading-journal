"use client";

import React, { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/stat-card";
import EquityChart from "@/components/dashboard/equity-chart";
import { BarChart3, Filter, RefreshCw, Calendar, TrendingUp, Award, Zap } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [session, setSession] = useState("");
  const [direction, setDirection] = useState("");
  const [setup, setSetup] = useState("");
  const [result, setResult] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "weekly" | "monthly" | "yearly">("overview");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (session) params.append("session", session);
      if (direction) params.append("direction", direction);
      if (setup) params.append("setup", setup);
      if (result) params.append("result", result);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [session, direction, setup, result]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-[#38BDF8] animate-spin" />
      </div>
    );
  }

  const { stats, equityCurve, timePeriodRollups, sessionBreakdown, setupBreakdown, instrumentBreakdown, dayOfWeekBreakdown } = data || {};

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Central Performance Engine & Analytics</h1>
            <p className="text-xs text-[#94A3B8]">
              Automated PostgreSQL aggregation across daily, weekly, monthly, and yearly timeframes
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#050B14] border border-[#1E293B]">
          {(["overview", "weekly", "monthly", "yearly"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-[#2563EB] text-white shadow-glow"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#38BDF8] mr-2">
          <Filter className="w-4 h-4" />
          <span>Filters:</span>
        </div>

        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-xs font-medium text-white outline-none"
        >
          <option value="">All Sessions</option>
          <option value="Asian">Asian</option>
          <option value="London">London</option>
          <option value="New York">New York</option>
          <option value="London Close">London Close</option>
        </select>

        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-xs font-medium text-white outline-none"
        >
          <option value="">All Directions</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>

        <select
          value={result}
          onChange={(e) => setResult(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-xs font-medium text-white outline-none"
        >
          <option value="">All Results</option>
          <option value="WIN">Win</option>
          <option value="LOSS">Loss</option>
          <option value="BREAKEVEN">Breakeven</option>
        </select>

        {(session || direction || result) && (
          <button
            onClick={() => {
              setSession("");
              setDirection("");
              setResult("");
            }}
            className="text-xs text-[#EF4444] font-bold hover:underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title="Win Rate" value={`${stats.winRate}%`} trend={stats.winRate >= 50 ? "profit" : "loss"} />
          <StatCard title="Profit Factor" value={stats.profitFactor} trend={stats.profitFactor >= 1.5 ? "profit" : "loss"} />
          <StatCard title="Expectancy" value={`+$${stats.expectancy}`} trend={stats.expectancy >= 0 ? "profit" : "loss"} />
          <StatCard title="Total R Returned" value={`+${stats.totalR}R`} trend={stats.totalR >= 0 ? "profit" : "loss"} />
        </div>
      )}

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <>
          {/* Equity Curve */}
          {equityCurve && <EquityChart data={equityCurve} />}

          {/* Distribution Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Performance by Instrument */}
            <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
              <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider">
                Performance by Instrument
              </h2>
              <div className="space-y-2">
                {instrumentBreakdown?.map((item: any) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#050B14] border border-[#1E293B]"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-[#94A3B8]">{item.trades} Trades</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold block ${
                          item.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {item.pnl >= 0 ? `+$${item.pnl}` : `-$${Math.abs(item.pnl)}`}
                      </span>
                      <span className="text-[10px] text-[#38BDF8] font-bold">{item.winRate}% Win Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by Day of Week */}
            <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
              <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider">
                Performance by Day of Week
              </h2>
              <div className="space-y-2">
                {dayOfWeekBreakdown?.map((item: any) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#050B14] border border-[#1E293B]"
                  >
                    <div>
                      <span className="text-xs font-bold text-white block">{item.name}</span>
                      <span className="text-[10px] text-[#94A3B8]">{item.trades} Trades</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold block ${
                          item.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {item.pnl >= 0 ? `+$${item.pnl}` : `-$${Math.abs(item.pnl)}`}
                      </span>
                      <span className="text-[10px] text-[#38BDF8] font-bold">{item.r >= 0 ? `+${item.r}R` : `${item.r}R`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Time Period Breakdown (Weekly, Monthly, Yearly) */}
      {activeTab !== "overview" && timePeriodRollups && (
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider capitalize">
            {activeTab} Performance Aggregations
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050B14] text-[#94A3B8] uppercase border-b border-[#1E293B]">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Trades</th>
                  <th className="p-3">P&L ($)</th>
                  <th className="p-3">Total R</th>
                  <th className="p-3">Win Rate</th>
                  <th className="p-3">Profit Factor</th>
                  <th className="p-3">Best Trade</th>
                  <th className="p-3">Worst Trade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {timePeriodRollups[activeTab]?.map((row: any) => (
                  <tr key={row.periodKey} className="hover:bg-[#101A2B]">
                    <td className="p-3 font-bold text-white">{row.periodKey}</td>
                    <td className="p-3 text-[#94A3B8]">{row.totalTrades} ({row.winningTrades}W/{row.losingTrades}L)</td>
                    <td className={`p-3 font-bold ${row.totalPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {row.totalPnl >= 0 ? `+$${row.totalPnl}` : `-$${Math.abs(row.totalPnl)}`}
                    </td>
                    <td className={`p-3 font-bold ${row.totalR >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                      {row.totalR >= 0 ? `+${row.totalR}R` : `${row.totalR}R`}
                    </td>
                    <td className="p-3 text-[#38BDF8] font-bold">{row.winRate}%</td>
                    <td className="p-3 text-[#F59E0B] font-bold">{row.profitFactor}</td>
                    <td className="p-3 text-[#22C55E]">+${row.bestTradePnl} ({row.bestTradeR}R)</td>
                    <td className="p-3 text-[#EF4444]">-${Math.abs(row.worstTradePnl)} ({row.worstTradeR}R)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
