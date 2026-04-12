"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const VISITOR_KEY = "gc_visitor_id";
const SESSION_KEY = "gc_session_id";
const LAST_EVENT_KEY = "gc_last_page_view";

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing && existing.trim()) return existing;
    const created = randomId("v");
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return randomId("v");
  }
}

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing && existing.trim()) return existing;
    const created = randomId("s");
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId("s");
  }
}

function wasAlreadySent(key: string): boolean {
  try {
    const prev = sessionStorage.getItem(LAST_EVENT_KEY);
    if (prev === key) return true;
    sessionStorage.setItem(LAST_EVENT_KEY, key);
    return false;
  } catch {
    return false;
  }
}

export function PageAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    const qs = searchParams?.toString() || "";
    const path = qs ? `${pathname}?${qs}` : pathname;
    const dedupeKey = `page_view:${path}`;
    if (wasAlreadySent(dedupeKey)) return;

    const payload = {
      event: "page_view",
      path,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      title: typeof document !== "undefined" ? document.title || null : null,
      visitorId: getOrCreateVisitorId(),
      sessionId: getOrCreateSessionId(),
    };

    const body = JSON.stringify(payload);

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/events", blob);
        return;
      }
    } catch {
      // Fallback to fetch below.
    }

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
