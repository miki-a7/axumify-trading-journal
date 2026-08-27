"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "profit" | "loss" | "neutral";
  badge?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  badge,
}: StatCardProps) {
  const trendColors = {
    profit: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
    loss: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20",
    neutral: "text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/20",
  };

  const textColors = {
    profit: "text-[#22C55E]",
    loss: "text-[#EF4444]",
    neutral: "text-white",
  };

  return (
    <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] hover:border-[#2563EB]/50 transition-all duration-300 shadow-card">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold tracking-wider text-[#94A3B8] uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-xl border ${trendColors[trend]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className={`text-2xl lg:text-3xl font-extrabold font-mono tracking-tight ${textColors[trend]}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <div className="mt-3 pt-2.5 border-t border-[#1E293B] flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
          <span>Performance Target</span>
          <span className="text-[#38BDF8]">{badge}</span>
        </div>
      )}
    </div>
  );
}
