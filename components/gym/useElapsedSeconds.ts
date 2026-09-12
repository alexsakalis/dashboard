"use client";

import { useEffect, useState } from "react";

function getElapsedSeconds(startedAt: string | null | undefined): number {
  if (!startedAt) return 0;
  const startMs = new Date(startedAt).getTime();
  if (!Number.isFinite(startMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
}

export function useElapsedSeconds(startedAt: string | null | undefined): number {
  const [elapsed, setElapsed] = useState(() => getElapsedSeconds(startedAt));

  useEffect(() => {
    if (!startedAt) {
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

  return startedAt ? elapsed : 0;
}
