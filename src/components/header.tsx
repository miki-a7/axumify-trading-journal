"use client";

import React from "react";
import Link from "next/link";
import {
  Menu,
  Download,
  Plus,
  Activity,
} from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  dateFilter?: string;
  setDateFilter?: (filter: string) => void;
}

export default function Header({ onMenuClick, dateFilter = "ALL", setDateFilter }: HeaderProps) {
  const exportCSV = () => {
    window.location.href = "/api/export";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1E293B]">
      {/* LEFT: Mobile Menu Button + Clean Terminal Indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#101A2B] lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Clean Application Terminal Context Badge with Axumify Emblem */}
        <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#101A2B] border border-[#1E293B]">
          <img src="/logo.png" alt="Axumify" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-mono">AXUMIFY TERMINAL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-[10px] text-[#94A3B8] font-medium hidden md:inline">
              Execution Journal
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Date Filters, CSV Export & Add Trade Action */}
      <div className="flex items-center gap-3">
        {/* Quick Date Range Filter */}
        {setDateFilter && (
          <div className="hidden md:flex items-center p-1 rounded-xl bg-[#050B14] border border-[#1E293B]">
            {["TODAY", "THIS_WEEK", "THIS_MONTH", "ALL"].map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === range
                    ? "bg-[#2563EB] text-white shadow-sm"
                    : "text-[#94A3B8] hover:text-white"
                }`}
              >
                {range.replace("_", " ")}
              </button>
            ))}
          </div>
        )}

        {/* CSV Export Button */}
        <button
          onClick={exportCSV}
          title="Export Journal to CSV"
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#101A2B] border border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#2563EB] transition-all"
        >
          <Download className="w-4 h-4 text-[#38BDF8]" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Add Trade Button */}
        <Link
          href="/journal/add"
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-glow hover:brightness-110 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Trade</span>
        </Link>
      </div>
    </header>
  );
}
