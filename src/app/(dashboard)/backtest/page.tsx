"use client";

import React, { useEffect, useState } from "react";
import { FlaskConical, Plus, RefreshCw, CheckCircle, XCircle, MinusCircle } from "lucide-react";

export default function BacktestPage() {
  const [backtests, setBacktests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [instrument, setInstrument] = useState("EURUSD");
  const [session, setSession] = useState("New York");
  const [setup, setSetup] = useState("ICT FVG Retracement");
  const [direction, setDirection] = useState("LONG");
  const [entryPrice, setEntryPrice] = useState(1.0850);
  const [stopLoss, setStopLoss] = useState(1.0835);
  const [takeProfit, setTakeProfit] = useState(1.0895);
  const [result, setResult] = useState("WIN");
  const [notes, setNotes] = useState("");

  const fetchBacktests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/backtest");
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

  useEffect(() => {
    fetchBacktests();
  }, []);

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
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
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
          onClick={() => setShowAddModal(true)}
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
              <th className="py-3.5 px-4">Instrument</th>
              <th className="py-3.5 px-4">Session</th>
              <th className="py-3.5 px-4">Setup</th>
              <th className="py-3.5 px-4 text-right">Entry / SL / TP</th>
              <th className="py-3.5 px-4 text-center">Result</th>
              <th className="py-3.5 px-4 text-right">R-Multiple</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {backtests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">
                  No backtest trades recorded yet. Click "+ Log Backtest Trade" to start.
                </td>
              </tr>
            ) : (
              backtests.map((b) => (
                <tr key={b.id} className="hover:bg-[#101A2B]/60">
                  <td className="py-3 px-4 font-mono text-white">
                    {new Date(b.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white">{b.instrument}</td>
                  <td className="py-3 px-4 text-[#94A3B8]">{b.session}</td>
                  <td className="py-3 px-4 text-[#38BDF8]">{b.setup || "—"}</td>
                  <td className="py-3 px-4 text-right font-mono text-[#94A3B8]">
                    {b.entryPrice} / {b.stopLoss} / {b.takeProfit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        b.result === "WIN"
                          ? "bg-[#22C55E]/10 text-[#22C55E]"
                          : "bg-[#EF4444]/10 text-[#EF4444]"
                      }`}
                    >
                      {b.result}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-bold ${
                      b.rMultiple >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"
                    }`}
                  >
                    {b.rMultiple >= 0 ? `+${b.rMultiple}R` : `${b.rMultiple}R`}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-2">
              Log Backtest Trade
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1">Instrument</label>
                <input
                  type="text"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Session</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  >
                    <option value="Asian">Asian</option>
                    <option value="London">London</option>
                    <option value="New York">New York</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Direction</label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  >
                    <option value="LONG">Long</option>
                    <option value="SHORT">Short</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Entry</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Take Profit</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] block mb-1">Outcome Result</label>
                <select
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                >
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAKEVEN">BREAKEVEN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
