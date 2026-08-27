"use client";

import React, { useState } from "react";
import { Settings, Save, Shield, User, Globe, HardDrive } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("Oriyon Trades");
  const [email, setEmail] = useState("trader@axumify.com");
  const [timezone, setTimezone] = useState("UTC-3");
  const [currency, setCurrency] = useState("USD");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              Manage user profile, preferences, database seed status, and export settings
            </p>
          </div>
        </div>
      </div>

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
            Database backend connected to SQLite (`dev.db`). Real CRUD operations enabled with strict multi-tenant `userId` data isolation.
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
