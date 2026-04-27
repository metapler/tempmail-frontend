"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, RefreshCw } from "lucide-react";
import {
  ApiError,
  getCustomDomainStatus,
  verifyCustomDomain,
  type CustomDomainStatus,
} from "../../../lib/api";

const POLL_INTERVAL_MS = 15_000;

export default function CustomDomainStatusPage() {
  const { domain } = useParams<{ domain: string }>();
  const decoded = decodeURIComponent(domain);

  const [status, setStatus] = useState<CustomDomainStatus | null>(null);
  const [checks, setChecks] = useState<{ txt: boolean; mx: boolean } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const data = await getCustomDomainStatus(decoded);
      setStatus(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load status";
      setError(message);
    }
  }

  async function verify() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await verifyCustomDomain(decoded);
      if (data.status === "active") {
        setChecks({ txt: true, mx: true });
      } else {
        setChecks(data.checks);
      }
      await load();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Verification failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decoded]);

  // Poll while pending so the user sees status update without manual refresh.
  useEffect(() => {
    if (status?.status === "active") {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.status]);

  return (
    <div className="page-shell">
      <main className="page-main narrow">
        <Link href="/domains/add" className="back-link">
          <ArrowLeft size={14} />
          Back to add domain
        </Link>

        <header className="hero hero-tight">
          <h1 className="hero-title">{decoded}</h1>
          <p className="hero-sub">
            DNS verification status. We re-check every 15 seconds while
            pending.
          </p>
        </header>

        <section className="surface stack">
          {status ? (
            <div className="status-row">
              <span className={`pill status status-${status.status}`}>
                <span className="dot" aria-hidden />
                {status.status === "active" ? "Active" : "Pending verification"}
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={verify}
                disabled={busy}
              >
                <RefreshCw size={14} className={busy ? "spin" : ""} />
                {busy ? "Verifying…" : "Verify now"}
              </button>
            </div>
          ) : (
            <p className="muted">Loading status…</p>
          )}

          {checks ? (
            <ul className="check-list">
              <li className={checks.txt ? "ok" : "todo"}>
                {checks.txt ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                TXT record propagated
              </li>
              <li className={checks.mx ? "ok" : "todo"}>
                {checks.mx ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                MX record propagated
              </li>
            </ul>
          ) : null}

          {status?.lastCheckedAt ? (
            <p className="muted small">
              Last checked: {new Date(status.lastCheckedAt).toLocaleString()}
            </p>
          ) : null}

          {error ? <p className="alert subtle">{error}</p> : null}
        </section>

        {status?.status === "active" ? (
          <section className="surface stack success-card">
            <h2 className="section-heading">Domain is live</h2>
            <p className="muted">
              You can now generate inboxes on <code>{decoded}</code>.
            </p>
            <Link href="/" className="btn-primary self-start">
              Open inbox
            </Link>
          </section>
        ) : null}
      </main>
    </div>
  );
}
