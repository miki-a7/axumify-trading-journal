"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart3,
  FlaskConical,
  CheckSquare,
  ShieldAlert,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  User,
  PlusCircle,
  FileSpreadsheet,
} from "lucide-react";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Journal", href: "/journal", icon: BookOpen },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Backtest", href: "/backtest", icon: FlaskConical },
    { name: "Checklists", href: "/checklists", icon: CheckSquare },
    { name: "Prop Tracker", href: "/prop-tracker", icon: ShieldAlert },
    { name: "Goals", href: "/goals", icon: Target },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0B1220] border-r border-[#1E293B] transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1E293B]">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-[#050B14] border border-[#1E293B] shadow-glow flex-shrink-0">
              <img
                src="/logo.png"
                alt="Axumify Logo"
                className="w-full h-full object-cover p-0.5"
              />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-wider text-white">AXUMIFY</span>
                <span className="text-[10px] font-semibold tracking-widest text-[#38BDF8] uppercase">
                  Terminal v2.5
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#101A2B] lg:block"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Add Action Button */}
        <div className="p-4">
          <Link
            href="/journal/add"
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold shadow-glow transition-all ${
              collapsed && !isMobileOpen ? "px-2" : ""
            }`}
          >
            <PlusCircle className="w-5 h-5 flex-shrink-0" />
            {(!collapsed || isMobileOpen) && <span>Log Trade</span>}
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-[#101A2B] text-[#38BDF8] border-l-4 border-[#2563EB] shadow-sm"
                    : "text-[#94A3B8] hover:text-white hover:bg-[#101A2B]/60"
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#38BDF8]" : "text-[#64748B]"}`} />
                {(!collapsed || isMobileOpen) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-[#1E293B] bg-[#050B14]/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#101A2B] border border-[#1E293B] text-[#38BDF8] font-bold text-xs tracking-wider">
              OT
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">Oriyon Trades</span>
                <span className="text-xs text-[#22C55E] flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  Pro Trader
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
