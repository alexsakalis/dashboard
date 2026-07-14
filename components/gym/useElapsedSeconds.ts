"use client";

import { useEffect, useState } from "react";

export function useElapsedSeconds(startedAt: string | null | undefined): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }

    const startMs = new Date(startedAt).getTime();
    if (!Number.isFinite(startMs)) return;

    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
