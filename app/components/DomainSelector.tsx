"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { listPublicDomains, type SystemDomain } from "../lib/api";

type DomainSelectorProps = {
  value: string;
  onChange: (domain: string) => void;
  className?: string;
};

export default function DomainSelector({
  value,
  onChange,
  className = "",
}: DomainSelectorProps) {
  const [domains, setDomains] = useState<SystemDomain[]>([]);

  useEffect(() => {
    let cancelled = false;
    listPublicDomains()
      .then((data) => {
        if (!cancelled) setDomains(data.domains);
      })
      .catch(() => {
        // Leave the list empty; the parent's default value still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`field-wrap ${className}`}>
      <select
        className="field appearance-none pr-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {domains.length === 0 ? <option value={value}>{value}</option> : null}
        {domains.map((d) => (
          <option key={d.domain} value={d.domain}>
            {d.domain}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]"
      />
    </div>
  );
}
