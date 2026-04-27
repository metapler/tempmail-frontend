"use client";

import { useEffect, useState } from "react";

export default function DomainSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (domain: string) => void;
}) {
  const [domains, setDomains] = useState<{ domain: string; type: string }[]>([]);

  useEffect(() => {
    fetch("/api/v1/domains/public")
      .then((r) => r.json())
      .then((data) => setDomains(data.domains ?? []))
      .catch(() => setDomains([]));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-minimal rounded-xl px-4 py-2.5 text-sm w-full appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20fill%3D%22%23000%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_12px_center]"
    >
      {domains.map((d) => (
        <option key={d.domain} value={d.domain}>
          {d.domain}
        </option>
      ))}
    </select>
  );
}
