"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Globe, ShieldCheck } from "lucide-react";
import CopyButton from "../../components/CopyButton";
import {
  ApiError,
  registerCustomDomain,
  type CustomDomainCreate,
} from "../../lib/api";

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?:\.[a-z0-9-]{1,63})+$/i;

export default function AddCustomDomainPage() {
  const [domain, setDomain] = useState("");
  const [result, setResult] = useState<CustomDomainCreate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const valid = DOMAIN_RE.test(domain.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const data = await registerCustomDomain(domain.trim().toLowerCase());
      setResult(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to register domain";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell">
      <main className="page-main narrow">
        <Link href="/" className="back-link">
          <ArrowLeft size={14} />
          Back to inbox
        </Link>

        <header className="hero hero-tight">
          <span className="hero-icon" aria-hidden>
            <Globe size={20} />
          </span>
          <h1 className="hero-title">Add a custom domain</h1>
          <p className="hero-sub">
            Use your own domain to send and receive throwaway mail. We&apos;ll
            generate the DNS records you need to add at your registrar.
          </p>
        </header>

        <section className="surface stack">
          <form onSubmit={submit} className="domain-form">
            <label className="section-label" htmlFor="domain-input">
              Domain
            </label>
            <div className="field-row">
              <input
                id="domain-input"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="field flex-1"
                spellCheck={false}
                autoComplete="off"
                disabled={!!result}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!valid || submitting || !!result}
              >
                {submitting ? "Registering…" : "Register"}
                <ArrowRight size={14} />
              </button>
            </div>
            {error ? <p className="alert subtle">{error}</p> : null}
          </form>
        </section>

        {result ? (
          <section className="surface stack">
            <div className="success-banner">
              <ShieldCheck size={16} />
              <div>
                <strong>Domain registered.</strong> Add these DNS records at
                your registrar to activate <code>{result.domain}</code>.
              </div>
            </div>

            <DnsRecord
              type="TXT"
              name={result.records.txt.name}
              value={result.records.txt.value}
              hint="Proves you own the domain."
            />
            <DnsRecord
              type="MX"
              name={result.records.mx.name}
              value={result.records.mx.value}
              hint="Routes incoming email to TempMail."
            />

            <div className="row-end">
              <Link
                href={`/domains/${encodeURIComponent(result.domain)}/status`}
                className="btn-primary"
              >
                Check verification status
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function DnsRecord({
  type,
  name,
  value,
  hint,
}: {
  type: string;
  name: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="dns-record">
      <div className="dns-record-head">
        <span className="badge strong">{type}</span>
        <span className="dns-hint">{hint}</span>
      </div>
      <dl className="dns-grid">
        <div>
          <dt>Name</dt>
          <dd>
            <code>{name}</code>
            <CopyButton text={name} size="sm" />
          </dd>
        </div>
        <div>
          <dt>Value</dt>
          <dd>
            <code>{value}</code>
            <CopyButton text={value} size="sm" />
          </dd>
        </div>
      </dl>
    </div>
  );
}
