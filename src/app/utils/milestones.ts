import { storage } from "../../engine/utils/storage";

/** Milestone threshold values */
export const MILESTONE_VALUES = [
  50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
  250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000,
  50_000_000, 100_000_000,
];

/** Milestone card titles */
export const MILESTONE_TITLES = [
  "ackboo en vacances",
  "Breizh Ellen",
  "M. Chat chat",
  "Denis en balade",
  "Sebum de Rothschild",
  "Pokobé",
  "Ivan 4ème maison",
  "Percopoly",
  "Noddange",
  "Soupape Fraisois",
  "Café in café",
  "Chamentation",
  "Winter afternoon",
  "Jumpscare",
  "Vélo cargo",
  "Kocobé Miku",
  "Perco RoadZero",
  "Fruiter Shooter",
  "Bromance 1",
  "Bromance 2",
];

const STORAGE_KEY = "slopclicker-milestones";

/** Get the set of unlocked milestone indices from storage */
export function getUnlockedMilestones(): Set<number> {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const arr: number[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/** Save an unlocked milestone index to storage */
export function unlockMilestone(index: number): void {
  const set = getUnlockedMilestones();
  set.add(index);
  storage.setString(STORAGE_KEY, JSON.stringify([...set]));
}

/** Format a number for display */
export function formatMilestoneValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
