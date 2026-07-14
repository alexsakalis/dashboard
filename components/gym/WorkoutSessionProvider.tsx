"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { updateSetRestSeconds } from "@/lib/actions/gym";
import { DEFAULT_REST_SECONDS } from "@/lib/gym/constants";
import { formatTimerClock } from "@/lib/gym/format";
import { useElapsedSeconds } from "@/components/gym/useElapsedSeconds";
import { PrCelebration } from "@/components/gym/PrCelebration";
import type { ExercisePersonalRecord } from "@/types/gym";
import type { DetectedPR } from "@/lib/gym/progress";

interface RestTimerTarget {
  setId: string;
  exerciseName: string;
  setNumber: number;
}

interface RestTimerState extends RestTimerTarget {
  totalSeconds: number;
  remainingSeconds: number;
}

interface StartRestTimerInput extends RestTimerTarget {
  durationSeconds?: number;
}

interface WorkoutSessionContextValue {
  elapsedSeconds: number;
  restTimer: RestTimerState | null;
  defaultRestSeconds: number;
  existingPRs: ExercisePersonalRecord[];
  startRestTimer: (input: StartRestTimerInput) => void;
  skipRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  celebratePr: (detected: DetectedPR[]) => void;
}

const WorkoutSessionContext = createContext<WorkoutSessionContextValue | null>(
  null,
);

export function useWorkoutSession() {
  const ctx = useContext(WorkoutSessionContext);
  if (!ctx) {
    throw new Error("useWorkoutSession must be used within WorkoutSessionProvider");
  }
  return ctx;
}

function playRestCompleteFeedback() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([120, 80, 120]);
  }
}

async function notifyRestComplete(exerciseName: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) {
      await registration.showNotification("Rest complete", {
        body: `Ready for your next set — ${exerciseName}`,
        tag: "gym-rest-timer",
      });
      return;
    }
  } catch {
    // Fall back to basic Notification API.
  }

  new Notification("Rest complete", {
    body: `Ready for your next set — ${exerciseName}`,
    tag: "gym-rest-timer",
  });
}

async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  try {
    await Notification.requestPermission();
  } catch {
    // Permission prompts can fail silently on unsupported platforms.
  }
}

interface WorkoutSessionProviderProps {
  workoutId: string;
  workoutName: string;
  startedAt: string;
  isActive: boolean;
  defaultRestSeconds?: number;
  existingPRs?: ExercisePersonalRecord[];
  children: ReactNode;
}

export function WorkoutSessionProvider({
  workoutId,
  workoutName,
  startedAt,
  isActive,
  defaultRestSeconds = DEFAULT_REST_SECONDS,
  existingPRs = [],
  children,
}: WorkoutSessionProviderProps) {
  const elapsedSeconds = useElapsedSeconds(isActive ? startedAt : null);
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [prCelebration, setPrCelebration] = useState<DetectedPR | null>(null);
  const restEndAtRef = useRef<number | null>(null);
  const restStartedAtRef = useRef<number | null>(null);
  const restTargetRef = useRef<(RestTimerTarget & { totalSeconds: number }) | null>(
    null,
  );
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const persistRestSeconds = useCallback(
    async (setId: string, restSeconds: number) => {
      try {
        await updateSetRestSeconds(setId, workoutId, restSeconds);
      } catch {
        // Rest logging is best-effort; don't interrupt the workout flow.
      }
    },
    [workoutId],
  );

  const finishRestTimer = useCallback(
    (completed: boolean) => {
      const endAt = restEndAtRef.current;
      const startedAtMs = restStartedAtRef.current;
      const current = restTargetRef.current;

      restEndAtRef.current = null;
      restStartedAtRef.current = null;
      restTargetRef.current = null;
      setRestTimer(null);

      if (!current || !startedAtMs) return;

      const elapsedRest = completed
        ? current.totalSeconds
        : Math.max(
            0,
            Math.round(
              (Math.min(Date.now(), endAt ?? Date.now()) - startedAtMs) / 1000,
            ),
          );

      void persistRestSeconds(current.setId, elapsedRest);

      if (completed) {
        playRestCompleteFeedback();
        void notifyRestComplete(current.exerciseName);
      }
    },
    [persistRestSeconds],
  );

  const startRestTimer = useCallback(
    ({ setId, exerciseName, setNumber, durationSeconds }: StartRestTimerInput) => {
      void requestNotificationPermission();

      const totalSeconds = durationSeconds ?? defaultRestSeconds;
      const now = Date.now();
      restStartedAtRef.current = now;
      restEndAtRef.current = now + totalSeconds * 1000;
      restTargetRef.current = { setId, exerciseName, setNumber, totalSeconds };

      setRestTimer({
        setId,
        exerciseName,
        setNumber,
        totalSeconds,
        remainingSeconds: totalSeconds,
      });
    },
    [defaultRestSeconds],
  );

  const skipRestTimer = useCallback(() => {
    finishRestTimer(false);
  }, [finishRestTimer]);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    if (!restEndAtRef.current) return;
    restEndAtRef.current += deltaSeconds * 1000;
    setRestTimer((prev) => {
      if (!prev || !restEndAtRef.current) return prev;
      const remaining = Math.max(
        0,
        Math.ceil((restEndAtRef.current - Date.now()) / 1000),
      );
      return {
        ...prev,
        totalSeconds: Math.max(prev.totalSeconds, remaining),
        remainingSeconds: remaining,
      };
    });
  }, []);

  const celebratePr = useCallback((detected: DetectedPR[]) => {
    if (detected.length === 0) return;
    setPrCelebration(detected[0]);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  useEffect(() => {
    if (!restEndAtRef.current) return;

    const tick = () => {
      const endAt = restEndAtRef.current;
      if (!endAt) return;

      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRestTimer((prev) =>
        prev ? { ...prev, remainingSeconds: remaining } : prev,
      );

      if (remaining <= 0) {
        finishRestTimer(true);
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [finishRestTimer, restTimer?.setId]);

  useEffect(() => {
    if (!isActive || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let cancelled = false;

    const acquireWakeLock = async () => {
      try {
        if (wakeLockRef.current) return;
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        wakeLockRef.current.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock may be unavailable when the tab is backgrounded.
      }
    };

    void acquireWakeLock();

    const handleVisibilityChange = () => {
      if (cancelled || document.visibilityState !== "visible" || !isActive) return;
      void acquireWakeLock();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void wakeLockRef.current?.release();
      wakeLockRef.current = null;
    };
  }, [isActive]);

  useEffect(() => {
    if (!isActive || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: workoutName,
      artist: `${formatTimerClock(elapsedSeconds)} elapsed`,
      album: "Workout in progress",
    });
    navigator.mediaSession.playbackState = "playing";
  }, [elapsedSeconds, isActive, workoutName]);

  useEffect(() => {
    if (isActive) return;
    restEndAtRef.current = null;
    restStartedAtRef.current = null;
    setRestTimer(null);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  }, [isActive]);

  return (
    <WorkoutSessionContext.Provider
      value={{
        elapsedSeconds,
        restTimer,
        defaultRestSeconds,
        existingPRs,
        startRestTimer,
        skipRestTimer,
        adjustRestTimer,
        celebratePr,
      }}
    >
      <PrCelebration pr={prCelebration} onDismiss={() => setPrCelebration(null)} />
      {children}
    </WorkoutSessionContext.Provider>
  );
}
