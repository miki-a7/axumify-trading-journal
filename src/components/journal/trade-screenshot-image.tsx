"use client";

import React, { useState } from "react";
import { ImageIcon } from "lucide-react";

interface TradeScreenshotImageProps {
  src?: string;
  url?: string;
  alt: string;
  className?: string;
}

export default function TradeScreenshotImage({ src, url, alt, className = "" }: TradeScreenshotImageProps) {
  const [failed, setFailed] = useState(false);
  const imageSource = src || url || "";

  if (!imageSource || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#050B14] text-[#64748B] ${className}`}
      >
        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-semibold">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageSource}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
