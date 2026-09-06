"use client";

import React, { useEffect, useState } from "react";
import { Settings, Save, Shield, User, Globe, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC-3");
  const [currency, setCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);
  const [configuration, setConfiguration] = useState<any>({ systems: [], setups: [], concepts: [], entryModels: [], sessions: [], instruments: [], tags: [] });
  const [newConfig, setNewConfig] = useState({ type: "system", name: "", market: "CUSTOM" });

  const loadConfiguration = async () => {
    const response = await fetch("/api/configuration", { cache: "no-store" });
    if (response.ok) setConfiguration(await response.json());
  };

  useEffect(() => { loadConfiguration().catch(() => undefined); }, []);
  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" }).then((res) => res.ok ? res.json() : null).then((data) => {
      if (!data?.user) return;
      setName(data.user.name || "");
      setEmail(data.user.email || "");
      setTimezone(data.user.timezone || "UTC");
      setCurrency(data.user.currency || "USD");
    }).catch(() => undefined);
  }, []);

  const addConfiguration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newConfig.name.trim()) return;
    const response = await fetch("/api/configuration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newConfig),
    });
    if (response.ok) {
      setNewConfig((current) => ({ ...current, name: "" }));
      loadConfiguration();
    }
  };

  const deleteConfiguration = async (type: string, id: string) => {
    await fetch(`/api/configuration?type=${type}&id=${id}`, { method: "DELETE" });
    loadConfiguration();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, timezone, currency }) })
      .then(() => { setSaved(true); setTimeout(() => setSaved(false), 3000); })
      .catch(() => undefined);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B]">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-[#38BDF8]" />
          <div>
            <h1 className="text-2xl font-extrabold text-white">Terminal Settings</h1>
            <p className="text-xs text-[#94A3B8]">
              Manage your profile, preferences, and trading configuration
            </p>
          </div>
        </div>
      </div>

      <section className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider">My Trading Configuration</h2>
          <p className="text-xs text-[#94A3B8] mt-1">Create your own systems, concepts, entry models, sessions, instruments, and tags. Nothing is added automatically.</p>
        </div>
        <form onSubmit={addConfiguration} className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-2">
          <select value={newConfig.type} onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value })} className="px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white">
            <option value="system">Trading system</option>
            <option value="setup">Setup</option>
            <option value="concept">Concept</option>
            <option value="entryModel">Entry model</option>
            <option value="session">Session</option>
            <option value="instrument">Instrument</option>
            <option value="tag">Tag</option>
          </select>
          <input value={newConfig.name} onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })} placeholder="Name" className="px-3 py-2 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white" />
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold">Add</button>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(["systems", "setups", "concepts", "entryModels", "sessions", "instruments", "tags"] as const).map((key) => (
            <div key={key} className="p-3 rounded-xl bg-[#050B14] border border-[#1E293B]">
              <h3 className="text-xs font-bold text-white capitalize mb-2">{key === "entryModels" ? "Entry models" : key}</h3>
              {configuration[key].length === 0 ? <p className="text-[11px] text-[#64748B]">Empty</p> : configuration[key].map((item: any) => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-1 text-xs text-[#CBD5E1]">
                  <span>{item.name || item.symbol}</span>
                  <button type="button" onClick={() => deleteConfiguration(key === "systems" ? "system" : key === "entryModels" ? "entryModel" : key.slice(0, -1), item.id)} className="text-[#EF4444]">Remove</button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <button type="button" onClick={async () => { await fetch("/api/configuration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "starter-ict" }) }); loadConfiguration(); }} className="text-xs text-[#38BDF8] hover:underline">Add optional ICT starter system</button>
      </section>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-[#0B1220] border border-[#1E293B] space-y-6">
        <h2 className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider border-b border-[#1E293B] pb-3">
          Trader Profile & Regional Configuration
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Trader Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
            >
              <option value="UTC-5">UTC-5 (New York / EST)</option>
              <option value="UTC+0">UTC+0 (London / GMT)</option>
              <option value="UTC-3">UTC-3 (America / Sao Paulo)</option>
              <option value="UTC+8">UTC+8 (Asia / Singapore)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">Account Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs text-white"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>

        {/* Database Status Section */}
        <div className="p-4 rounded-xl bg-[#050B14] border border-[#1E293B] space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#22C55E]" />
            <h3 className="text-xs font-bold text-white">Prisma Database & Multi-Tenant Engine</h3>
          </div>
          <p className="text-[11px] text-[#94A3B8]">
            Database backend connected to Supabase PostgreSQL. Configuration and trading data are isolated by authenticated user.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#1E293B]">
          {saved ? (
            <span className="text-xs font-bold text-[#22C55E]">✓ Settings Saved Successfully</span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-glow"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
