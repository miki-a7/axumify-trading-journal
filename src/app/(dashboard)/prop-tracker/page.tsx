"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Plus, AlertTriangle, CheckCircle, RefreshCw, Trash2, Edit } from "lucide-react";

export default function PropTrackerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [firmName, setFirmName] = useState("");
  const [accountSize, setAccountSize] = useState<number>(100000);
  const [currentBalance, setCurrentBalance] = useState<number>(100000);
  const [profitTarget, setProfitTarget] = useState<number>(10000);
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(5000);
  const [maxTotalDrawdown, setMaxTotalDrawdown] = useState<number>(10000);
  const [status, setStatus] = useState("EVALUATION");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/prop-tracker", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.propAccounts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openCreateModal = () => {
    setEditingAccountId(null);
    setFirmName("FTMO $100K Challenge");
    setAccountSize(100000);
    setCurrentBalance(100000);
    setProfitTarget(10000);
    setMaxDailyLoss(5000);
    setMaxTotalDrawdown(10000);
    setStatus("EVALUATION");
    setShowModal(true);
  };

  const openEditModal = (acc: any) => {
    setEditingAccountId(acc.id);
    setFirmName(acc.firmName);
    setAccountSize(Number(acc.accountSize));
    setCurrentBalance(Number(acc.currentBalance));
    setProfitTarget(Number(acc.profitTarget));
    setMaxDailyLoss(Number(acc.maxDailyLoss));
    setMaxTotalDrawdown(Number(acc.maxTotalDrawdown));
    setStatus(acc.status || "EVALUATION");
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccountId) {
        const res = await fetch("/api/prop-tracker", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingAccountId,
            firmName,
            accountSize: Number(accountSize),
            currentBalance: Number(currentBalance),
            profitTarget: Number(profitTarget),
            maxDailyLoss: Number(maxDailyLoss),
            maxTotalDrawdown: Number(maxTotalDrawdown),
            status,
          }),
        });

        if (res.ok) {
          setShowModal(false);
          fetchAccounts();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to update prop account.");
        }
      } else {
        const res = await fetch("/api/prop-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firmName,
            accountSize: Number(accountSize),
            currentBalance: Number(currentBalance),
            profitTarget: Number(profitTarget),
            maxDailyLoss: Number(maxDailyLoss),
            maxTotalDrawdown: Number(maxTotalDrawdown),
            status,
          }),
        });

        if (res.ok) {
          setShowModal(false);
          fetchAccounts();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to save prop account.");
        }
      }
    } catch (err) {
      alert("An error occurred while saving prop account.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prop account?")) return;
    try {
      const res = await fetch(`/api/prop-tracker?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAccounts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete prop account.");
      }
    } catch (err) {
      alert("An error occurred while deleting prop account.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Prop Firm Account Tracker</h1>
            <p className="text-xs text-[#94A3B8]">
              Track evaluation challenges, drawdown thresholds & profit targets for FTMO, FundedNext, etc.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Prop Account</span>
        </button>
      </div>

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => {
          const starting = acc.startingBalance;
          const current = acc.currentBalance;
          const profit = current - starting;
          const target = acc.profitTarget;
          const progressPercent = Math.min(100, Math.max(0, Number(((profit / target) * 100).toFixed(1))));

          const drawdownLimit = acc.maxTotalDrawdown;
          const currentDrawdown = acc.currentDrawdown || 0;
          const drawdownRiskPercent = Number(((currentDrawdown / drawdownLimit) * 100).toFixed(1));
          const isHighRisk = drawdownRiskPercent >= 70;

          return (
            <div
              key={acc.id}
              className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white">{acc.firmName}</h2>
                  <span className="text-xs font-mono text-[#94A3B8]">
                    Size: ${starting.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(acc)}
                    title="Edit Prop Account"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    title="Delete Prop Account"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase ${
                      acc.status === "FUNDED"
                        ? "bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]"
                        : "bg-[#2563EB]/10 border border-[#2563EB]/30 text-[#38BDF8]"
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>
              </div>

              {/* Progress to Target */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#94A3B8]">Profit Target Progress</span>
                  <span className="text-[#22C55E]">
                    +${profit.toLocaleString()} / +${target.toLocaleString()} ({progressPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#050B14] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#22C55E] rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Drawdown Risk Warning Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#94A3B8]">Max Drawdown Used</span>
                  <span className={isHighRisk ? "text-[#EF4444] font-bold" : "text-[#94A3B8]"}>
                    ${currentDrawdown.toLocaleString()} / ${drawdownLimit.toLocaleString()} ({drawdownRiskPercent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#050B14] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHighRisk ? "bg-[#EF4444]" : "bg-[#38BDF8]"
                    }`}
                    style={{ width: `${drawdownRiskPercent}%` }}
                  />
                </div>
              </div>

              {isHighRisk && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>WARNING: Drawdown nearing 70% threshold limit! Reduce position size.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-2">
              {editingAccountId ? "Edit Prop Account" : "Add Prop Firm Account"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1">Prop Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Account Size ($)</label>
                  <input
                    type="number"
                    value={accountSize}
                    onChange={(e) => setAccountSize(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Current Balance ($)</label>
                  <input
                    type="number"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Profit Target ($)</label>
                  <input
                    type="number"
                    value={profitTarget}
                    onChange={(e) => setProfitTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Max Total Drawdown ($)</label>
                  <input
                    type="number"
                    value={maxTotalDrawdown}
                    onChange={(e) => setMaxTotalDrawdown(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                >
                  <option value="EVALUATION">Evaluation</option>
                  <option value="FUNDED">Funded</option>
                  <option value="PAUSED">Paused</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                >
                  {editingAccountId ? "Update Account" : "Save Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
