"use client";

import { useState, useRef } from "react";
import kavramlarData from "@/content/kavramlar.json";

// Type definition for kavramlar
type KavramlarDB = Record<string, { ad: string; kisa_ad?: string; aliases: string[] }>;
const db = kavramlarData as KavramlarDB;

type KavramTooltipProps = {
  kavramSlug: string; 
  children: React.ReactNode;
};

export default function KavramTooltip({ kavramSlug, children }: KavramTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const data = db[kavramSlug];

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 150); // delay before closing
  };

  return (
    <span 
      className="relative inline-flex items-center font-medium cursor-help hover:text-accent border-b border-dashed border-ink/30 hover:border-accent/60 transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {visible && data && (
        <span className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 rounded-md bg-ink p-3 text-left text-sm text-surface shadow-lg z-50 pointer-events-none font-sans">
          <span className="block font-serif font-bold text-yellow-300 mb-1">{data.ad}</span>
          <span className="block text-surface/90 leading-relaxed">
            {data.kisa_ad || "Bu kavram için henüz kısa bir açıklama girilmemiş."}
          </span>
          {/* Arrow */}
          <span className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-ink"></span>
        </span>
      )}
    </span>
  );
}
