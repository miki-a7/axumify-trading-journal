import React from "react";

export default function Footer() {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-[#1E293B] bg-[#050B14]/80 text-[#64748B] text-xs">
      <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-medium">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-[#94A3B8]">© 2026 AXUMIFY</span>
          <span className="text-[#38BDF8]/40">•</span>
          <span>Developed by <strong className="text-[#94A3B8]">ORAfx</strong></span>
        </div>
        <div className="text-[11px] text-[#64748B] tracking-wide">
          Private Trading Journal • For Personal Use
        </div>
      </div>
    </footer>
  );
}
