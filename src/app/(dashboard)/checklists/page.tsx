"use client";

import React, { useEffect, useState } from "react";
import { CheckSquare, ShieldAlert, Plus, Check, Trash2 } from "lucide-react";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("RISK");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, rRes] = await Promise.all([fetch("/api/checklists"), fetch("/api/rules")]);

      if (cRes.ok) {
        const cJson = await cRes.json();
        setChecklists(cJson.checklists || []);
      }
      if (rRes.ok) {
        const rJson = await rRes.json();
        setRules(rJson.rules || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCheckItem = async (itemId: string, currentStatus: boolean) => {
    try {
      await fetch("/api/checklists", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked: !currentStatus }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleText) return;
    try {
      await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newRuleText, category: newRuleCategory }),
      });
      setNewRuleText("");
      fetchData();
    } catch (err) {
      alert("Failed to add rule.");
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Pre-Market Checklists & Trading Rules</h1>
            <p className="text-xs text-[#94A3B8]">
              Maintain strict routine discipline and enforce core risk parameters
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pre-Market Checklist */}
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4" />
            Pre-Market Execution Checklist
          </h2>

          {checklists.map((cl) => (
            <div key={cl.id} className="space-y-2">
              <h3 className="text-xs font-bold text-white mb-2">{cl.title}</h3>
              <div className="space-y-2">
                {cl.items?.map((item: any) => (
                  <label
                    key={item.id}
                    onClick={() => toggleCheckItem(item.id, item.checked)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      item.checked
                        ? "bg-[#2563EB]/10 border-[#2563EB]/40 text-white"
                        : "bg-[#050B14] border-[#1E293B] text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                        item.checked
                          ? "bg-[#2563EB] border-[#2563EB] text-white"
                          : "border-[#64748B]"
                      }`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium ${item.checked ? "line-through text-[#94A3B8]" : ""}`}>
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Core Trading Rules */}
        <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
          <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Core Non-Negotiable Trading Rules
          </h2>

          {/* Add Rule Form */}
          <form onSubmit={addRule} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Risk max 1% per trade..."
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-[#2563EB] text-white"
            >
              Add Rule
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-[#050B14] border border-[#1E293B]"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                  <span className="text-xs font-medium text-white">{rule.text}</span>
                </div>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="p-1 rounded text-[#EF4444] hover:bg-[#EF4444]/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
