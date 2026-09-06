"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Brain,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  ExternalLink,
  X,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  formatRDisplay,
  formatPriceDisplay,
  getSignedR,
} from "@/lib/calculations/stats";
import { formatGregorianDate, formatEthiopianDate } from "@/lib/calculations/dates";
import TradeScreenshotImage from "@/components/journal/trade-screenshot-image";

export default function PublicSharedTradePage() {
  const params = useParams();
  const shareToken = params?.shareToken as string;

  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; type: string; caption?: string } | null>(null);

  useEffect(() => {
    async function fetchSharedTrade() {
      if (!shareToken) return;
      try {
        const res = await fetch(`/api/share/${shareToken}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setTrade(json.trade);
        } else {
          const json = await res.json().catch(() => ({}));
          setError(json.error || "This shared trade is not available or sharing has been disabled.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load shared trade.");
      } finally {
        setLoading(false);
      }
    }
    fetchSharedTrade();
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#38BDF8]">Loading shared trade verification...</p>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0B1220] border border-[#1E293B] text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Trade Not Available</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {error || "This shared trade record is no longer available, or the trader has turned off public sharing."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all"
            >
              <span>Go to AXUMIFY Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isShort = trade.direction === "SHORT";

  return (
    <div className="min-h-screen bg-[#050B14] text-white selection:bg-[#2563EB] selection:text-white">
      {/* Public Top Navbar */}
      <header className="border-b border-[#1E293B] bg-[#0B1220]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] flex items-center justify-center font-black text-white text-xs tracking-tighter">
              AX
            </div>
            <span className="font-extrabold text-sm tracking-wider text-white">AXUMIFY</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-bold">
              PUBLIC TRADE SHARE
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span className="hidden sm:inline">Verified Execution Log</span>
          </div>
        </div>
      </header>

      {/* Main Trade Content */}
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Trade Header Card */}
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-white">{trade.instrument}</h1>
              <span
                className={`px-3 py-1 rounded-lg font-extrabold text-xs tracking-wider ${
                  trade.direction === "LONG"
                    ? "bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E]"
                    : "bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444]"
                }`}
              >
                {trade.direction}
              </span>
              {trade.grade && (
                <span className="px-2.5 py-1 rounded-lg bg-[#101A2B] border border-[#1E293B] text-xs font-bold text-[#38BDF8]">
                  Grade {trade.grade.replace("_PLUS", "+")}
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1.5">
              Executed on {formatGregorianDate(trade.date)} ({formatEthiopianDate(trade.date)}) • {trade.session} Session • {trade.market} Market ({trade.timeframe || "15m"})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-4 py-2 rounded-xl text-sm font-extrabold tracking-wider font-mono ${
                trade.result === "WIN"
                  ? "bg-[#22C55E]/20 border border-[#22C55E]/50 text-[#22C55E]"
                  : trade.result === "LOSS"
                  ? "bg-[#EF4444]/20 border border-[#EF4444]/50 text-[#EF4444]"
                  : "bg-[#F59E0B]/20 border border-[#F59E0B]/50 text-[#F59E0B]"
              }`}
            >
              {trade.result}
            </span>
          </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Actual R:R</span>
            <span
              className={`text-lg font-mono font-bold mt-1 block ${
                isShort ? "text-[#EF4444]" : "text-[#38BDF8]"
              }`}
            >
              {trade.actualR != null ? `${Number(trade.actualR).toFixed(2)}R` : "—"}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Possible R:R</span>
            <span className="text-lg font-mono font-bold text-[#22C55E] mt-1 block">
              {trade.possibleRR != null ? `${Number(trade.possibleRR).toFixed(2)}R` : "—"}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Actual R</span>
            <span
              className={`text-lg font-mono font-extrabold mt-1 block ${
                isShort
                  ? "text-[#EF4444]"
                  : getSignedR(trade.actualR, trade.result) > 0
                  ? "text-[#22C55E]"
                  : getSignedR(trade.actualR, trade.result) < 0
                  ? "text-[#EF4444]"
                  : "text-[#F59E0B]"
              }`}
            >
              {formatRDisplay(trade.actualR, trade.result)}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Net Profit / Loss</span>
            <span
              className={`text-lg font-mono font-extrabold mt-1 block ${
                trade.pnl > 0 ? "text-[#22C55E]" : trade.pnl < 0 ? "text-[#EF4444]" : "text-white"
              }`}
            >
              {trade.pnl >= 0 ? `+$${trade.pnl.toLocaleString()}` : `-$${Math.abs(trade.pnl).toLocaleString()}`}
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Entry Price</span>
            <span className="text-lg font-mono font-bold text-white mt-1 block">{formatPriceDisplay(trade.entryPrice)}</span>
          </div>

          <div>
            <span className="text-xs font-bold text-[#94A3B8] block uppercase">Exit Price</span>
            <span className="text-lg font-mono font-bold text-white mt-1 block">{formatPriceDisplay(trade.exitPrice)}</span>
          </div>
        </div>

        {/* Stop Loss & Take Profit Bar */}
        {(trade.stopLoss !== null || trade.takeProfit !== null) && (
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs">
            <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E293B] flex items-center justify-between">
              <span className="font-semibold text-[#EF4444]">Stop Loss Level:</span>
              <span className="font-mono font-bold text-white">{formatPriceDisplay(trade.stopLoss)}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#050B14] border border-[#1E293B] flex items-center justify-between">
              <span className="font-semibold text-[#22C55E]">Take Profit Target:</span>
              <span className="font-mono font-bold text-white">{formatPriceDisplay(trade.takeProfit)}</span>
            </div>
          </div>
        )}

        {/* GC & EC Confluence Card */}
        {(trade.gc || trade.ec || trade.setup) && (
          <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                Setup Confluences (GC & EC)
              </h3>
              {trade.setup && (
                <span className="px-3 py-1 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 text-xs font-bold text-white">
                  {trade.setup}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* GC: General Confluence */}
              <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-mono font-bold">GC</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">General Confluence (HTF Context)</h4>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  {trade.gc || "No higher timeframe confluence recorded."}
                </p>
              </div>

              {/* EC: Execution Confluence */}
              <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-mono font-bold">EC</span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Execution Confluence (LTF Trigger)</h4>
                </div>
                <p className="text-xs text-[#CBD5E1] leading-relaxed">
                  {trade.ec || "No lower timeframe trigger confluence recorded."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Concept Tags */}
        {trade.ictConcepts && trade.ictConcepts.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-3">
            <h3 className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Concept Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {trade.ictConcepts.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/40 text-xs font-semibold text-[#38BDF8]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Trade Screenshots Gallery */}
        {trade.images && trade.images.length > 0 && (
          <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Chart Screenshots ({trade.images.length})
              </h3>
              <span className="text-[11px] text-[#64748B]">Click any screenshot to zoom full resolution</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {trade.images.map((img: any, idx: number) => (
                <div
                  key={img.id || idx}
                  className="group relative rounded-xl overflow-hidden border border-[#1E293B] bg-[#050B14] hover:border-[#38BDF8] transition-all cursor-pointer shadow-md"
                  onClick={() => setLightboxImage(img)}
                >
                  <TradeScreenshotImage
                    src={img.url}
                    alt={img.caption || img.type}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2 py-0.5 rounded bg-[#2563EB]/80 backdrop-blur-md text-[10px] font-mono font-bold text-white uppercase">
                      {img.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold truncate">{img.caption || "View Full Image"}</span>
                    <Maximize2 className="w-4 h-4 text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trade Execution Plan */}
        {(trade.htfBias || trade.liquidityTarget || trade.entryModel || trade.confirmation || trade.invalidation) && (
          <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider">
              Trade Execution Framework
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              {trade.htfBias && (
                <div className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">HTF Bias</span>
                  <span className="font-bold text-white mt-1 block">{trade.htfBias}</span>
                </div>
              )}
              {trade.liquidityTarget && (
                <div className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Liquidity Target</span>
                  <span className="font-bold text-white mt-1 block">{trade.liquidityTarget}</span>
                </div>
              )}
              {trade.entryModel && (
                <div className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Entry Model</span>
                  <span className="font-bold text-white mt-1 block">{trade.entryModel}</span>
                </div>
              )}
              {trade.confirmation && (
                <div className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Confirmation</span>
                  <span className="font-bold text-white mt-1 block">{trade.confirmation}</span>
                </div>
              )}
              {trade.invalidation && (
                <div className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
                  <span className="text-[10px] text-[#94A3B8] block uppercase font-bold">Invalidation</span>
                  <span className="font-bold text-white mt-1 block">{trade.invalidation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Trade Notes */}
        {trade.notes && (
          <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
            <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Trader Notes & Analysis
            </h3>
            <p className="text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-line">{trade.notes}</p>
          </div>
        )}

        {/* Footer Branding */}
        <footer className="pt-8 pb-12 text-center space-y-2 border-t border-[#1E293B]">
          <p className="text-xs text-[#94A3B8]">
            Journaled and verified via <strong className="text-white">AXUMIFY Trading Journal</strong>
          </p>
          <p className="text-[11px] text-[#64748B]">
            All trade statistics and risk metrics are calculated transparently with institutional precision.
          </p>
        </footer>
      </main>

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center bg-[#0B1220] rounded-2xl border border-[#1E293B] overflow-hidden p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3 border-b border-[#1E293B] text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#2563EB] text-xs font-mono font-bold uppercase">
                  {lightboxImage.type.replace("_", " ")}
                </span>
                <span className="text-xs font-semibold text-[#94A3B8]">{lightboxImage.caption || "Chart Screenshot"}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
                  title="Open Original Image"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="w-full max-h-[80vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || lightboxImage.type}
                className="max-h-[76vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
