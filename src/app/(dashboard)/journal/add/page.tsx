"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function AddTradePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "plan" | "ict" | "psych" | "images">("general");

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [instrument, setInstrument] = useState("EURUSD");
  const [market, setMarket] = useState("FOREX");
  const [session, setSession] = useState("New York");
  const [direction, setDirection] = useState("LONG");
  const [timeframe, setTimeframe] = useState("15m");

  const [entryPrice, setEntryPrice] = useState<number | "">(1.0850);
  const [stopLoss, setStopLoss] = useState<number | "">(1.0835);
  const [takeProfit, setTakeProfit] = useState<number | "">(1.0895);
  const [exitPrice, setExitPrice] = useState<number | "">(1.0895);
  const [positionSize, setPositionSize] = useState<number | "">(2.0);
  const [riskAmount, setRiskAmount] = useState<number | "">(300);
  const [riskPercentage, setRiskPercentage] = useState<number | "">(1.0);
  const [result, setResult] = useState("WIN");
  const [grade, setGrade] = useState("A_PLUS");

  // Auto-calculated fields
  const entry = Number(entryPrice) || 0;
  const sl = Number(stopLoss) || 0;
  const tp = Number(takeProfit) || 0;
  const exit = exitPrice !== "" && exitPrice !== undefined ? Number(exitPrice) : null;

  const stopDist = Math.abs(entry - sl);
  const targetDist = Math.abs(tp - entry);
  const plannedRR = stopDist > 0 ? Number((targetDist / stopDist).toFixed(2)) : 1.0;

  // Auto-calculate actual R based on direction & exit price
  let autoCalculatedR = 0;
  if (exit !== null && stopDist > 0) {
    if (direction === "LONG") {
      autoCalculatedR = Number(((exit - entry) / stopDist).toFixed(2));
    } else {
      autoCalculatedR = Number(((entry - exit) / stopDist).toFixed(2));
    }
  } else {
    if (result === "WIN") autoCalculatedR = plannedRR;
    else if (result === "LOSS") autoCalculatedR = -1.0;
    else autoCalculatedR = 0.0;
  }

  // State for manual R Multiple override
  const [actualRInput, setActualRInput] = useState<string>("");
  const [isManualROverride, setIsManualROverride] = useState(false);

  // Effective actual R used across form and live calculations
  const actualR = isManualROverride && actualRInput !== ""
    ? Number(actualRInput)
    : autoCalculatedR;

  // P&L calculation
  const riskAmt = Number(riskAmount) || 250;
  const computedPnl = Number((riskAmt * actualR).toFixed(2));

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

  // Trade Plan
  const [htfBias, setHtfBias] = useState("Bullish");
  const [marketCondition, setMarketCondition] = useState("Trending");
  const [liquidityTarget, setLiquidityTarget] = useState("Previous Day High");
  const [entryModel, setEntryModel] = useState("15m FVG Retracement");
  const [confirmation, setConfirmation] = useState("1m MSS + Displacement");
  const [invalidation, setInvalidation] = useState("Below Asian Low");
  const [reasonForEntry, setReasonForEntry] = useState("Asian low swept cleanly at NY open with sharp displacement.");

  // Psychology Ratings (1-5)
  const [psychConfidence, setPsychConfidence] = useState(5);
  const [psychPatience, setPsychPatience] = useState(5);
  const [psychFear, setPsychFear] = useState(1);
  const [psychGreed, setPsychGreed] = useState(1);
  const [psychFOMO, setPsychFOMO] = useState(1);
  const [psychDiscipline, setPsychDiscipline] = useState(5);

  const [emotionBefore, setEmotionBefore] = useState("Calm & Focused");
  const [emotionDuring, setEmotionDuring] = useState("Patient");
  const [emotionAfter, setEmotionAfter] = useState("Confident");
  const [followedPlan, setFollowedPlan] = useState(true);
  const [enteredTooEarly, setEnteredTooEarly] = useState(false);
  const [movedSL, setMovedSL] = useState(false);
  const [notes, setNotes] = useState("");

  // Execution & Performance Metrics
  const [mae, setMae] = useState<number | "">("");
  const [mfe, setMfe] = useState<number | "">("");
  const [commission, setCommission] = useState<number | "">("");
  const [fees, setFees] = useState<number | "">("");
  const [swap, setSwap] = useState<number | "">("");
  const [slippage, setSlippage] = useState<number | "">("");

  // Screenshots
  const [images, setImages] = useState<{ type: string; url: string; caption?: string }[]>([]);
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgType, setNewImgType] = useState("BEFORE_ENTRY");

  const [submitting, setSubmitting] = useState(false);

  const toggleIct = (item: string) => {
    if (selectedIct.includes(item)) {
      setSelectedIct(selectedIct.filter((i) => i !== item));
    } else {
      setSelectedIct([...selectedIct, item]);
    }
  };

  const addImage = () => {
    if (!newImgUrl) return;
    setImages([...images, { type: newImgType, url: newImgUrl, caption: `${newImgType} Screenshot` }]);
    setNewImgUrl("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        date,
        instrument,
        market,
        session,
        direction,
        timeframe,
        entryPrice: Number(entryPrice),
        stopLoss: Number(stopLoss),
        takeProfit: Number(takeProfit),
        exitPrice: exit !== null ? exit : (actualR > 0 ? tp : actualR < 0 ? sl : entry),
        positionSize: Number(positionSize) || 1.0,
        riskAmount: riskAmt,
        riskPercentage: Number(riskPercentage) || 1.0,
        plannedRR,
        actualR,
        pnl: computedPnl,
        mae: mae === "" ? undefined : Number(mae),
        mfe: mfe === "" ? undefined : Number(mfe),
        commission: commission === "" ? undefined : Number(commission),
        fees: fees === "" ? undefined : Number(fees),
        swap: swap === "" ? undefined : Number(swap),
        slippage: slippage === "" ? undefined : Number(slippage),
        result: actualR > 0 ? "WIN" : actualR < 0 ? "LOSS" : "BREAKEVEN",
        grade,
        ictConcepts: selectedIct,
        setup,
        htfBias,
        marketCondition,
        liquidityTarget,
        entryModel,
        confirmation,
        invalidation,
        reasonForEntry,
        psychConfidence,
        psychPatience,
        psychFear,
        psychGreed,
        psychFOMO,
        psychDiscipline,
        emotionBefore,
        emotionDuring,
        emotionAfter,
        followedPlan,
        enteredTooEarly,
        movedSL,
        notes,
        images,
      };

      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create trade");
      }

      router.push("/journal");
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
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-[#94A3B8] hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Log New Trade Record</h1>
            <p className="text-xs text-[#94A3B8]">Record execution numbers, ICT setups, trade plan & psychology</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? "Saving..." : "Save Trade Entry"}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0B1220] border border-[#1E293B] overflow-x-auto">
        {[
          { id: "general", label: "1. Execution Numbers", icon: DollarSign },
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
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#2563EB] text-white shadow-sm"
                  : "text-[#94A3B8] hover:text-white hover:bg-[#101A2B]"
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
        {/* TAB 1: GENERAL & NUMBERS */}
        {activeTab === "general" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              General Details & Execution Numbers
            </h2>

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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  required
                />
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
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-bold text-white"
                >
                  <option value="LONG">Long ⬆</option>
                  <option value="SHORT">Short ⬇</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Timeframe</label>
                <input
                  type="text"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 pt-4 border-t border-[#1E293B]">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Entry Price</label>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Stop Loss</label>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-[#EF4444]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Take Profit</label>
                <input
                  type="number"
                  step="any"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-[#22C55E]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Exit Price</label>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Risk Amount & Flexible R Multiple Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-[#1E293B]">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Risk Amount ($)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 100, 250, 500"
                  value={riskAmount}
                  onChange={(e) => setRiskAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Account risk for this trade ($)</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#94A3B8]">R Multiple / R Result</label>
                  {isManualROverride && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualROverride(false);
                        setActualRInput("");
                      }}
                      className="text-[10px] font-bold text-[#38BDF8] hover:underline"
                    >
                      Reset to Auto
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  placeholder={`e.g. ${autoCalculatedR}`}
                  value={isManualROverride ? actualRInput : autoCalculatedR}
                  onChange={(e) => {
                    setIsManualROverride(true);
                    setActualRInput(e.target.value);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border text-xs font-mono font-bold ${
                    actualR > 0
                      ? "border-[#22C55E]/40 text-[#22C55E]"
                      : actualR < 0
                      ? "border-[#EF4444]/40 text-[#EF4444]"
                      : "border-[#1E293B] text-[#F59E0B]"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-[#94A3B8]">
                    Calculated R: <strong className="text-white">{autoCalculatedR >= 0 ? `+${autoCalculatedR}R` : `${autoCalculatedR}R`}</strong>
                  </span>
                  {isManualROverride && <span className="text-[#F59E0B] font-bold">Manual Override Active</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Position Size (Lots)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 1.0"
                  value={positionSize}
                  onChange={(e) => setPositionSize(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white"
                />
                <span className="text-[10px] text-[#64748B] mt-1 block">Lots or contracts traded</span>
              </div>
            </div>

            {/* Calculations Preview Banner */}
            <div className="p-4 rounded-xl bg-[#101A2B] border border-[#1E293B] grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Planned R:R</span>
                <span className="text-base font-extrabold font-mono text-[#38BDF8]">1:{plannedRR}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Actual R Multiple</span>
                <span className={`text-base font-extrabold font-mono ${actualR >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {actualR >= 0 ? `+${actualR}R` : `${actualR}R`}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Computed P&L</span>
                <span className={`text-base font-extrabold font-mono ${computedPnl >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}>
                  {computedPnl >= 0 ? `+$${computedPnl.toLocaleString()}` : `-$${Math.abs(computedPnl).toLocaleString()}`}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Outcome Result</span>
                <select
                  value={actualR > 0 ? "WIN" : actualR < 0 ? "LOSS" : result}
                  onChange={(e) => setResult(e.target.value)}
                  className="mt-1 px-2 py-0.5 rounded bg-[#050B14] border border-[#1E293B] text-xs font-bold text-white text-center"
                >
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAKEVEN">BREAKEVEN</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRADE PLAN */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              Pre-Trade Plan & Confluence Section
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Higher Timeframe Bias</label>
                <input
                  type="text"
                  placeholder="e.g. Bullish Daily / 4h"
                  value={htfBias}
                  onChange={(e) => setHtfBias(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Market Condition</label>
                <input
                  type="text"
                  placeholder="Trending, Consolidation, Expansion"
                  value={marketCondition}
                  onChange={(e) => setMarketCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Liquidity Target</label>
                <input
                  type="text"
                  placeholder="Previous Day High, EQL Pool"
                  value={liquidityTarget}
                  onChange={(e) => setLiquidityTarget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Entry Model</label>
                <input
                  type="text"
                  placeholder="15m FVG Retracement / 5m OB"
                  value={entryModel}
                  onChange={(e) => setEntryModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Reason for Entry</label>
              <textarea
                rows={3}
                placeholder="Explain setup context, liquidity sweep, and displacement confirmation..."
                value={reasonForEntry}
                onChange={(e) => setReasonForEntry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* TAB 3: ICT / SMC CONCEPTS */}
        {activeTab === "ict" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              ICT & Smart Money Concepts (SMC) Selection
            </h2>

            <div>
              <label className="text-xs font-semibold text-[#94A3B8] block mb-2">
                Select Confluence Elements (Multiple Allowed)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {ictOptions.map((item) => {
                  const isSelected = selectedIct.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleIct(item)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                        isSelected
                          ? "bg-[#2563EB]/20 border-[#2563EB] text-[#38BDF8]"
                          : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#38BDF8]" />}
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
              Trading Psychology Ratings & Emotional State
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
                  Confidence (1 to 5)
                </label>
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
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
                  Patience (1 to 5)
                </label>
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
                <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
                  Discipline (1 to 5)
                </label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1E293B]">
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
            </div>
          </div>
        )}

        {/* TAB 5: SCREENSHOTS */}
        {activeTab === "images" && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-[#38BDF8] border-b border-[#1E293B] pb-3">
              Trade Chart Screenshots Gallery
            </h2>

            {/* Add Image Link Form */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={newImgType}
                onChange={(e) => setNewImgType(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              >
                <option value="BEFORE_ENTRY">Before Entry</option>
                <option value="ENTRY">During Execution</option>
                <option value="AFTER_TRADE">After Exit</option>
              </select>

              <input
                type="text"
                placeholder="Enter image URL or paste Data URL..."
                value={newImgUrl}
                onChange={(e) => setNewImgUrl(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
              />

              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              >
                + Add Image
              </button>
            </div>

            {/* Uploaded Gallery Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {images.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-[#1E293B] bg-[#050B14]">
                  <img src={img.url} alt={img.type} className="w-full h-40 object-cover" />
                  <div className="p-2.5 flex items-center justify-between text-xs font-semibold text-white">
                    <span>{img.type.replace("_", " ")}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="p-1 rounded text-[#EF4444] hover:bg-[#EF4444]/20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
