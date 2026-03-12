"use client";

import { useEffect, useRef } from "react";

export function CheckoutSuccessFinalize({ refParam }: { refParam: string | undefined }) {
  const called = useRef(false);

  useEffect(() => {
    if (!refParam || called.current) return;
    called.current = true;

    fetch(`/api/onboarding/finalize?ref=${encodeURIComponent(refParam)}`, {
      method: "POST",
    }).catch(() => {});
  }, [refParam]);

  return null;
}
