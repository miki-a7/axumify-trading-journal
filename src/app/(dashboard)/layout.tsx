"use client";

import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#050B14] text-[#F8FAFC]">
      {/* Sidebar Component */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:pl-64 transition-all duration-300 min-h-screen">
        <Header onMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto space-y-8">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
