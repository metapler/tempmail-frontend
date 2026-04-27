"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-all ${
        copied
          ? "bg-black text-white"
          : "bg-white/50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-100"
      }`}
      aria-label="Copy to clipboard"
      title="Copy to clipboard"
    >
      <div className="relative flex h-4 w-4 items-center justify-center">
        <Copy
          size={16}
          className={`absolute transition-all duration-300 ${
            copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <Check
          size={16}
          strokeWidth={3}
          className={`absolute transition-all duration-300 ${
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
        />
      </div>
    </button>
  );
}
