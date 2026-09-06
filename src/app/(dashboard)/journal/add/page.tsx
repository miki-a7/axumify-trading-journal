"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  DollarSign,
  Layers,
  Brain,
  Upload,
  Check,
  Save,
  ArrowLeft,
  X,
  Plus,
  Sparkles,
  Camera,
  CheckCircle,
  XCircle,
  MinusCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { TradeImageFormItem } from "@/lib/images/trade-image";
import { formImagesForApi, getImagePreviewSrc } from "@/lib/images/trade-image";
import {
  type OCRDetectedData,
  processScreenshotFile,
  uploadFileToStorage,
  buildDragDropHandlers,
} from "@/lib/images/upload-client";
import {
  calculateSingleTradeMetrics,
  formatRRMagnitude,
  formatPnlDisplay,
  computePnlFromResult,
  formatSignedRDisplay,
} from "@/lib/calculations/stats";

export default function AddTradePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"general" | "plan" | "ict" | "psych" | "images">("general");

  // Core Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [instrument, setInstrument] = useState("EURUSD");
  const [market, setMarket] = useState("FOREX");
  const [session, setSession] = useState("New York");
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [timeframe, setTimeframe] = useState("15m");

  // Pricing (Optional)
  const [showAdvancedLevels, setShowAdvancedLevels] = useState(false);
  const [entryPrice, setEntryPrice] = useState<number | "">("");
  const [stopLoss, setStopLoss] = useState<number | "">("");
  const [takeProfit, setTakeProfit] = useState<number | "">("");
  const [exitPrice, setExitPrice] = useState<number | "">("");
  const [positionSize, setPositionSize] = useState<number | "">("");

  // Risk & Outcome
  const [riskAmount, setRiskAmount] = useState<number | "">(300);
  const [riskPercentage, setRiskPercentage] = useState<number | "">(1.0);
  // Actual R:R magnitude — user enters positive number (e.g. 5), sign derived from result
  const [actualRRInput, setActualRRInput] = useState<number | "">("");
  const [result, setResult] = useState<"WIN" | "LOSS" | "BREAKEVEN">("WIN");
  const [grade, setGrade] = useState("A_PLUS");

  // Possible R:R
  const [possibleRR, setPossibleRR] = useState<number | "">("");

  // OCR Screenshot State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStep, setOcrStep] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [detectedOCR, setDetectedOCR] = useState<OCRDetectedData | null>(null);

  // Screenshots Gallery
  const [images, setImages] = useState<TradeImageFormItem[]>([]);
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgType, setNewImgType] = useState("BEFORE_ENTRY");

  // ICT Concepts Multi-select
  const ictOptions = [
    "Buy-side liquidity", "Sell-side liquidity", "Liquidity sweep",
    "Market Structure Shift (MSS)", "Break of Structure (BOS)", "Displacement",
    "Fair Value Gap (FVG)", "Inverse FVG (IFVG)", "Order Block", "Breaker Block",
    "Mitigation Block", "Premium", "Discount", "OTE", "Equal Highs", "Equal Lows",
    "Previous Day High", "Previous Day Low", "Previous Week High", "Previous Week Low",
    "Asian High", "Asian Low", "London High", "London Low"
  ];
  const [selectedIct, setSelectedIct] = useState<string[]>(["Liquidity sweep", "MSS", "FVG"]);
  const [setup, setSetup] = useState("Liquidity Sweep + FVG Retracement");

  // General Confluence (HTF) & Execution Confluence (LTF)
  const [gc, setGc] = useState("");
  const [ec, setEc] = useState("");

  // Trade Plan
  const [htfBias, setHtfBias] = useState("Bullish");
  const [marketCondition, setMarketCondition] = useState("Trending");
  const [liquidityTarget, setLiquidityTarget] = useState("Previous Day High");
  const [entryModel, setEntryModel] = useState("15m FVG Retracement");
  const [confirmation, setConfirmation] = useState("1m MSS + Displacement");
  const [invalidation, setInvalidation] = useState("Below Asian Low");
  const [targetReason, setTargetReason] = useState("Unfilled liquidity gap above Asia High");
  const [reasonForEntry, setReasonForEntry] = useState("Asian low swept cleanly at NY open with sharp displacement.");

  // Psychology Ratings (1-5)
  const [psychConfidence, setPsychConfidence] = useState(5);
  const [psychPatience, setPsychPatience] = useState(5);
  const [psychFear, setPsychFear] = useState(1);
  const [psychGreed, setPsychGreed] = useState(1);
  const [psychFOMO, setPsychFOMO] = useState(1);
  const [psychRevenge, setPsychRevenge] = useState(1);
  const [psychDiscipline, setPsychDiscipline] = useState(5);
  const [psychStress, setPsychStress] = useState(1);

  const [emotionBefore, setEmotionBefore] = useState("Calm & Focused");
  const [emotionDuring, setEmotionDuring] = useState("Patient");
  const [emotionAfter, setEmotionAfter] = useState("Confident");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [brokeRule, setBrokeRule] = useState(false);
  const [enteredTooEarly, setEnteredTooEarly] = useState(false);
  const [movedSL, setMovedSL] = useState(false);
  const [closedEarly, setClosedEarly] = useState(false);
  const [overtraded, setOvertraded] = useState(false);

  const [mistakesInput, setMistakesInput] = useState("");
  const [positivesInput, setPositivesInput] = useState("Clean execution following standard entry model.");
  const [notes, setNotes] = useState("");

  // Execution & Performance Metrics
  const [mae, setMae] = useState<number | "">("");
  const [mfe, setMfe] = useState<number | "">("");
  const [commission, setCommission] = useState<number | "">("");
  const [fees, setFees] = useState<number | "">("");
  const [swap, setSwap] = useState<number | "">("");
  const [slippage, setSlippage] = useState<number | "">("");

  // Calculations
  const entryNum = entryPrice !== "" ? Number(entryPrice) : null;
  const slNum = stopLoss !== "" ? Number(stopLoss) : null;
  const tpNum = takeProfit !== "" ? Number(takeProfit) : null;

  // Derive R:R magnitude: user input takes precedence, then price-derived
  let calculatedActualRR = 2.0;
  if (actualRRInput !== "" && Number(actualRRInput) > 0) {
    calculatedActualRR = Number(actualRRInput);
  } else if (entryNum !== null && slNum !== null && tpNum !== null) {
    let riskDist = Math.abs(direction === "LONG" ? entryNum - slNum : slNum - entryNum);
    let rewardDist = Math.abs(direction === "LONG" ? tpNum - entryNum : entryNum - tpNum);
    if (riskDist > 0 && rewardDist > 0) {
      calculatedActualRR = Number((rewardDist / riskDist).toFixed(2));
    }
  }

  const effectiveRRMagnitude = calculatedActualRR;

  const riskAmtNum = Number(riskAmount) || 300;
  const computedPnl = computePnlFromResult(riskAmtNum, effectiveRRMagnitude, result);

  const [submitting, setSubmitting] = useState(false);

  const toggleIct = (item: string) => {
    setSelectedIct((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const addImage = () => {
    if (!newImgUrl) return;
    setImages([...images, { type: newImgType, url: newImgUrl, previewUrl: newImgUrl, caption: `${newImgType} Screenshot` }]);
    setNewImgUrl("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleOcrFileUpload = async (file: File) => {
    setOcrLoading(true);
    setOcrStep("Uploading chart...");
    setOcrError(null);
    try {
      const { image, ocr, ocrError } = await processScreenshotFile(file, "ENTRY", (step) => {
        const labels: Record<string, string> = {
          uploading: "Uploading chart...",
          scanning: "Scanning chart...",
          detecting_entry: "Detecting Entry...",
          detecting_sl: "Detecting Stop Loss...",
          detecting_tp: "Detecting Take Profit...",
          done: "Done",
        };
        setOcrStep(labels[step] || "Processing...");
      });
      setImages((prev) => {
        if (prev.some((img) => img.url === image.url)) return prev;
        return [...prev, image];
      });
      if (ocr) {
        setDetectedOCR(ocr);
      } else {
        setOcrError(ocrError);
      }
    } catch (err: any) {
      setOcrError(err.message || "Failed to upload screenshot.");
    } finally {
      setOcrLoading(false);
      setOcrStep("");
    }
  };

  const handleApplyOcr = () => {
    if (!detectedOCR) return;
    if (detectedOCR.direction) setDirection(detectedOCR.direction);
    if (detectedOCR.entryPrice !== undefined) setEntryPrice(detectedOCR.entryPrice);
    if (detectedOCR.exitPrice !== undefined) setExitPrice(detectedOCR.exitPrice);
    if (detectedOCR.stopLoss !== undefined) setStopLoss(detectedOCR.stopLoss);
    if (detectedOCR.takeProfit !== undefined) setTakeProfit(detectedOCR.takeProfit);
    if (detectedOCR.actualR !== undefined && detectedOCR.actualR > 0) setActualRRInput(detectedOCR.actualR);
    if (detectedOCR.imageUrl) {
      setImages((prev) => {
        if (prev.some((img) => img.url === detectedOCR.imageUrl)) return prev;
        return [
          ...prev,
          {
            type: "ENTRY",
            url: detectedOCR.imageUrl!,
            previewUrl: detectedOCR.imageUrl!,
            caption: "TradingView Chart Screenshot",
          },
        ];
      });
    }
    setShowAdvancedLevels(true);
    setDetectedOCR(null);
  };

  const handleDirectGalleryUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const { path, previewUrl } = await uploadFileToStorage(file);
      setImages((prev) => [
        ...prev,
        { type: newImgType, url: path, previewUrl, caption: `${newImgType.replace("_", " ")} Screenshot` },
      ]);
    } catch (err: any) {
      alert(`Failed to upload image: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const dragDropHandlers = buildDragDropHandlers((file) => handleOcrFileUpload(file));

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.[0]?.type.startsWith("image/")) {
        handleOcrFileUpload(e.clipboardData.files[0]);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        date,
        instrument: instrument.trim().toUpperCase(),
        market,
        session,
        direction,
        timeframe,
        entryPrice: entryPrice !== "" ? Number(entryPrice) : undefined,
        stopLoss: stopLoss !== "" ? Number(stopLoss) : undefined,
        takeProfit: takeProfit !== "" ? Number(takeProfit) : undefined,
        exitPrice: exitPrice !== "" ? Number(exitPrice) : undefined,
        positionSize: positionSize !== "" ? Number(positionSize) : undefined,
        riskAmount: riskAmtNum,
        riskPercentage: riskPercentage !== "" ? Number(riskPercentage) : 1.0,
        plannedRR: effectiveRRMagnitude,
        possibleRR: possibleRR !== "" ? Number(possibleRR) : undefined,
        actualR: effectiveRRMagnitude,
        pnl: computedPnl,
        result,
        grade,
        mae: mae !== "" ? Number(mae) : undefined,
        mfe: mfe !== "" ? Number(mfe) : undefined,
        commission: commission !== "" ? Number(commission) : undefined,
        fees: fees !== "" ? Number(fees) : undefined,
        swap: swap !== "" ? Number(swap) : undefined,
        slippage: slippage !== "" ? Number(slippage) : undefined,
        ictConcepts: selectedIct,
        setup,
        gc,
        ec,
        htfBias,
        marketCondition,
        liquidityTarget,
        entryModel,
        confirmation,
        invalidation,
        targetReason,
        reasonForEntry,
        psychConfidence,
        psychPatience,
        psychFear,
        psychGreed,
        psychFOMO,
        psychRevenge,
        psychDiscipline,
        psychStress,
        emotionBefore,
        emotionDuring,
        emotionAfter,
        followedPlan,
        brokeRule,
        enteredTooEarly,
        movedSL,
        closedEarly,
        overtraded,
        mistakes: mistakesInput.split("\n").filter((s) => s.trim()),
        positives: positivesInput.split("\n").filter((s) => s.trim()),
        notes,
        images: formImagesForApi(images),
      };

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to save trade");
      }

      router.push("/journal");
      router.refresh();
    } catch (err: any) {
      alert(`Error saving trade: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Log New Trade Record</h1>
            <p className="text-xs text-[#94A3B8]">Fast execution logging, TradingView OCR auto-detection & journal reflection</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? "Saving..." : "Save Trade Entry"}</span>
        </button>
      </div>

      {/* TradingView Screenshot OCR Scanning Zone */}
      <div
        className="p-5 rounded-2xl bg-[#0B1220] border border-[#1E293B] relative overflow-hidden"
        {...dragDropHandlers}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#38BDF8]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                TradingView Screenshot Scanner
                <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/10 text-[#38BDF8] text-[10px] font-semibold">
                  OCR AI
                </span>
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Paste screenshot (Ctrl+V) or upload chart image to auto-detect Direction, Stop Loss, Take Profit & Actual R:R
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleOcrFileUpload(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrLoading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#050B14] border border-[#1E293B] text-white hover:border-[#38BDF8] hover:text-[#38BDF8] transition-all disabled:opacity-50"
            >
              {ocrLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" /> : <Upload className="w-3.5 h-3.5" />}
              <span>{ocrLoading ? (ocrStep || "Scanning...") : "Upload Screenshot"}</span>
            </button>
          </div>
        </div>

        {ocrError && (
          <div className="mt-4 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{ocrError}</span>
            </div>
            <button type="button" onClick={() => setOcrError(null)} className="text-xs hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {detectedOCR && (
          <div className="mt-4 p-4 rounded-xl bg-[#101A2B] border border-[#38BDF8]/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Detected Levels</h4>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${detectedOCR.confidence === "HIGH" ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-[#F59E0B]/20 text-[#F59E0B]"}`}>
                  Confidence: {detectedOCR.confidence}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyOcr}
                  className="px-3.5 py-1.5 rounded-lg bg-[#22C55E] text-slate-950 font-extrabold text-xs hover:bg-[#16A34A] transition-all"
                >
                  Apply Detected Levels
                </button>
                <button
                  type="button"
                  onClick={() => setDetectedOCR(null)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#050B14] border border-[#1E293B] text-xs text-[#94A3B8] hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Direction</span>
                <span className={`font-mono font-extrabold ${detectedOCR.direction === "LONG" ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {detectedOCR.direction || "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Actual R:R</span>
                <span className={`font-mono font-extrabold ${detectedOCR.direction === "SHORT" ? "text-[#EF4444]" : "text-[#38BDF8]"}`}>
                  {detectedOCR.actualR ? `${detectedOCR.actualR}R` : "—"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Entry Price</span>
                <span className="font-mono font-bold text-white">{detectedOCR.entryPrice ?? "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Exit Price</span>
                <span className="font-mono font-bold text-white">{detectedOCR.exitPrice ?? "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Stop Loss</span>
                <span className="font-mono font-bold text-[#EF4444]">{detectedOCR.stopLoss ?? "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#050B14] border border-[#1E293B]">
                <span className="text-[10px] text-[#94A3B8] block font-semibold">Take Profit</span>
                <span className="font-mono font-bold text-[#22C55E]">{detectedOCR.takeProfit ?? "—"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0B1220] border border-[#1E293B] overflow-x-auto">
        {[
          { id: "general", label: "1. Core Trade Entry", icon: DollarSign },
          { id: "plan", label: "2. Trade Plan", icon: BookOpen },
          { id: "ict", label: "3. ICT / SMC Setup", icon: Layers },
          { id: "psych", label: "4. Psychology", icon: Brain },
          { id: "images", label: "5. Screenshots", icon: Upload },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive ? "bg-[#2563EB] text-white shadow-sm" : "text-[#94A3B8] hover:text-white hover:bg-[#101A2B]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-6">
        {/* TAB 1: CORE TRADE ENTRY */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3 flex items-center justify-between">
              <span>Core Trade Execution & Outcome</span>
              <span className="text-xs font-normal text-[#94A3B8]">Entry & Exit prices are completely optional</span>
            </h2>

            {/* Outcome Selection Buttons */}
            <div>
              <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block mb-2.5">
                Trade Outcome Result
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setResult("WIN")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                    result === "WIN"
                      ? "bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E] shadow-lg shadow-[#22C55E]/10"
                      : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:border-[#22C55E]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-base font-extrabold">WIN</span>
                  </div>
                  <span className="text-xs font-mono font-bold">
                    {formatRRMagnitude(effectiveRRMagnitude)} ({formatPnlDisplay(computePnlFromResult(riskAmtNum, effectiveRRMagnitude, "WIN"))})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResult("LOSS")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                    result === "LOSS"
                      ? "bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444] shadow-lg shadow-[#EF4444]/10"
                      : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:border-[#EF4444]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    <span className="text-base font-extrabold">LOSS</span>
                  </div>
                  <span className="text-xs font-mono font-bold">
                    -1.00R ({formatPnlDisplay(computePnlFromResult(riskAmtNum, effectiveRRMagnitude, "LOSS"))})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setResult("BREAKEVEN")}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                    result === "BREAKEVEN"
                      ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] shadow-lg shadow-[#F59E0B]/10"
                      : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:border-[#F59E0B]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MinusCircle className="w-5 h-5" />
                    <span className="text-base font-extrabold">BREAKEVEN</span>
                  </div>
                  <span className="text-xs font-mono font-bold">0.00R ({formatPnlDisplay(0)})</span>
                </button>
              </div>
            </div>

            {/* General Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Trade Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Instrument</label>
                <input
                  type="text"
                  placeholder="EURUSD, NAS100, BTCUSD"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-bold text-white uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection("LONG")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      direction === "LONG"
                        ? "bg-[#22C55E]/15 border-[#22C55E] text-[#22C55E]"
                        : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    LONG ⬆
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection("SHORT")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      direction === "SHORT"
                        ? "bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444]"
                        : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    SHORT ⬇
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Trading Session</label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                >
                  <option value="Asian">Asian Session</option>
                  <option value="London">London Session</option>
                  <option value="New York">New York Session</option>
                  <option value="London Close">London Close</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Market Category</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                >
                  <option value="FOREX">Forex</option>
                  <option value="INDICES">Indices</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="STOCKS">Stocks</option>
                  <option value="COMMODITIES">Commodities</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Timeframe</label>
                <input
                  type="text"
                  placeholder="e.g. 1m, 5m, 15m, 1h, 4h, D"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            {/* Risk & Planned/Possible RR Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4 border-t border-[#1E293B]">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Risk Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 100, 250, 300, 500"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Account risk for this trade ($)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Actual R:R</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 2, 2.5, 3"
                  value={actualRRInput}
                  onChange={(e) => setActualRRInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono font-bold ${
                    direction === "SHORT" ? "text-[#EF4444]" : "text-[#38BDF8]"
                  }`}
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Enter positive magnitude (e.g. 5). Sign is set by outcome.</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Possible R:R</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 3, 4, 5.5"
                  value={possibleRR}
                  onChange={(e) => setPossibleRR(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono font-bold text-[#22C55E]"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Maximum realistic R:R available from the setup</span>
              </div>
            </div>

            {/* Collapsible Optional Pricing Levels Section */}
            <div className="rounded-xl bg-[#050B14] border border-[#1E293B] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedLevels(!showAdvancedLevels)}
                className="w-full p-4 flex items-center justify-between text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#38BDF8]" />
                  <span>Advanced Price Levels & Position Details (Optional)</span>
                </div>
                {showAdvancedLevels ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvancedLevels && (
                <div className="p-4 pt-0 border-t border-[#1E293B] space-y-4">
                  <p className="text-[11px] text-[#64748B]">
                    Enter exact chart prices if you want detailed price tracking. If left blank, AXUMIFY uses your selected Outcome & Actual R:R.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Entry Price</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#EF4444] block mb-1">Stop Loss</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-[#EF4444]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#22C55E] block mb-1">Take Profit</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={takeProfit}
                        onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-[#22C55E]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Exit Price</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Optional"
                        value={exitPrice}
                        onChange={(e) => setExitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Position Size (Lots/Contracts)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1.0"
                        value={positionSize}
                        onChange={(e) => setPositionSize(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#94A3B8] block mb-1">Risk Percentage (%)</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 1.0%"
                        value={riskPercentage}
                        onChange={(e) => setRiskPercentage(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Live Calculations Preview Banner */}
            <div className="p-4 rounded-xl bg-[#101A2B] border border-[#1E293B] grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Actual R:R</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    direction === "SHORT" ? "text-[#EF4444]" : "text-[#38BDF8]"
                  }`}
                >
                  {effectiveRRMagnitude}R
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Actual R</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    result === "WIN"
                      ? "text-[#22C55E]"
                      : result === "LOSS"
                      ? "text-[#EF4444]"
                      : "text-[#F59E0B]"
                  }`}
                >
                  {formatSignedRDisplay(effectiveRRMagnitude, result)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Computed P&L</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    computedPnl > 0
                      ? "text-[#22C55E]"
                      : computedPnl < 0
                      ? "text-[#EF4444]"
                      : "text-white"
                  }`}
                >
                  {formatPnlDisplay(computedPnl)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Outcome Status</span>
                <span
                  className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-extrabold font-mono ${
                    result === "WIN"
                      ? "bg-[#22C55E]/20 text-[#22C55E]"
                      : result === "LOSS"
                      ? "bg-[#EF4444]/20 text-[#EF4444]"
                      : "bg-[#F59E0B]/20 text-[#F59E0B]"
                  }`}
                >
                  {result}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Trade Grade</span>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="mt-1 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E293B] text-xs font-bold text-[#38BDF8] text-center"
                >
                  <option value="A_PLUS">Grade A+</option>
                  <option value="A">Grade A</option>
                  <option value="B_PLUS">Grade B+</option>
                  <option value="B">Grade B</option>
                  <option value="C">Grade C</option>
                  <option value="D">Grade D</option>
                  <option value="F">Grade F</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRADE PLAN */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              Trade Planning & Execution Framework
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Higher Timeframe Bias</label>
                <input
                  type="text"
                  placeholder="e.g. Bullish, Bearish, Neutral, Expansion"
                  value={htfBias}
                  onChange={(e) => setHtfBias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Market Condition</label>
                <input
                  type="text"
                  placeholder="e.g. Trending, Consolidating, Reversal"
                  value={marketCondition}
                  onChange={(e) => setMarketCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Liquidity Target</label>
                <input
                  type="text"
                  placeholder="e.g. Previous Day High, Asia High, Internal BSL"
                  value={liquidityTarget}
                  onChange={(e) => setLiquidityTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Entry Model</label>
                <input
                  type="text"
                  placeholder="e.g. 15m FVG Retracement, Judas Swing"
                  value={entryModel}
                  onChange={(e) => setEntryModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Confirmation Trigger</label>
                <input
                  type="text"
                  placeholder="e.g. 1m MSS + Displacement, Candle close"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Trade Invalidation Level</label>
                <input
                  type="text"
                  placeholder="e.g. Below Asian Low, Above Breaker"
                  value={invalidation}
                  onChange={(e) => setInvalidation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Target Rationale</label>
              <textarea
                rows={2}
                placeholder="Why was this take profit chosen?"
                value={targetReason}
                onChange={(e) => setTargetReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Reason For Entry</label>
              <textarea
                rows={2}
                placeholder="Detailed rationale for taking this execution..."
                value={reasonForEntry}
                onChange={(e) => setReasonForEntry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />
            </div>

            {/* Execution Performance & Costs */}
            <div className="pt-4 border-t border-[#1E293B] space-y-4">
              <h3 className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
                Execution Performance & Costs (Optional)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">MAE</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.5"
                    value={mae}
                    onChange={(e) => setMae(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">MFE</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 24.0"
                    value={mfe}
                    onChange={(e) => setMfe(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">Commission ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 7.00"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">Fees ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2.50"
                    value={fees}
                    onChange={(e) => setFees(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">Swap ($)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. -1.20"
                    value={swap}
                    onChange={(e) => setSwap(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#94A3B8] block mb-1">Slippage</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 0.5"
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ICT / SMC SETUP */}
        {activeTab === "ict" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              ICT / Smart Money Concepts & Confluences
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Primary Setup Name</label>
              <input
                type="text"
                placeholder="e.g. Liquidity Sweep + FVG Retracement"
                value={setup}
                onChange={(e) => setSetup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />
            </div>

            {/* GC and EC Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] font-mono">GC</span>
                    General Confluence (HTF Context)
                  </label>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Higher timeframe bias, macro narrative, Daily/4H FVG, Draw on Liquidity (DOL), HTF order block.
                </p>
                <textarea
                  rows={2}
                  placeholder="e.g. Daily FVG mitigation + 4H Bullish Market Structure + Weekly DOL above equal highs"
                  value={gc}
                  onChange={(e) => setGc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#22C55E] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-[#22C55E]/20 text-[#22C55E] text-[10px] font-mono">EC</span>
                    Execution Confluence (LTF Trigger)
                  </label>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Lower timeframe trigger, 1m/5m MSS, displacement candle, liquidity sweep, session timing (Silver Bullet).
                </p>
                <textarea
                  rows={2}
                  placeholder="e.g. 1m MSS + energetic displacement into 15m FVG at 10:00 AM NY Open"
                  value={ec}
                  onChange={(e) => setEc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-2.5">
                Active ICT / SMC Confluences (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-2">
                {ictOptions.map((opt) => {
                  const isSelected = selectedIct.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleIct(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#2563EB] text-white border border-[#38BDF8]"
                          : "bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PSYCHOLOGY */}
        {activeTab === "psych" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              Trader Psychology & Emotional Ratings (1-5)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Confidence (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychConfidence}
                  onChange={(e) => setPsychConfidence(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
                <div className="text-right text-xs font-bold text-[#38BDF8]">{psychConfidence} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Patience (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychPatience}
                  onChange={(e) => setPsychPatience(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
                <div className="text-right text-xs font-bold text-[#38BDF8]">{psychPatience} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Discipline (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychDiscipline}
                  onChange={(e) => setPsychDiscipline(Number(e.target.value))}
                  className="w-full accent-[#2563EB]"
                />
                <div className="text-right text-xs font-bold text-[#38BDF8]">{psychDiscipline} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Fear Level (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychFear}
                  onChange={(e) => setPsychFear(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="text-right text-xs font-bold text-[#EF4444]">{psychFear} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Greed Level (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychGreed}
                  onChange={(e) => setPsychGreed(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="text-right text-xs font-bold text-[#EF4444]">{psychGreed} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">FOMO Level (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychFOMO}
                  onChange={(e) => setPsychFOMO(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="text-right text-xs font-bold text-[#EF4444]">{psychFOMO} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Revenge Urge (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychRevenge}
                  onChange={(e) => setPsychRevenge(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="text-right text-xs font-bold text-[#EF4444]">{psychRevenge} / 5</div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Stress Level (1-5)</label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={psychStress}
                  onChange={(e) => setPsychStress(Number(e.target.value))}
                  className="w-full accent-[#EF4444]"
                />
                <div className="text-right text-xs font-bold text-[#EF4444]">{psychStress} / 5</div>
              </div>
            </div>

            {/* Emotional State Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-[#1E293B]">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Emotion Before Entry</label>
                <input
                  type="text"
                  placeholder="e.g. Calm, Focused, Anxious"
                  value={emotionBefore}
                  onChange={(e) => setEmotionBefore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Emotion During Trade</label>
                <input
                  type="text"
                  placeholder="e.g. Patient, Relaxed, Nervous"
                  value={emotionDuring}
                  onChange={(e) => setEmotionDuring(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Emotion After Exit</label>
                <input
                  type="text"
                  placeholder="e.g. Satisfied, Disappointed, Relieved"
                  value={emotionAfter}
                  onChange={(e) => setEmotionAfter(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            {/* Behavioral Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1E293B]">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={followedPlan}
                  onChange={(e) => setFollowedPlan(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
                <span className="text-xs font-semibold text-white">Followed Trading Plan</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={brokeRule}
                  onChange={(e) => setBrokeRule(e.target.checked)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <span className="text-xs font-semibold text-[#EF4444]">Broke Trading Rule</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enteredTooEarly}
                  onChange={(e) => setEnteredTooEarly(e.target.checked)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <span className="text-xs font-semibold text-white">Entered Too Early</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={movedSL}
                  onChange={(e) => setMovedSL(e.target.checked)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <span className="text-xs font-semibold text-white">Moved Stop Loss</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={closedEarly}
                  onChange={(e) => setClosedEarly(e.target.checked)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <span className="text-xs font-semibold text-white">Closed Position Early</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-[#050B14] border border-[#1E293B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={overtraded}
                  onChange={(e) => setOvertraded(e.target.checked)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <span className="text-xs font-semibold text-[#EF4444]">Overtraded Session</span>
              </label>
            </div>

            {/* Positives & Mistakes text areas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#1E293B]">
              <div>
                <label className="text-xs font-semibold text-[#22C55E] block mb-1.5">What went well? (One per line)</label>
                <textarea
                  rows={3}
                  placeholder="Waited for HTF liquidity sweep&#10;Clean risk management"
                  value={positivesInput}
                  onChange={(e) => setPositivesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#EF4444] block mb-1.5">Mistakes / Lessons (One per line)</label>
                <textarea
                  rows={3}
                  placeholder="Slightly hesitant on entry trigger&#10;Chased price on 1m chart"
                  value={mistakesInput}
                  onChange={(e) => setMistakesInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">General Reflection & Journal Notes</label>
              <textarea
                rows={3}
                placeholder="Write your post-trade reflection, key lessons learned..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* TAB 5: SCREENSHOTS */}
        {activeTab === "images" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#38BDF8]">
                  Trade Chart Screenshots Gallery
                </h2>
                <p className="text-xs text-[#94A3B8]">
                  Upload high-resolution TradingView screenshots before entry, during execution, and after exit.
                </p>
              </div>
            </div>

            {/* Direct File Upload & Drag-Drop Card */}
            <div className="p-5 rounded-xl bg-[#050B14] border border-dashed border-[#1E293B] hover:border-[#38BDF8] transition-all text-center space-y-3"
              {...buildDragDropHandlers((file) => handleDirectGalleryUpload(file))}
            >
              <Upload className="w-8 h-8 text-[#38BDF8] mx-auto" />
              <div>
                <p className="text-xs font-semibold text-white">Upload Screenshot to Supabase Storage</p>
                <p className="text-[11px] text-[#64748B]">Click to browse file or paste directly anywhere with Ctrl+V</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <select
                  value={newImgType}
                  onChange={(e) => setNewImgType(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#0B1220] border border-[#1E293B] text-xs text-white"
                >
                  <option value="BEFORE_ENTRY">Before Entry</option>
                  <option value="ENTRY">During Execution</option>
                  <option value="AFTER_TRADE">After Exit</option>
                </select>
                <label className="cursor-pointer px-4 py-1.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-all">
                  <span>{uploadingImage ? "Uploading..." : "Browse Image File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => e.target.files?.[0] && handleDirectGalleryUpload(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            {/* Or add via URL */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                type="text"
                placeholder="Or paste external image URL..."
                value={newImgUrl}
                onChange={(e) => setNewImgUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />

              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#050B14] border border-[#1E293B] text-white hover:bg-[#101A2B]"
              >
                + Add via URL
              </button>
            </div>

            {/* Uploaded Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {images.length === 0 ? (
                <div className="col-span-3 py-10 text-center text-[#64748B] text-xs">
                  No chart screenshots uploaded yet. Use the upload button above, paste with Ctrl+V, or use OCR scanning.
                </div>
              ) : (
                images.map((img, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden border border-[#1E293B] bg-[#050B14] group">
                    <img src={getImagePreviewSrc(img)} alt={img.type} className="w-full h-44 object-cover" />
                    <div className="p-2.5 flex items-center justify-between text-xs font-semibold text-white bg-[#0B1220]/90">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#38BDF8] font-mono">
                        {img.type.replace("_", " ")}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="p-1 rounded text-[#EF4444] hover:bg-[#EF4444]/20"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
