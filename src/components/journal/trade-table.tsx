"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  MinusCircle,
  ExternalLink,
} from "lucide-react";

export interface TradeItem {
  id: string;
  date: string;
  instrument: string;
  market: string;
  session: string;
  direction: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  exitPrice?: number;
  positionSize?: number;
  riskAmount?: number;
  plannedRR?: number;
  actualR: number;
  pnl: number;
  result: string; // WIN, LOSS, BREAKEVEN
  grade?: string;
  setup?: string;
  notes?: string;
}

interface TradeTableProps {
  trades: TradeItem[];
  onDelete?: (id: string) => void;
}

export default function TradeTable({ trades, onDelete }: TradeTableProps) {
  const [search, setSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState("ALL");
  const [selectedDirection, setSelectedDirection] = useState("ALL");

  const [sortField, setSortField] = useState<keyof TradeItem>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Multi-Filter Logic
  const filtered = trades.filter((t) => {
    const matchesSearch =
      t.instrument.toLowerCase().includes(search.toLowerCase()) ||
      (t.setup || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.notes || "").toLowerCase().includes(search.toLowerCase());

    const matchesResult = selectedResult === "ALL" || t.result === selectedResult;
    const matchesSession = selectedSession === "ALL" || t.session === selectedSession;
    const matchesDirection = selectedDirection === "ALL" || t.direction === selectedDirection;

    return matchesSearch && matchesResult && matchesSession && matchesDirection;
  });

  // Sort Logic
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === "string") valA = (valA as string).toLowerCase();
    if (typeof valB === "string") valB = (valB as string).toLowerCase();

    if (valA! < valB!) return sortOrder === "asc" ? -1 : 1;
    if (valA! > valB!) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (field: keyof TradeItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case "WIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] font-bold text-xs">
            <CheckCircle className="w-3.5 h-3.5" />
            WIN
          </span>
        );
      case "LOSS":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] font-bold text-xs">
            <XCircle className="w-3.5 h-3.5" />
            LOSS
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] font-bold text-xs">
            <MinusCircle className="w-3.5 h-3.5" />
            BE
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Search & Filter Selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search instrument, setup, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Result Filter */}
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-semibold text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Outcomes</option>
            <option value="WIN">Wins</option>
            <option value="LOSS">Losses</option>
            <option value="BREAKEVEN">Break-even</option>
          </select>

          {/* Session Filter */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-semibold text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Sessions</option>
            <option value="Asian">Asian Session</option>
            <option value="London">London Session</option>
            <option value="New York">New York Session</option>
          </select>

          {/* Direction Filter */}
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-semibold text-white focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">All Directions</option>
            <option value="LONG">Long ⬆</option>
            <option value="SHORT">Short ⬇</option>
          </select>
        </div>
      </div>

      {/* Trade Journal Table */}
      <div className="overflow-x-auto rounded-2xl bg-[#0B1220] border border-[#1E293B] shadow-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#050B14]/60 text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
              <th
                onClick={() => toggleSort("date")}
                className="py-4 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Date <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("instrument")}
                className="py-4 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  Instrument <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                </div>
              </th>
              <th className="py-4 px-4">Session</th>
              <th className="py-4 px-4">Direction</th>
              <th className="py-4 px-4">Setup</th>
              <th className="py-4 px-4 text-right">Entry</th>
              <th className="py-4 px-4 text-right">SL / TP</th>
              <th className="py-4 px-4 text-center">Result</th>
              <th
                onClick={() => toggleSort("actualR")}
                className="py-4 px-4 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1.5">
                  R-Multiple <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                </div>
              </th>
              <th
                onClick={() => toggleSort("pnl")}
                className="py-4 px-4 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1.5">
                  Net P&L <ArrowUpDown className="w-3 h-3 text-[#64748B]" />
                </div>
              </th>
              <th className="py-4 px-4 text-center">Grade</th>
              <th className="py-4 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-xs">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-[#64748B]">
                  No trades found matching criteria.
                </td>
              </tr>
            ) : (
              paginated.map((trade) => {
                const formattedDate = new Date(trade.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <tr
                    key={trade.id}
                    className="hover:bg-[#101A2B]/60 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-mono text-[#F8FAFC] whitespace-nowrap">
                      {formattedDate}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white whitespace-nowrap">
                      {trade.instrument}
                    </td>

                    <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">
                      {trade.session}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`font-extrabold text-[11px] ${
                          trade.direction === "LONG" ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {trade.direction === "LONG" ? "LONG ⬆" : "SHORT ⬇"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#38BDF8] font-medium max-w-[150px] truncate">
                      {trade.setup || "—"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-right text-white">
                      {trade.entryPrice}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-right text-[#94A3B8]">
                      {trade.stopLoss} / {trade.takeProfit}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getResultBadge(trade.result)}
                    </td>

                    <td
                      className={`py-3.5 px-4 font-mono font-bold text-right whitespace-nowrap ${
                        trade.actualR > 0
                          ? "text-[#22C55E]"
                          : trade.actualR < 0
                          ? "text-[#EF4444]"
                          : "text-[#F59E0B]"
                      }`}
                    >
                      {trade.actualR >= 0 ? `+${trade.actualR}R` : `${trade.actualR}R`}
                    </td>

                    <td
                      className={`py-3.5 px-4 font-mono font-extrabold text-right whitespace-nowrap ${
                        trade.pnl > 0
                          ? "text-[#22C55E]"
                          : trade.pnl < 0
                          ? "text-[#EF4444]"
                          : "text-white"
                      }`}
                    >
                      {trade.pnl >= 0 ? `+$${trade.pnl.toLocaleString()}` : `-$${Math.abs(trade.pnl).toLocaleString()}`}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {trade.grade ? (
                        <span className="px-2 py-0.5 rounded bg-[#101A2B] border border-[#1E293B] font-bold text-[#38BDF8]">
                          {trade.grade.replace("_PLUS", "+")}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/journal/${trade.id}`}
                          className="p-1.5 rounded-lg text-[#38BDF8] hover:bg-[#2563EB]/20"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {onDelete && (
                          <button
                            onClick={() => onDelete(trade.id)}
                            className="p-1.5 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/20"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 text-xs text-[#94A3B8]">
        <span>
          Showing {paginated.length} of {sorted.length} Trades
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] disabled:opacity-40 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono font-bold text-white">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-xl bg-[#0B1220] border border-[#1E293B] disabled:opacity-40 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
