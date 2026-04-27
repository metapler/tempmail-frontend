"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CopyButton from "../../components/CopyButton";
import MessageViewer from "../../components/MessageViewer";
import { ArrowLeft, RefreshCw, MailX, Inbox, Clock } from "lucide-react";

export default function InboxPage() {
  const { address } = useParams<{ address: string }>();
  const router = useRouter();
  const decodedAddress = decodeURIComponent(address);

  const [resolved, setResolved] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function resolveInbox() {
    const res = await fetch(`/api/v1/inboxes/resolve?address=${encodeURIComponent(decodedAddress)}`);
    if (res.ok) {
      setResolved(true);
      fetchMessages();
      startSSE();
    } else {
      setError("Inbox not found or domain inactive");
    }
  }

  async function fetchMessages() {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/v1/inboxes/${encodeURIComponent(decodedAddress)}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  function startSSE() {
    const evtSource = new EventSource(
      `/api/v1/inboxes/${encodeURIComponent(decodedAddress)}/events`
    );
    evtSource.addEventListener("message.created", () => {
      fetchMessages();
    });
    return () => evtSource.close();
  }

  useEffect(() => {
    resolveInbox();
  }, [decodedAddress]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6 min-h-screen">
      <div className="flex w-full animate-fade-in-up items-center justify-between border-b border-gray-100 pb-6 pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-100 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              {decodedAddress}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Clock size={12}/> Auto-refreshes</span>
              <span>•</span>
              <button 
                 onClick={fetchMessages} 
                 className={`flex items-center gap-1 hover:text-gray-900 transition-colors ${isRefreshing ? "opacity-50 pointer-events-none" : ""}`}
              >
                 <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} /> Refresh Now
              </button>
            </div>
          </div>
        </div>
        <div className="hidden sm:block">
           <CopyButton text={decodedAddress} />
        </div>
      </div>

      {error && (
        <div className="animate-fade-in rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          {error}
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row gap-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="glass-panel flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-3xl md:w-1/3 shadow-sm bg-white/50">
          <div className="border-b border-gray-100 bg-white/50 px-5 py-4 text-sm font-semibold text-gray-800 sticky top-0 backdrop-blur-md z-10 flex justify-between items-center">
            Inbox
            <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">{messages.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-gray-400">
                <Inbox size={48} strokeWidth={1} className="mb-4 text-gray-300" />
                <p className="text-sm font-medium text-gray-600">Waiting for emails...</p>
                <p className="mt-1 text-xs text-gray-400">This inbox will automatically update.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100/60">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className={`cursor-pointer border-l-2 px-5 py-4 transition-all hover:bg-gray-50/80 ${
                      selected?.id === m.id 
                        ? "border-black bg-gray-50/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]" 
                        : "border-transparent bg-white/40"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <div className="truncate text-xs font-semibold text-gray-900 pr-2">
                         {m.from || "Unknown Sender"}
                      </div>
                      <div className="whitespace-nowrap text-[11px] font-medium text-gray-400">
                        {new Date(m.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className={`truncate text-sm ${selected?.id === m.id ? "font-medium text-gray-900" : "font-normal text-gray-600"}`}>
                      {m.subject || "(No subject)"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="glass-panel flex h-[calc(100vh-140px)] w-full flex-col overflow-hidden rounded-3xl md:w-2/3 shadow-sm bg-white/80">
           {selected ? (
              <MessageViewer messageId={selected.id} onClose={() => setSelected(null)} />
           ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                  <MailX size={32} strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-gray-500">No message selected</p>
                <p className="mt-1 text-xs">Select an email from the list to view its contents</p>
              </div>
           )}
        </div>
      </div>
    </main>
  );
}
