"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BreakdownItem {
  name: string;
  trades: number;
  pnl: number;
  r: number;
  winRate: number;
}

interface PerformanceChartsProps {
  winningCount: number;
  losingCount: number;
  breakevenCount: number;
  sessionBreakdown: BreakdownItem[];
  setupBreakdown: BreakdownItem[];
}

export default function PerformanceCharts({
  winningCount,
  losingCount,
  breakevenCount,
  sessionBreakdown,
  setupBreakdown,
}: PerformanceChartsProps) {
  const pieData = [
    { name: "Wins", value: winningCount, color: "#22C55E" },
    { name: "Losses", value: losingCount, color: "#EF4444" },
    { name: "Break-even", value: breakevenCount, color: "#F59E0B" },
  ].filter((d) => d.value > 0);

  const total = winningCount + losingCount + breakevenCount;

  // Custom Tooltip for Donut Chart
  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-[#38BDF8]">{data.name}</p>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Trade Count:</span>
            <span className="font-mono font-bold text-white">{data.value} Trades</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Share:</span>
            <span className="font-mono font-bold text-[#22C55E]">
              {total > 0 ? ((data.value / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Session Bar Chart
  const SessionCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-[#38BDF8]">{data.name} Session</p>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Session P&L:</span>
            <span className={`font-mono font-bold ${data.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {data.pnl >= 0 ? `+$${data.pnl.toLocaleString()}` : `-$${Math.abs(data.pnl).toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Win Rate:</span>
            <span className="font-mono font-bold text-white">{data.winRate}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Setup Bar Chart
  const SetupCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] shadow-2xl text-xs space-y-1 max-w-xs z-50">
          <p className="font-bold text-[#38BDF8]">{data.name}</p>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">R-Multiple Return:</span>
            <span className={`font-mono font-bold ${data.r >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {data.r >= 0 ? `+${data.r}R` : `${data.r}R`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Net P&L:</span>
            <span className={`font-mono font-bold ${data.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {data.pnl >= 0 ? `+$${data.pnl.toLocaleString()}` : `-$${Math.abs(data.pnl).toLocaleString()}`}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Win / Loss Distribution Donut */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-white">Win/Loss Distribution</h3>
          {total > 0 && (
            <span className="px-2.5 py-0.5 rounded-lg bg-[#101A2B] border border-[#1E293B] text-[11px] font-bold font-mono text-[#38BDF8]">
              {total} Trades
            </span>
          )}
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">Breakdown of closed trade outcomes</p>

        <div className="h-56 relative flex items-center justify-center">
          {total === 0 ? (
            <div className="text-center text-[#64748B] text-xs">No trades logged yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1220" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip cursor={false} content={<PieCustomTooltip />} wrapperStyle={{ zIndex: 100 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
            <span className="text-[#94A3B8]">Wins ({winningCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="text-[#94A3B8]">Losses ({losingCount})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="text-[#94A3B8]">BE ({breakevenCount})</span>
          </div>
        </div>
      </div>

      {/* Session Performance Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
        <h3 className="text-base font-bold text-white mb-1">Performance by Session</h3>
        <p className="text-xs text-[#94A3B8] mb-4">P&L generated across trading sessions</p>

        <div className="h-56 w-full">
          {sessionBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#64748B] text-xs">
              No session data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<SessionCustomTooltip />}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Bar dataKey="pnl" radius={[6, 6, 0, 0]}>
                  {sessionBreakdown.map((entry, index) => (
                    <Cell
                      key={`session-cell-${index}`}
                      fill={entry.pnl >= 0 ? "#22C55E" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Setup Performance Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
        <h3 className="text-base font-bold text-white mb-1">Performance by Setup</h3>
        <p className="text-xs text-[#94A3B8] mb-4">Total R-Multiple returned by ICT setups</p>

        <div className="h-56 w-full">
          {setupBreakdown.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#64748B] text-xs">
              No setup data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={setupBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={<SetupCustomTooltip />}
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Bar dataKey="r" radius={[6, 6, 0, 0]}>
                  {setupBreakdown.map((entry, index) => (
                    <Cell
                      key={`setup-cell-${index}`}
                      fill={entry.r >= 0 ? "#38BDF8" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
