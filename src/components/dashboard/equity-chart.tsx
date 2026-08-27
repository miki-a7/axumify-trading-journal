"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EquityPoint {
  date: string;
  cumPnl: number;
  cumR: number;
  pnl: number;
  r: number;
  tradesCount: number;
}

interface EquityChartProps {
  data: EquityPoint[];
}

export default function EquityChart({ data }: EquityChartProps) {
  const latestPoint = data.length > 0 ? data[data.length - 1] : { cumPnl: 0, cumR: 0 };
  const netPnl = latestPoint.cumPnl || 0;
  const netR = latestPoint.cumR || 0;
  const isProfitable = netPnl >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[#0B1220] border border-[#1E293B] shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-[#38BDF8]">{p.date}</p>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Cumulative P&L:</span>
            <span className={`font-mono font-bold ${p.cumPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {p.cumPnl >= 0 ? `+$${p.cumPnl.toLocaleString()}` : `-$${Math.abs(p.cumPnl).toLocaleString()}`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#94A3B8]">Cumulative R:</span>
            <span className={`font-mono font-bold ${p.cumR >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {p.cumR >= 0 ? `+${p.cumR}R` : `${p.cumR}R`}
            </span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-[#1E293B]">
            <span className="text-[#94A3B8]">Trade P&L:</span>
            <span className={`font-mono font-bold ${p.pnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
              {p.pnl >= 0 ? `+$${p.pnl.toLocaleString()}` : `-$${Math.abs(p.pnl).toLocaleString()}`} ({p.r >= 0 ? `+${p.r}R` : `${p.r}R`})
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white">Cumulative Net P&L Equity Curve</h2>
          <p className="text-xs text-[#94A3B8]">Dynamic trade performance & cumulative dollar returns</p>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Net P&L</span>
            <span
              className={`text-xl font-extrabold font-mono ${
                isProfitable ? "text-[#22C55E]" : "text-[#EF4444]"
              }`}
            >
              {isProfitable ? `+$${netPnl.toLocaleString()}` : `-$${Math.abs(netPnl).toLocaleString()}`}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total R Returned</span>
            <span className="text-xl font-extrabold font-mono text-[#38BDF8]">
              {netR >= 0 ? `+${netR}R` : `${netR}R`}
            </span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isProfitable ? "#2563EB" : "#EF4444"}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={isProfitable ? "#2563EB" : "#EF4444"}
                  stopOpacity={0.0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={["auto", "auto"]} />
            <Tooltip
              cursor={{ stroke: "#2563EB", strokeWidth: 1, strokeDasharray: "3 3" }}
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 100 }}
            />
            <Area
              type="monotone"
              dataKey="cumPnl"
              stroke={isProfitable ? "#38BDF8" : "#EF4444"}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#equityGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
