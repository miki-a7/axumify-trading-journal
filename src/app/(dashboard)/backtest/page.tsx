"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  FlaskConical,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  MinusCircle,
  Trash2,
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Maximize2,
} from "lucide-react";
import { formatGregorianDate } from "@/lib/calculations/dates";
import { processScreenshotFile, OCRDetectedData } from "@/lib/images/upload-client";
import TradeScreenshotImage from "@/components/journal/trade-screenshot-image";

export default function BacktestPage() {
  const [backtests, setBacktests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [instrument, setInstrument] = useState("");
  const [session, setSession] = useState("");
  const [setup, setSetup] = useState("");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [entryPrice, setEntryPrice] = useState<number | "">("");
  const [stopLoss, setStopLoss] = useState<number | "">("");
  const [takeProfit, setTakeProfit] = useState<number | "">("");
  const [result, setResult] = useState<"WIN" | "LOSS" | "BREAKEVEN">("WIN");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [configuration, setConfiguration] = useState<any>({ setups: [], sessions: [] });

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [detectedOCR, setDetectedOCR] = useState<OCRDetectedData | null>(null);

  const fetchBacktests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/backtest", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setBacktests(json.backtests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this backtest trade?")) return;
    try {
      const res = await fetch(`/api/backtest?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setBacktests((prev) => prev.filter((b) => b.id !== id));
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Failed to delete backtest trade.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete backtest trade.");
    }
  };

  useEffect(() => {
    fetchBacktests();
    fetch("/api/configuration", { cache: "no-store" }).then((res) => res.ok ? res.json() : null).then((data) => data && setConfiguration(data)).catch(() => undefined);
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    try {
      setOcrLoading(true);
      setOcrError(null);
      const { image, ocr, ocrError } = await processScreenshotFile(file, "ENTRY", (step) => {
        const labels: Record<string, string> = {
          uploading: "Uploading chart...",
          scanning: "Scanning chart...",
          detecting_entry: "Detecting Entry...",
          detecting_sl: "Detecting Stop Loss...",
          detecting_tp: "Detecting Take Profit...",
          done: "Done",
        };
        // Use ocrLoading state — label shown in button
        setOcrError(null);
        void labels[step];
      });
      setImageUrl(image.url);

      if (ocr) {
        setDetectedOCR(ocr);
        if (ocr.direction) setDirection(ocr.direction);
        if (ocr.entryPrice) setEntryPrice(ocr.entryPrice);
        if (ocr.stopLoss) setStopLoss(ocr.stopLoss);
        if (ocr.takeProfit) setTakeProfit(ocr.takeProfit);
      } else if (ocrError) {
        setOcrError(ocrError);
      }
    } catch (err: any) {
      setOcrError(err.message || "Failed to scan screenshot.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileUpload(file);
          break;
        }
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument,
          session,
          setup,
          direction,
          entryPrice: Number(entryPrice),
          stopLoss: Number(stopLoss),
          takeProfit: Number(takeProfit),
          result,
          notes,
          imageUrl,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setImageUrl(null);
        setDetectedOCR(null);
        fetchBacktests();
      }
    } catch (err) {
      alert("Failed to save backtest trade.");
    }
  };

  // Backtest Stats Calculations
  const total = backtests.length;
  const wins = backtests.filter((b) => b.result === "WIN").length;
  const losses = backtests.filter((b) => b.result === "LOSS").length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  const totalR = backtests.reduce((acc, b) => acc + (b.rMultiple || 0), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Backtesting Engine</h1>
            <p className="text-xs text-[#94A3B8]">
              Strategy simulation database isolated from live account trading statistics
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setImageUrl(null);
            setDetectedOCR(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Backtest Trade</span>
        </button>
      </div>

      {/* Backtest KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div>
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total Backtest Trades</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">{total}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Backtest Win Rate</span>
          <span className="text-xl font-mono font-bold text-[#22C55E] mt-1 block">{winRate}%</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Total R Return</span>
          <span className="text-xl font-mono font-bold text-[#38BDF8] mt-1 block">
            {totalR >= 0 ? `+${totalR.toFixed(2)}R` : `${totalR.toFixed(2)}R`}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Wins / Losses</span>
          <span className="text-xl font-mono font-bold text-white mt-1 block">
            {wins}W / {losses}L
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#050B14]/60 text-[11px] font-bold text-[#94A3B8] uppercase">
              <th className="py-3.5 px-4">Date</th>
              <th className="py-3.5 px-4">Chart</th>
              <th className="py-3.5 px-4">Instrument</th>
              <th className="py-3.5 px-4">Direction</th>
              <th className="py-3.5 px-4">Session</th>
              <th className="py-3.5 px-4">Setup</th>
              <th className="py-3.5 px-4 text-right">Entry / SL / TP</th>
              <th className="py-3.5 px-4 text-center">Result</th>
              <th className="py-3.5 px-4 text-right">Actual R:R</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {backtests.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#64748B]">
                  No backtest trades recorded yet. Click "+ Log Backtest Trade" to start.
                </td>
              </tr>
            ) : (
              backtests.map((b) => {
                const isShort = b.direction === "SHORT";

                return (
                  <tr key={b.id} className="hover:bg-[#101A2B]/60">
                    <td className="py-3 px-4 font-mono text-white whitespace-nowrap">
                      {formatGregorianDate(b.date)}
                    </td>
                    <td className="py-3 px-4">
                      {b.imageUrl ? (
                        <button
                          onClick={() => setLightboxUrl(b.imageUrl)}
                          className="relative w-10 h-7 rounded-lg overflow-hidden border border-[#1E293B] hover:border-[#38BDF8] transition-colors"
                          title="View Chart"
                        >
                          <TradeScreenshotImage
                            url={b.imageUrl}
                            alt="Chart"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <span className="text-[#64748B] text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">{b.instrument}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-extrabold text-[11px] ${
                          isShort ? "text-[#EF4444]" : "text-[#22C55E]"
                        }`}
                      >
                        {isShort ? "SHORT ⬇" : "LONG ⬆"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#94A3B8] whitespace-nowrap">{b.session}</td>
                    <td className="py-3 px-4 text-[#38BDF8]">{b.setup || "—"}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#94A3B8] whitespace-nowrap">
                      {b.entryPrice} / {b.stopLoss} / {b.takeProfit}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          b.result === "WIN"
                            ? "bg-[#22C55E]/10 text-[#22C55E]"
                            : b.result === "LOSS"
                            ? "bg-[#EF4444]/10 text-[#EF4444]"
                            : "bg-[#F59E0B]/10 text-[#F59E0B]"
                        }`}
                      >
                        {b.result}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                        isShort
                          ? "text-[#EF4444]"
                          : b.rMultiple > 0
                          ? "text-[#22C55E]"
                          : b.rMultiple < 0
                          ? "text-[#EF4444]"
                          : "text-[#F59E0B]"
                      }`}
                    >
                      {b.rMultiple > 0 ? `+${b.rMultiple}R` : `${b.rMultiple}R`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Delete Backtest"
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors inline-flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          onPaste={handlePaste}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <div className="max-w-lg w-full p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#38BDF8]" />
                Log Backtest Trade
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TradingView Screenshot OCR Scanner */}
            <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-xs font-bold text-white">Paste or Upload Chart</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={ocrLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-[#101A2B] border border-[#1E293B] text-white hover:border-[#38BDF8]"
                >
                  {ocrLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{ocrLoading ? "Scanning..." : "Upload Screenshot"}</span>
                </button>
              </div>

              {imageUrl && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#1E293B]">
                  <TradeScreenshotImage
                    url={imageUrl}
                    alt="Backtest Screenshot"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {detectedOCR && (
                <div className="p-3 rounded-lg bg-[#101A2B] border border-[#38BDF8]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                    <span className="text-white font-semibold">
                      Levels auto-filled ({detectedOCR.direction} • {detectedOCR.actualR != null ? `${detectedOCR.actualR}R` : "—"})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Instrument</label>
                  <input
                    type="text"
                    value={instrument}
                    onChange={(e) => setInstrument(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-bold text-white uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Session</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  >
                    <option value="">Select a configured session</option>
                    {configuration.sessions.map((item: any) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Direction</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDirection("LONG")}
                      className={`py-1.5 rounded-lg border text-xs font-bold ${
                        direction === "LONG"
                          ? "bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]"
                          : "bg-[#050B14] border-[#1E293B] text-[#94A3B8]"
                      }`}
                    >
                      LONG ⬆
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("SHORT")}
                      className={`py-1.5 rounded-lg border text-xs font-bold ${
                        direction === "SHORT"
                          ? "bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]"
                          : "bg-[#050B14] border-[#1E293B] text-[#94A3B8]"
                      }`}
                    >
                      SHORT ⬇
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Setup / Strategy</label>
                  <select
                    value={setup}
                    onChange={(e) => setSetup(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  >
                    <option value="">Select a configured setup</option>
                    {configuration.setups.map((item: any) => <option key={item.id} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#EF4444] block mb-1 font-semibold">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-[#EF4444]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#22C55E] block mb-1 font-semibold">Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-[#22C55E]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] block mb-1 font-semibold">Outcome Result</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["WIN", "LOSS", "BREAKEVEN"] as const).map((res) => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setResult(res)}
                      className={`py-2 rounded-xl border text-xs font-extrabold font-mono transition-all ${
                        result === res
                          ? res === "WIN"
                            ? "bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]"
                            : res === "LOSS"
                            ? "bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]"
                            : "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B]"
                          : "bg-[#050B14] border-[#1E293B] text-[#94A3B8]"
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#94A3B8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <TradeScreenshotImage
              url={lightboxUrl}
              alt="Backtest Screenshot Enlarge"
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl border border-[#1E293B]"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-[#EF4444] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
