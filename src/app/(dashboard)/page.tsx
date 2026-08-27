"use client";

import React, { useEffect, useState } from "react";
import StatCard from "@/components/dashboard/stat-card";
import EquityChart from "@/components/dashboard/equity-chart";
import PerformanceCharts from "@/components/dashboard/performance-charts";
import {
  TrendingUp,
  Percent,
  Calculator,
  Target,
  BarChart2,
  Award,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#38BDF8] animate-spin" />
        <p className="text-sm text-[#94A3B8] font-medium">Computing dynamic trading statistics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-[#0B1220] border border-[#EF4444]/30 text-center space-y-4">
        <p className="text-red-400 font-semibold">{error || "Failed to load dashboard data"}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, equityCurve, sessionBreakdown, setupBreakdown } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0B1220] via-[#101A2B] to-[#0B1220] border border-[#1E293B] shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-white">Trading Performance Dashboard</h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]">
              LIVE DATABASE
            </span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Real-time execution analytics & statistical performance overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#38BDF8] transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/journal/add"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Trade</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Net P&L"
          value={`${stats.netPnl >= 0 ? "+" : ""}$${stats.netPnl.toLocaleString()}`}
          subtitle={`Gross Profit: +$${stats.grossProfit.toLocaleString()}`}
          icon={TrendingUp}
          trend={stats.netPnl >= 0 ? "profit" : "loss"}
          badge={`Max DD: -$${stats.maxDrawdownAmount.toLocaleString()}`}
        />

        <StatCard
          title="Win Rate"
          value={`${stats.winRate}%`}
          subtitle={`${stats.winningTrades} Wins / ${stats.losingTrades} Losses (${stats.breakevenTrades} BE)`}
          icon={Percent}
          trend={stats.winRate >= 50 ? "profit" : "loss"}
          badge={`Target: 60%+`}
        />

        <StatCard
          title="Profit Factor"
          value={stats.profitFactor >= 999 ? "∞" : stats.profitFactor}
          subtitle={`Gross Profit / Gross Loss`}
          icon={Calculator}
          trend={stats.profitFactor >= 1.5 ? "profit" : "loss"}
          badge={`Target: > 2.0`}
        />

        <StatCard
          title="Expectancy"
          value={`${stats.expectancy >= 0 ? "+" : ""}$${stats.expectancy}`}
          subtitle="Expected value per trade"
          icon={Target}
          trend={stats.expectancy >= 0 ? "profit" : "loss"}
          badge={`Average R: +${stats.averageR}R`}
        />
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
        <div className="p-3">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">Total Trades</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {stats.totalTrades}
          </span>
        </div>

        <div className="p-3 border-l border-[#1E293B]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">Average Win</span>
          <span className="text-xl font-mono font-bold text-[#22C55E] mt-1 block">
            +${stats.averageWin.toLocaleString()} <span className="text-xs text-[#94A3B8]">({stats.averageWinR}R)</span>
          </span>
        </div>

        <div className="p-3 border-l border-[#1E293B]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">Average Loss</span>
          <span className="text-xl font-mono font-bold text-[#EF4444] mt-1 block">
            -${stats.averageLoss.toLocaleString()} <span className="text-xs text-[#94A3B8]">({stats.averageLossR}R)</span>
          </span>
        </div>

        <div className="p-3 border-l border-[#1E293B]">
          <span className="text-[11px] font-bold text-[#94A3B8] uppercase block">Max Win Streak</span>
          <span className="text-xl font-mono font-bold text-[#38BDF8] mt-1 block flex items-center gap-1">
            {stats.winningStreak} <span className="text-xs font-sans text-[#94A3B8]">Consecutive</span>
          </span>
        </div>
      </div>

      {/* Equity Curve Component */}
      <EquityChart data={equityCurve} />

      {/* Performance Breakdown Charts */}
      <PerformanceCharts
        winningCount={stats.winningTrades}
        losingCount={stats.losingTrades}
        breakevenCount={stats.breakevenTrades}
        sessionBreakdown={sessionBreakdown}
        setupBreakdown={setupBreakdown}
      />
    </div>
  );
}
