"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Invalid login credentials.");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid login credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 text-[#F8FAFC]">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0B1220] border border-[#1E293B] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.svg" alt="Axumify Logo" className="w-10 h-10" />
            <span className="text-2xl font-extrabold tracking-wider font-mono text-white">
              AXUMIFY
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] font-medium">
            Private Personal Trading Terminal Access
          </p>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-[11px] text-[#38BDF8] font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
          <span>Encrypted Single-Trader Access</span>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs font-semibold text-[#EF4444] text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
              Trader Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="trader@axumify.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white focus:border-[#38BDF8] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#94A3B8] block mb-1.5">
              Private Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050B14] border border-[#1E293B] text-xs font-mono text-white focus:border-[#38BDF8] outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white transition-all shadow-glow disabled:opacity-50 mt-2"
          >
            <span>{loading ? "Authenticating Terminal..." : "Enter Axumify Terminal"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#1E293B]">
          <span className="text-[11px] text-[#64748B]">
            AXUMIFY Personal Trading Terminal • Single-User Locked
          </span>
        </div>
      </div>
    </div>
  );
}
