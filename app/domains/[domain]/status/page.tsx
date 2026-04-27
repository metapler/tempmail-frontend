"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DomainStatusPage() {
  const { domain } = useParams<{ domain: string }>();
  const decoded = decodeURIComponent(domain);
  const [status, setStatus] = useState<any | null>(null);

  async function fetchStatus() {
    const res = await fetch(`/api/v1/domains/custom/${encodeURIComponent(decoded)}/status`);
    if (res.ok) {
      setStatus(await res.json());
    }
  }

  async function verify() {
    const res = await fetch(`/api/v1/domains/custom/${encodeURIComponent(decoded)}/verify`, {
      method: "POST",
    });
    if (res.ok) {
      setStatus(await res.json());
    }
  }

  useEffect(() => {
    fetchStatus();
  }, [decoded]);

  if (!status) return <div className="p-6 text-sm">Loading...</div>;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Domain: {decoded}</h1>
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-2 text-sm">Status: <span className="font-semibold">{status.status}</span></div>
        {status.lastCheckedAt && (
          <div className="text-xs text-gray-500">Last checked: {new Date(status.lastCheckedAt).toLocaleString()}</div>
        )}
        <button
          onClick={verify}
          className="mt-3 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Verify Now
        </button>
      </div>
    </main>
  );
}
