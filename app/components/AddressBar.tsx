"use client";

import { ChevronDown, RefreshCw, Sparkles } from "lucide-react";
import CopyButton from "./CopyButton";

type AddressBarProps = {
  address: string | null;
  loading: boolean;
  onRandomize: () => void;
  onRefresh: () => void;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
};

export default function AddressBar({
  address,
  loading,
  onRandomize,
  onRefresh,
  advancedOpen,
  onToggleAdvanced,
}: AddressBarProps) {
  return (
    <section className="surface address-card">
      <div className="address-row">
        <div className="address-text-wrap">
          <span className="eyebrow">Your temporary inbox</span>
          <div className="address-text" title={address ?? undefined}>
            {address ?? (
              <span className="address-placeholder">generating address…</span>
            )}
          </div>
        </div>
        <div className="address-actions">
          {address ? <CopyButton text={address} label="Copy" /> : null}
          <button
            type="button"
            className="btn-ghost"
            onClick={onRefresh}
            disabled={!address || loading}
            aria-label="Refresh inbox"
            title="Refresh inbox"
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={onRandomize}
            disabled={loading}
          >
            <Sparkles size={14} />
            <span>Randomize</span>
          </button>
        </div>
      </div>
      <button
        type="button"
        className="advanced-toggle"
        onClick={onToggleAdvanced}
        aria-expanded={advancedOpen}
      >
        <ChevronDown
          size={14}
          className={`chev ${advancedOpen ? "open" : ""}`}
          aria-hidden
        />
        {advancedOpen ? "Hide advanced" : "Advanced options"}
      </button>
    </section>
  );
}
