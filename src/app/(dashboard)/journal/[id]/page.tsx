"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Brain,
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  ExternalLink,
  RefreshCw,
  X,
  Maximize2,
  Download,
  AlertCircle,
  Sparkles,
} from "lucide-react";

import { getUTCDateString, formatRDisplay, formatPriceDisplay, getSignedR } from "@/lib/calculations/stats";
import { formatGregorianDate, formatEthiopianDate } from "@/lib/calculations/dates";
import TradeScreenshotImage from "@/components/journal/trade-screenshot-image";

export default function TradeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<{ url: string; type: string; caption?: string } | null>(null);

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${id}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          setTrade(json.trade);
          setIsShared(Boolean(json.trade.isShared));
          setShareToken(json.trade.shareToken || null);
        } else {
          setTrade(null);
        }
      } catch (err) {
        console.error(err);
        setTrade(null);
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
      if (res.ok) {
        router.push("/journal");
        router.refresh();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Failed to delete trade.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete trade.");
    }
  };

  // Toggle Sharing ON/OFF
  const handleToggleShare = async () => {
    setShareLoading(true);
    try {
      const nextState = !isShared;
      const res = await fetch(`/api/trades/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: nextState }),
      });
      if (res.ok) {
        const json = await res.json();
        setIsShared(json.isShared);
        setShareToken(json.shareToken);
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Failed to update share settings.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update share settings.");
    } finally {
      setShareLoading(false);
    }
  };

  // Regenerate Share Link / Rotate Token
  const handleRegenerateToken = async () => {
    if (!confirm("Regenerating the link will invalidate any previously shared URLs. Continue?")) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/trades/${id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: true, regenerate: true }),
      });
      if (res.ok) {
        const json = await res.json();
        setIsShared(json.isShared);
        setShareToken(json.shareToken);
        setCopied(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to regenerate share token.");
    } finally {
      setShareLoading(false);
    }
  };

  // Revoke Share Link
  const handleRevokeShare = async () => {
    if (!confirm("Revoke sharing? This link will immediately stop working.")) return;
    setShareLoading(true);
    try {
      const res = await fetch(`/api/trades/${id}/share`, { method: "DELETE" });
      if (res.ok) {
        setIsShared(false);
        setShareToken(null);
      }
    } catch (err: any) {
      alert(err.message || "Failed to revoke share link.");
    } finally {
      setShareLoading(false);
    }
  };

  const getShareUrl = () => {
    if (!shareToken) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/share/${shareToken}`;
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleQuickShare = async () => {
    setShareLoading(true);
    setShareToast(null);
    try {
      let token = shareToken;
      if (!isShared || !token) {
        const res = await fetch(`/api/trades/${id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isShared: true }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Failed to enable sharing");
        }
        const json = await res.json();
        token = json.shareToken;
        setIsShared(Boolean(json.isShared));
        setShareToken(token);
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setShareToast("Share link copied to clipboard!");
      setTimeout(() => {
        setCopied(false);
        setShareToast(null);
      }, 3000);
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `${trade?.instrument || "Trade"} — AXUMIFY`,
            text: "View my shared trade execution log",
            url,
          });
        } catch {
          // User cancelled or share unavailable
        }
      }
    } catch (err: any) {
      alert(err.message || "Failed to share trade.");
    } finally {
      setShareLoading(false);
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
            className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
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
              {isShared && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[11px] font-bold text-[#22C55E]">
                  <Globe className="w-3 h-3" />
                  <span>Publicly Shared</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Logged on {formatGregorianDate(trade.date)} ({formatEthiopianDate(trade.date)}) • {trade.session} Session • {trade.market} Market ({trade.timeframe || "15m"})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Prominent SHARE Button */}
          <button
            onClick={handleQuickShare}
            disabled={shareLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#050B14] border border-[#38BDF8]/40 text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-all shadow-sm disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span>{shareLoading ? "Sharing..." : copied ? "Link Copied!" : isShared ? "Share Link" : "Share Trade"}</span>
          </button>
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-2 text-xs font-bold rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-all"
            title="Share settings"
          >
            <Globe className="w-4 h-4" />
          </button>

          <Link
            href={`/journal/${trade.id}/edit`}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Trade</span>
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Trade Execution Life-Cycle Steps Bar */}
      <div className="p-4 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
        <span className="text-xs font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#38BDF8]" />
          Trade Life-Cycle & Confluence Path
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {[
            { label: "HTF Bias", val: trade.htfBias || "N/A" },
            { label: "Liquidity Target", val: trade.liquidityTarget || "N/A" },
            { label: "Target Reason", val: trade.targetReason || "N/A" },
            { label: "Confirmation", val: trade.confirmation || "N/A" },
            { label: "Invalidation", val: trade.invalidation || "N/A" },
            { label: "Entry Model", val: trade.entryModel || "N/A" },
            { label: "Entry Price", val: trade.entryPrice ?? "N/A" },
            { label: "Exit Result", val: `${trade.result} (${formatRDisplay(trade.actualR, trade.result)})` },
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

      {shareToast && (
        <div className="p-3 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#22C55E] font-semibold text-center">
          {shareToast}
        </div>
      )}

      {/* R:R Metrics */}
      <div className="grid grid-cols-3 gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block uppercase">Actual R:R</span>
          <span
            className={`text-lg font-mono font-bold mt-1 block ${
              trade.direction === "SHORT" ? "text-[#EF4444]" : "text-[#38BDF8]"
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
              trade.direction === "SHORT"
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
      </div>

      {/* Metric Highlights Card */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Entry Price</span>
          <span className="text-lg font-mono font-bold text-white mt-1 block">{formatPriceDisplay(trade.entryPrice)}</span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Exit Price</span>
          <span className="text-lg font-mono font-bold text-white mt-1 block">{formatPriceDisplay(trade.exitPrice)}</span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">Stop Loss / Take Profit</span>
          <span className="text-base font-mono font-bold text-[#94A3B8] mt-1 block">
            <span className="text-[#EF4444]">{formatPriceDisplay(trade.stopLoss)}</span> /{" "}
            <span className="text-[#22C55E]">{formatPriceDisplay(trade.takeProfit)}</span>
          </span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#94A3B8] block">R-Multiple Return</span>
          <span
            className={`text-lg font-mono font-extrabold mt-1 block ${
              trade.direction === "SHORT"
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

      {/* GC & EC Confluence Section */}
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

      {/* Execution Performance Metrics */}
      {(trade.mae !== null || trade.mfe !== null || trade.commission !== null || trade.fees !== null || trade.swap !== null || trade.slippage !== null) && (
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-3">
          <h3 className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
            Execution Performance & Costs
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">MAE</span>
              <span className="font-mono font-bold text-white">{trade.mae ?? "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">MFE</span>
              <span className="font-mono font-bold text-white">{trade.mfe ?? "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">Commission</span>
              <span className="font-mono font-bold text-white">{trade.commission ? `$${trade.commission}` : "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">Fees</span>
              <span className="font-mono font-bold text-white">{trade.fees ? `$${trade.fees}` : "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">Swap</span>
              <span className="font-mono font-bold text-white">{trade.swap ? `$${trade.swap}` : "N/A"}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <span className="text-[10px] text-[#94A3B8] block">Slippage</span>
              <span className="font-mono font-bold text-white">{trade.slippage ?? "N/A"}</span>
            </div>
          </div>
        </div>
      )}

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
          {trade.reasonForEntry && (
            <div className="pt-3 border-t border-[#1E293B]">
              <span className="text-xs font-bold text-[#94A3B8] block mb-1">Entry Reason:</span>
              <p className="text-xs text-[#E2E8F0] italic">{trade.reasonForEntry}</p>
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Psychology & Behavioral Checklist
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Confidence</span>
              <span className="font-bold text-white">{trade.psychConfidence ?? 5} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Patience</span>
              <span className="font-bold text-white">{trade.psychPatience ?? 5} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Discipline</span>
              <span className="font-bold text-white">{trade.psychDiscipline ?? 5} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Fear</span>
              <span className="font-bold text-white">{trade.psychFear ?? 1} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Greed</span>
              <span className="font-bold text-white">{trade.psychGreed ?? 1} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">FOMO</span>
              <span className="font-bold text-white">{trade.psychFOMO ?? 1} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Revenge</span>
              <span className="font-bold text-white">{trade.psychRevenge ?? 1} / 5</span>
            </div>
            <div className="p-2 rounded-lg bg-[#050B14]">
              <span className="text-[#94A3B8] block text-[10px]">Stress</span>
              <span className="font-bold text-white">{trade.psychStress ?? 1} / 5</span>
            </div>
          </div>

          {/* Emotional states */}
          {(trade.emotionBefore || trade.emotionDuring || trade.emotionAfter) && (
            <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#1E293B]">
              <div>
                <span className="text-[10px] text-[#94A3B8] block">Before Entry</span>
                <span className="font-semibold text-white">{trade.emotionBefore || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">During Trade</span>
                <span className="font-semibold text-white">{trade.emotionDuring || "N/A"}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#94A3B8] block">After Exit</span>
                <span className="font-semibold text-white">{trade.emotionAfter || "N/A"}</span>
              </div>
            </div>
          )}

          {/* Behavioral Flags */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E293B]">
            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${trade.followedPlan ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-[#EF4444]/15 text-[#EF4444]"}`}>
              {trade.followedPlan ? "✓ Followed Plan" : "✕ Plan Deviated"}
            </span>
            {trade.brokeRule && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Broke Rule</span>}
            {trade.enteredTooEarly && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Entered Early</span>}
            {trade.movedSL && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Moved SL</span>}
            {trade.closedEarly && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Closed Early</span>}
            {trade.overtraded && <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Overtraded</span>}
          </div>
        </div>
      </div>

      {/* Positives & Mistakes Section */}
      {(positives.length > 0 || mistakes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {positives.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
              <h3 className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">What Went Well</h3>
              <ul className="list-disc list-inside text-xs text-[#E2E8F0] space-y-1">
                {positives.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          {mistakes.length > 0 && (
            <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-2">
              <h3 className="text-xs font-bold text-[#EF4444] uppercase tracking-wider">Mistakes & Lessons</h3>
              <ul className="list-disc list-inside text-xs text-[#E2E8F0] space-y-1">
                {mistakes.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Trade Screenshots Gallery */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            TradingView Charts & Screenshot Gallery
          </h3>
          <span className="text-xs text-[#94A3B8]">
            {trade.images?.length || 0} Screenshot{trade.images?.length === 1 ? "" : "s"} Attached
          </span>
        </div>

        {trade.images && trade.images.length > 0 ? (
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
                  <span className="font-semibold truncate">{img.caption || "Click to zoom"}</span>
                  <Maximize2 className="w-4 h-4 text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#050B14] border border-dashed border-[#1E293B] text-center space-y-3">
            <ImageIcon className="w-8 h-8 text-[#64748B] mx-auto" />
            <div>
              <p className="text-xs font-semibold text-[#94A3B8]">No chart screenshots attached to this trade</p>
              <p className="text-[11px] text-[#64748B]">Attach TradingView screenshots to study before, during, and after execution</p>
            </div>
            <Link
              href={`/journal/${trade.id}/edit`}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#1E293B] text-xs font-bold text-[#38BDF8] hover:border-[#38BDF8] transition-all"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit Trade to Add Screenshot</span>
            </Link>
          </div>
        )}
      </div>

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

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center bg-[#0B1220] rounded-2xl border border-[#1E293B] overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between p-3 border-b border-[#1E293B] text-white">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#2563EB] text-xs font-mono font-bold uppercase">
                  {lightboxImage.type.replace("_", " ")}
                </span>
                <span className="text-xs font-semibold text-[#94A3B8]">{lightboxImage.caption || "TradingView Screenshot"}</span>
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
            <div className="w-full max-h-[78vh] overflow-auto flex items-center justify-center p-4">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.caption || lightboxImage.type}
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Trade Modal */}
      {isShareModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="max-w-lg w-full rounded-2xl bg-[#0B1220] border border-[#1E293B] p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#38BDF8]">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Share Trade Publicly</h3>
                  <p className="text-xs text-[#94A3B8]">Create a secure public link with read-only trade parameters</p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sharing Toggle */}
            <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isShared ? (
                  <Globe className="w-5 h-5 text-[#22C55E]" />
                ) : (
                  <Lock className="w-5 h-5 text-[#64748B]" />
                )}
                <div>
                  <span className="text-xs font-bold text-white block">
                    Public Link Status: {isShared ? "ACTIVE" : "DISABLED"}
                  </span>
                  <span className="text-[11px] text-[#64748B] block">
                    {isShared
                      ? "Anyone with the link can view this trade and screenshots."
                      : "Trade is private and visible only to you."}
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleShare}
                disabled={shareLoading}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  isShared
                    ? "bg-[#EF4444]/20 border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/30"
                    : "bg-[#22C55E] text-slate-950 hover:bg-[#16A34A]"
                }`}
              >
                {shareLoading ? "Updating..." : isShared ? "Turn OFF" : "Turn ON"}
              </button>
            </div>

            {/* Share Link Field */}
            {isShared && shareToken && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#94A3B8] block">Your Public Share URL</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getShareUrl()}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-[#38BDF8] select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={`/share/${shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Public View</span>
                  </a>
                  <button
                    onClick={handleRegenerateToken}
                    disabled={shareLoading}
                    className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-white hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Rotate Link</span>
                  </button>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="p-3.5 rounded-xl bg-[#101A2B] border border-[#1E293B] flex items-start gap-2.5 text-xs text-[#94A3B8]">
              <AlertCircle className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong className="text-white">Security guarantee:</strong> The public link exposes ONLY trade direction,
                pricing metrics, SMC tags, and chart screenshots. Your login email, account balances, and other trades
                remain strictly private and cannot be accessed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
