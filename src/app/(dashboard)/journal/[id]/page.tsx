"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calendar,
  Layers,
  Brain,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
  TrendingUp,
} from "lucide-react";

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${id}`);
        if (res.ok) {
          const json = await res.json();
          setTrade(json.trade);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTrade();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    try {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/journal");
    } catch (err) {
      alert("Failed to delete trade.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm font-semibold text-[#38BDF8] animate-pulse">Loading trade details...</div>
      </div>
    );
  }

  if (!trade) {
    return (
      <div className="p-8 rounded-2xl bg-[#0B1220] text-center space-y-4">
        <p className="text-red-400 font-semibold">Trade record not found.</p>
        <Link href="/journal" className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white">
          Back to Journal
        </Link>
      </div>
    );
  }

  const parseJson = (str: any) => {
    if (Array.isArray(str)) return str;
    try {
      return JSON.parse(str || "[]");
    } catch {
      return [];
    }
  };

  const ictConcepts = parseJson(trade.ictConcepts);
  const positives = parseJson(trade.positives);
  const mistakes = parseJson(trade.mistakes);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white">{trade.instrument}</h1>
              <span
                className={`px-3 py-1 rounded-lg font-extrabold text-xs ${
                  trade.direction === "LONG"
                    ? "bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]"
                    : "bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444]"
                }`}
              >
                {trade.direction}
              </span>
              {trade.grade && (
                <span className="px-2.5 py-1 rounded-lg bg-[#101A2B] border border-[#1E293B] text-xs font-bold text-[#38BDF8]">
                  Grade: {trade.grade.replace("_PLUS", "+")}
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Logged on {new Date(trade.date).toLocaleDateString()} • {trade.session} Session
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* SMC Execution Process Timeline */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
        <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider">
          Visual SMC Execution Process Timeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 text-center text-xs">
          {[
            { label: "HTF Bias", val: trade.htfBias || "Bullish" },
            { label: "Liquidity Target", val: trade.liquidityTarget || "PDH Pool" },
            { label: "Manipulation", val: "Session Grab" },
            { label: "MSS", val: "Confirmed" },
            { label: "Displacement", val: "Strong" },
            { label: "FVG / OB Zone", val: trade.entryModel || "FVG Zone" },
            { label: "Entry Price", val: trade.entryPrice },
            { label: "Exit Result", val: `${trade.result} (${trade.actualR >= 0 ? "+" : ""}${trade.actualR}R)` },
          ].map((step, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] flex flex-col justify-between"
            >
              <span className="text-[10px] text-[#64748B] font-bold uppercase">{step.label}</span>
              <span className="text-xs font-bold text-[#38BDF8] mt-1 truncate">{step.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Highlights Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Entry Price</span>
          <span className="text-lg font-mono font-bold text-white mt-1 block">{trade.entryPrice}</span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Stop Loss / Take Profit</span>
          <span className="text-base font-mono font-bold text-[#94A3B8] mt-1 block">
            <span className="text-[#EF4444]">{trade.stopLoss}</span> / <span className="text-[#22C55E]">{trade.takeProfit}</span>
          </span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">R-Multiple Return</span>
          <span
            className={`text-lg font-mono font-extrabold mt-1 block ${
              trade.actualR > 0 ? "text-[#22C55E]" : trade.actualR < 0 ? "text-[#EF4444]" : "text-[#F59E0B]"
            }`}
          >
            {trade.actualR >= 0 ? `+${trade.actualR}R` : `${trade.actualR}R`}
          </span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Net Trade P&L</span>
          <span
            className={`text-lg font-mono font-extrabold mt-1 block ${
              trade.pnl > 0 ? "text-[#22C55E]" : trade.pnl < 0 ? "text-[#EF4444]" : "text-white"
            }`}
          >
            {trade.pnl >= 0 ? `+$${trade.pnl.toLocaleString()}` : `-$${Math.abs(trade.pnl).toLocaleString()}`}
          </span>
        </div>
      </div>

      {/* ICT Confluence & Psychology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" />
            ICT / SMC Confluence Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {ictConcepts.length === 0 ? (
              <span className="text-xs text-[#64748B]">No ICT tags assigned</span>
            ) : (
              ictConcepts.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/40 text-xs font-semibold text-[#38BDF8]"
                >
                  {tag}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Psychology Ratings
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8]">Confidence:</span>
              <span className="font-bold text-white">{trade.psychConfidence} / 5</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8]">Patience:</span>
              <span className="font-bold text-white">{trade.psychPatience} / 5</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8]">Discipline:</span>
              <span className="font-bold text-white">{trade.psychDiscipline} / 5</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8]">Followed Plan:</span>
              <span className={trade.followedPlan ? "text-[#22C55E] font-bold" : "text-[#EF4444] font-bold"}>
                {trade.followedPlan ? "YES" : "NO"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trade Screenshots Gallery */}
      {trade.images && trade.images.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Chart Screenshots Gallery
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trade.images.map((img: any) => (
              <div key={img.id} className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#050B14]">
                <img src={img.url} alt={img.type} className="w-full h-56 object-cover" />
                <div className="p-3 text-xs font-semibold text-white flex justify-between">
                  <span>{img.type.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade Notes */}
      {trade.notes && (
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Trade Notes & Reflection
          </h3>
          <p className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-line">{trade.notes}</p>
        </div>
      )}
    </div>
  );
}
