"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createCustomInbox,
  eventsUrl,
  generateInbox,
  getMessage,
  listMessages,
  resolveInbox,
  type MessageDetail,
} from "./api";

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline";

export type InboxStatus = "idle" | "loading" | "ready" | "error";

export type InboxState = {
  address: string | null;
  status: InboxStatus;
  connection: ConnectionStatus;
  messages: MessageDetail[];
  error: string | null;
};

type InboxControls = {
  state: InboxState;
  randomize: (domain?: string) => Promise<void>;
  createCustom: (localPart: string, domain?: string) => Promise<void>;
  openExisting: (address: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const RECONNECT_DELAY_MS = 2_000;

export function useInbox(): InboxControls {
  const [state, setState] = useState<InboxState>({
    address: null,
    status: "idle",
    connection: "idle",
    messages: [],
    error: null,
  });

  // Refs hold mutable state for the imperative SSE / fetch logic so we
  // don't recreate the EventSource on every render.
  const addressRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const inflightFetchesRef = useRef<Set<string>>(new Set());

  const teardown = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    knownIdsRef.current = new Set();
    inflightFetchesRef.current = new Set();
  }, []);

  // Loads any messages we don't yet have a body for and merges them into state.
  // Sorted ascending by receivedAt so the latest message is at the bottom.
  const fetchAndMergeMessages = useCallback(async (address: string) => {
    let previews: { id: string; receivedAt: string }[] = [];
    try {
      const data = await listMessages(address);
      previews = data.messages;
    } catch (err) {
      // Network / 404 — just bail; the SSE retry will recover.
      if (err instanceof ApiError && err.status === 404) {
        return;
      }
      return;
    }

    const newIds = previews
      .map((m) => m.id)
      .filter(
        (id) => !knownIdsRef.current.has(id) && !inflightFetchesRef.current.has(id)
      );
    if (newIds.length === 0) return;

    newIds.forEach((id) => inflightFetchesRef.current.add(id));
    const fetched = await Promise.all(
      newIds.map(async (id) => {
        try {
          return await getMessage(id);
        } catch {
          return null;
        } finally {
          inflightFetchesRef.current.delete(id);
        }
      })
    );

    const fresh = fetched.filter((m): m is MessageDetail => m !== null);
    // Race guard: if the address changed mid-flight, drop the stale results.
    if (addressRef.current !== address) return;

    fresh.forEach((m) => knownIdsRef.current.add(m.id));

    setState((prev) => {
      if (prev.address !== address) return prev;
      const combined = [...prev.messages];
      const existing = new Set(combined.map((m) => m.id));
      fresh.forEach((m) => {
        if (!existing.has(m.id)) combined.push(m);
      });
      combined.sort(
        (a, b) =>
          new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
      );
      return { ...prev, messages: combined };
    });
  }, []);

  const connect = useCallback(
    (address: string) => {
      // Tear down any prior connection but keep messages — we reset those when
      // the *address* changes, not on a reconnect.
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      setState((prev) =>
        prev.address === address
          ? { ...prev, connection: "connecting" }
          : prev
      );

      const es = new EventSource(eventsUrl(address));
      eventSourceRef.current = es;

      es.addEventListener("open", () => {
        if (addressRef.current !== address) return;
        setState((prev) =>
          prev.address === address ? { ...prev, connection: "live" } : prev
        );
      });

      es.addEventListener("message.created", () => {
        if (addressRef.current !== address) return;
        void fetchAndMergeMessages(address);
      });

      es.addEventListener("error", () => {
        if (addressRef.current !== address) return;
        // Browser EventSource auto-reconnects; surface "reconnecting" so the
        // UI pill reflects reality.
        setState((prev) =>
          prev.address === address ? { ...prev, connection: "reconnecting" } : prev
        );
        // If the connection is fully closed (e.g. server gone), schedule a
        // manual retry.
        if (es.readyState === EventSource.CLOSED) {
          reconnectTimerRef.current = setTimeout(() => {
            if (addressRef.current === address) connect(address);
          }, RECONNECT_DELAY_MS);
        }
      });
    },
    [fetchAndMergeMessages]
  );

  const switchAddress = useCallback(
    async (newAddress: string) => {
      teardown();
      addressRef.current = newAddress;
      setState({
        address: newAddress,
        status: "loading",
        connection: "connecting",
        messages: [],
        error: null,
      });
      try {
        await fetchAndMergeMessages(newAddress);
        if (addressRef.current !== newAddress) return;
        setState((prev) =>
          prev.address === newAddress ? { ...prev, status: "ready" } : prev
        );
        connect(newAddress);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load inbox";
        if (addressRef.current !== newAddress) return;
        setState((prev) =>
          prev.address === newAddress
            ? { ...prev, status: "error", connection: "offline", error: message }
            : prev
        );
      }
    },
    [connect, fetchAndMergeMessages, teardown]
  );

  const randomize = useCallback(
    async (domain?: string) => {
      teardown();
      addressRef.current = null;
      setState({
        address: null,
        status: "loading",
        connection: "idle",
        messages: [],
        error: null,
      });
      try {
        const inbox = await generateInbox(domain);
        await switchAddress(inbox.address);
      } catch (err) {
        setState({
          address: null,
          status: "error",
          connection: "offline",
          messages: [],
          error: err instanceof Error ? err.message : "Failed to generate inbox",
        });
      }
    },
    [switchAddress, teardown]
  );

  const createCustom = useCallback(
    async (localPart: string, domain?: string) => {
      teardown();
      addressRef.current = null;
      setState({
        address: null,
        status: "loading",
        connection: "idle",
        messages: [],
        error: null,
      });
      try {
        const inbox = await createCustomInbox(localPart, domain);
        await switchAddress(inbox.address);
      } catch (err) {
        setState({
          address: null,
          status: "error",
          connection: "offline",
          messages: [],
          error: err instanceof Error ? err.message : "Failed to create inbox",
        });
      }
    },
    [switchAddress, teardown]
  );

  const openExisting = useCallback(
    async (address: string) => {
      teardown();
      addressRef.current = null;
      setState({
        address: null,
        status: "loading",
        connection: "idle",
        messages: [],
        error: null,
      });
      try {
        const resolved = await resolveInbox(address);
        await switchAddress(resolved.address);
      } catch (err) {
        const message =
          err instanceof ApiError && err.status === 404
            ? "Inbox not found or domain inactive"
            : err instanceof Error
              ? err.message
              : "Failed to open inbox";
        setState({
          address: null,
          status: "error",
          connection: "offline",
          messages: [],
          error: message,
        });
      }
    },
    [switchAddress, teardown]
  );

  const refresh = useCallback(async () => {
    const addr = addressRef.current;
    if (!addr) return;
    await fetchAndMergeMessages(addr);
  }, [fetchAndMergeMessages]);

  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  return { state, randomize, createCustom, openExisting, refresh };
}
