"use client";

import React, { useEffect, useState } from "react";
import TradeTable, { TradeItem } from "@/components/journal/trade-table";
import Link from "next/link";
import { Plus, RefreshCw, BookOpen, Download, Calendar } from "lucide-react";
import { CalendarMode } from "@/lib/calculations/dates";

export default function JournalPage() {
  const [trades, setTrades] = useState<TradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>("GC");

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trades", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setTrades(json.trades || []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error("Failed to load trades:", errJson.error);
      }
    } catch (err) {
      console.error("Failed to load trades:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trade record?")) return;
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTrades((prev) => prev.filter((t) => t.id !== id));
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Failed to delete trade.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete trade.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#38BDF8]" />
            <h1 className="text-2xl font-extrabold text-white">
              {calendarMode === "EC" ? "EC Trade Journal Log" : "Trade Journal Log"}
            </h1>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Complete database history with advanced multi-parameter search & filters ({calendarMode === "EC" ? "Ethiopian Calendar (EC)" : "Gregorian Calendar (GC)"})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* GC / EC Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#050B14] border border-[#1E293B]">
            <button
              onClick={() => setCalendarMode("GC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calendarMode === "GC"
                  ? "bg-[#2563EB] text-white shadow-glow"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              GC
            </button>
            <button
              onClick={() => setCalendarMode("EC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                calendarMode === "EC"
                  ? "bg-[#2563EB] text-white shadow-glow"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              EC (ኢትዮጵያ)
            </button>
          </div>

          <button
            onClick={fetchTrades}
            className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href="/api/export"
            className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-xl bg-[#101A2B] border border-[#1E293B] text-white hover:border-[#2563EB]"
          >
            <Download className="w-4 h-4 text-[#38BDF8]" />
            <span>Export CSV</span>
          </a>

          <Link
            href="/journal/add"
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Trade</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 text-[#38BDF8] animate-spin" />
        </div>
      ) : (
        <TradeTable trades={trades} onDelete={handleDelete} calendarMode={calendarMode} />
      )}
    </div>
  );
}
