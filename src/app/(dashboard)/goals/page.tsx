"use client";

import React, { useEffect, useState } from "react";
import { Target, Plus, Trophy, Trash2, Edit } from "lucide-react";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState<number>(30);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [unit, setUnit] = useState("R");

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/goals", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setGoals(json.goals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = () => {
    setEditingGoalId(null);
    setTitle("");
    setTargetValue(30);
    setCurrentValue(0);
    setUnit("R");
    setShowModal(true);
  };

  const openEditModal = (g: any) => {
    setEditingGoalId(g.id);
    setTitle(g.title);
    setTargetValue(Number(g.targetValue));
    setCurrentValue(Number(g.currentValue));
    setUnit(g.unit);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGoalId) {
        const res = await fetch("/api/goals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingGoalId,
            title,
            targetValue: Number(targetValue),
            currentValue: Number(currentValue),
            unit,
          }),
        });
        if (res.ok) {
          setShowModal(false);
          fetchGoals();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to update goal.");
        }
      } else {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            targetValue: Number(targetValue),
            currentValue: Number(currentValue),
            unit,
          }),
        });

        if (res.ok) {
          setShowModal(false);
          fetchGoals();
        } else {
          const data = await res.json().catch(() => ({}));
          alert(data.error || "Failed to save goal.");
        }
      }
    } catch (err) {
      alert("An error occurred while saving goal.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      const res = await fetch(`/api/goals?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGoals();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete goal.");
      }
    } catch (err) {
      alert("An error occurred while deleting the goal.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Trading Goals & Milestones</h1>
            <p className="text-xs text-[#94A3B8]">
              Set custom target metrics for win rate, total R-multiples, and profit targets
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Target Goal</span>
        </button>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {goals.map((g) => {
          const targetNum = Number(g.targetValue) || 1;
          const currentNum = Number(g.currentValue) || 0;
          const percent = Math.min(100, Math.max(0, Number(((currentNum / targetNum) * 100).toFixed(1))));
          return (
            <div key={g.id} className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{g.title}</h3>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Target: {g.targetValue} {g.unit}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(g)}
                    title="Edit Goal"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    title="Delete Goal"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {percent >= 100 ? (
                    <span className="p-2 rounded-xl bg-[#22C55E]/10 text-[#22C55E]">
                      <Trophy className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="p-2 rounded-xl bg-[#2563EB]/10 text-[#38BDF8]">
                      <Target className="w-5 h-5" />
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#94A3B8]">Progress</span>
                  <span className="text-[#38BDF8]">
                    {g.currentValue} / {g.targetValue} {g.unit} ({percent}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#050B14] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#1E293B] pb-2">
              {editingGoalId ? "Edit Goal" : "Create New Goal"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] block mb-1">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Target</label>
                  <input
                    type="number"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Current</label>
                  <input
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-[#94A3B8] block mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
                    required
                  />
                </div>
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
                  {editingGoalId ? "Update Goal" : "Save Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
