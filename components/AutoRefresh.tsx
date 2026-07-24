"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** No websockets — just refetch server data on an interval. Good enough for a weekend. */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
