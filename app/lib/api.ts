// Thin typed wrappers around the backend REST API documented in API-REFERENCE.md.
// All requests go through the Next.js rewrite at /api/* (see next.config.ts).

export type SystemDomain = { domain: string; type: "system" | "custom" };

export type InboxAddress = {
  address: string;
  url?: string;
  expiresAt?: string;
};

export type MessagePreview = {
  id: string;
  from: string;
  subject: string;
  receivedAt: string;
  hasHtml: boolean;
  hasText: boolean;
  attachmentCount: number;
};

export type MessageDetail = {
  id: string;
  from: string;
  to: string;
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  receivedAt: string;
};

export type CustomDomainCreate = {
  domain: string;
  status: "pending" | "active";
  records: {
    txt: { name: string; value: string };
    mx: { name: string; value: string };
  };
};

export type CustomDomainStatus = {
  domain: string;
  status: "pending" | "active";
  type: "custom";
  verificationToken: string;
  verificationTxtName: string;
  lastCheckedAt: string | null;
  verifiedAt: string | null;
};

export type CustomDomainVerifyResult =
  | { domain: string; status: "active" }
  | {
      domain: string;
      status: "pending";
      checks: { txt: boolean; mx: boolean };
    };

const BASE = "/api/v1";

class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers, body });
  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      // ignore
    }
    let message = `${res.status} ${res.statusText}`;
    if (
      parsed &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "string"
    ) {
      message = (parsed as { error: string }).error;
    }
    throw new ApiError(res.status, message, parsed);
  }
  return (await res.json()) as T;
}

export { ApiError };

export function listPublicDomains(): Promise<{ domains: SystemDomain[] }> {
  return request<{ domains: SystemDomain[] }>("/domains/public");
}

export function generateInbox(domain?: string): Promise<InboxAddress> {
  return request<InboxAddress>("/inboxes/generate", {
    method: "POST",
    json: domain ? { domain } : {},
  });
}

export function createCustomInbox(
  localPart: string,
  domain?: string
): Promise<InboxAddress> {
  return request<InboxAddress>("/inboxes/custom", {
    method: "POST",
    json: domain ? { localPart, domain } : { localPart },
  });
}

export function resolveInbox(
  address: string
): Promise<{ address: string; exists: boolean; createdAt?: string }> {
  return request(
    `/inboxes/resolve?address=${encodeURIComponent(address)}`
  );
}

export function listMessages(
  address: string
): Promise<{ messages: MessagePreview[] }> {
  return request(`/inboxes/${encodeURIComponent(address)}/messages`);
}

export function getMessage(id: string): Promise<MessageDetail> {
  return request(`/messages/${encodeURIComponent(id)}`);
}

export function registerCustomDomain(
  domain: string
): Promise<CustomDomainCreate> {
  return request("/domains/custom", {
    method: "POST",
    json: { domain },
  });
}

export function getCustomDomainStatus(
  domain: string
): Promise<CustomDomainStatus> {
  return request(`/domains/custom/${encodeURIComponent(domain)}/status`);
}

export function verifyCustomDomain(
  domain: string
): Promise<CustomDomainVerifyResult> {
  return request(`/domains/custom/${encodeURIComponent(domain)}/verify`, {
    method: "POST",
  });
}

export function eventsUrl(address: string): string {
  return `${BASE}/inboxes/${encodeURIComponent(address)}/events`;
}
