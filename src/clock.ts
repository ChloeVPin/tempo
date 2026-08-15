export interface Clock {
  now(): number;
}

export const systemClock: Clock = {
  now: () => Date.now(),
};

let currentClock: Clock = systemClock;

export function getClock(): Clock {
  return currentClock;
}

export function nowMs(): number {
  return currentClock.now();
}

export function useClock(clock: Clock): () => void {
  const previous = currentClock;
  currentClock = clock;
  return () => {
    currentClock = previous;
  };
}

export function resetClock(): void {
  currentClock = systemClock;
}

export function useFixedClock(epochMs: number): () => void {
  return useClock({ now: () => epochMs });
}
