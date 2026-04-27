"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddDomainPage() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/v1/domains/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Add Custom Domain</h1>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-2 text-sm font-semibold">DNS Records for {result.domain}</div>
          <div className="space-y-2 text-sm">
            <div className="rounded-md bg-gray-50 p-3">
              <div className="font-medium">TXT Record</div>
              <div>Name: {result.records.txt.name}</div>
              <div>Value: {result.records.txt.value}</div>
            </div>
            <div className="rounded-md bg-gray-50 p-3">
              <div className="font-medium">MX Record</div>
              <div>Name: {result.records.mx.name}</div>
              <div>Value: {result.records.mx.value}</div>
            </div>
          </div>
          <button
            onClick={() => router.push(`/domains/${encodeURIComponent(result.domain)}/status`)}
            className="mt-3 rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900"
          >
            Check Status
          </button>
        </div>
      )}
    </main>
  );
}
