"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CopyButton from "./components/CopyButton";
import DomainSelector from "./components/DomainSelector";
import { Mail, ArrowRight, Shield, Zap, Lock, Settings } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPart, setCustomPart] = useState("");
  const [domain, setDomain] = useState("kanop.site");
  const [openAddress, setOpenAddress] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    generateInbox();
  }, []);

  async function generateInbox(selectedDomain?: string) {
    setLoading(true);
    const d = selectedDomain || domain;
    try {
      const res = await fetch("/api/v1/inboxes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d }),
      });
      const data = await res.json();
      if (data.address) setEmail(data.address);
    } finally {
      setLoading(false);
    }
  }

  async function createCustom() {
    if (!customPart.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/v1/inboxes/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localPart: customPart, domain }),
      });
      const data = await res.json();
      if (data.address) setEmail(data.address);
    } finally {
      setLoading(false);
    }
  }

  function openInbox() {
    if (!openAddress.includes("@")) return;
    router.push(`/inbox/${encodeURIComponent(openAddress)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center p-6 text-center">
      <div className="mb-12 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-xl ring-1 ring-gray-900/10">
          <Mail size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-light tracking-tight text-gray-900 sm:text-5xl">
          Ephemeral <span className="font-semibold">Email</span>
        </h1>
        <p className="max-w-xl text-lg text-gray-500">
          Protect your privacy with an elegant, disposable inbox.
        </p>
      </div>

      <div className="w-full max-w-xl animate-fade-in-up">
        <div className="glass-panel overflow-hidden rounded-3xl p-2 transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row p-6">
            <div className="flex w-full flex-col items-start gap-1">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Your temporary address
              </span>
              <div className="w-full truncate text-2xl font-medium text-gray-900 sm:text-3xl">
                {email || <span className="animate-pulse text-gray-300">generating...</span>}
              </div>
            </div>
            {email && (
              <div className="flex items-center gap-2">
                 <CopyButton text={email} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 border-t border-gray-100 bg-gray-50/50 p-4 sm:grid-cols-2">
             <button
              onClick={() => router.push(`/inbox/${encodeURIComponent(email || "")}`)}
              disabled={!email || loading}
              className="btn-primary group flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
            >
              Enter Inbox
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => generateInbox()}
              disabled={loading}
              className="btn-secondary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium"
            >
              <Zap size={16} />
              Randomize
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12 flex w-full max-w-xl flex-col gap-4">
        <button 
           onClick={() => setShowCustom(!showCustom)}
           className="flex items-center justify-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-800"
        >
          <Settings size={14} />
          {showCustom ? "Hide Advanced Options" : "Advanced Options"}
        </button>

        {showCustom && (
          <div className="glass-panel animate-fade-in grid grid-cols-1 gap-6 rounded-2xl p-6 text-left sm:grid-cols-2">
             <div className="space-y-3">
               <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Custom Name</label>
               <input
                 value={customPart}
                 onChange={(e) => setCustomPart(e.target.value)}
                 placeholder="username"
                 className="input-minimal w-full rounded-xl px-4 py-2.5 text-sm"
               />
               <DomainSelector value={domain} onChange={setDomain} />
               <button
                 onClick={createCustom}
                 disabled={loading}
                 className="btn-primary w-full rounded-xl py-2 text-sm font-medium"
               >
                 Create Custom
               </button>
             </div>
             <div className="space-y-3">
               <label className="text-xs font-medium uppercase tracking-wider text-gray-400">Open Existing</label>
               <input
                 value={openAddress}
                 onChange={(e) => setOpenAddress(e.target.value)}
                 placeholder="name@domain.com"
                 className="input-minimal w-full rounded-xl px-4 py-2.5 text-sm"
               />
               <button
                 onClick={openInbox}
                 disabled={!openAddress.includes("@")}
                 className="btn-secondary w-full rounded-xl py-2 text-sm font-medium"
               >
                 Open Inbox
               </button>
             </div>
          </div>
        )}
      </div>

      <div className="mt-24 grid max-w-4xl grid-cols-1 gap-8 border-t border-gray-100 pt-16 text-left sm:grid-cols-3">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
           <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
             <Shield size={20} />
           </div>
           <h3 className="mb-2 font-semibold">Privacy First</h3>
           <p className="text-sm text-gray-500">No logs, no trackers. Your emails are securely deleted after expiration.</p>
        </div>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
           <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
             <Zap size={20} />
           </div>
           <h3 className="mb-2 font-semibold">Lightning Fast</h3>
           <p className="text-sm text-gray-500">Emails appear instantly without needing to refresh the page.</p>
        </div>
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
           <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
             <Lock size={20} />
           </div>
           <h3 className="mb-2 font-semibold">Spam Protection</h3>
           <p className="text-sm text-gray-500">Keep your real inbox clean by using temporary addresses for signups.</p>
        </div>
      </div>
    </main>
  );
}
