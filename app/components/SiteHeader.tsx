"use client";

import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import type { ConnectionStatus } from "../lib/useInbox";

type SiteHeaderProps = {
  connection: ConnectionStatus;
};

const labels: Record<ConnectionStatus, string> = {
  idle: "Idle",
  connecting: "Connecting",
  live: "Live",
  reconnecting: "Reconnecting",
  offline: "Offline",
};

export default function SiteHeader({ connection }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Mail size={14} strokeWidth={2.25} />
          </span>
          TempMail
        </Link>
        <div className="header-actions">
          <span
            className={`pill connection connection-${connection}`}
            aria-live="polite"
          >
            <span className="dot" aria-hidden />
            {labels[connection]}
          </span>
          <Link href="/domains/add" className="btn-ghost hidden-sm">
            <Plus size={14} />
            <span>Add custom domain</span>
          </Link>
          <Link
            href="/domains/add"
            className="btn-ghost only-sm"
            aria-label="Add custom domain"
          >
            <Plus size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
