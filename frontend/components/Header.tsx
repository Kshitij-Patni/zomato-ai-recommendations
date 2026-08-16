"use client";

import { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="h-20 w-full px-6 flex items-center justify-between max-w-7xl mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#e23744] flex items-center justify-center text-xl shadow-md">
            🍽️
          </div>
          <div className="flex flex-col">
            <span className="font-[Lexend] text-[#1C1C1C] font-semibold text-lg tracking-tight">
              Zomato AI
            </span>
            <span className="text-[10px] tracking-[0.15em] text-[#828282] uppercase font-semibold">
              Smart Recommendations
            </span>
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white py-1.5 px-3 rounded-full border border-[#E8E8E8] shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[12px] font-semibold tracking-[0.05em] text-[#828282]">
              Powered by Groq
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
