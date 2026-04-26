import { storage } from "../../engine/utils/storage";

/** Milestone threshold values */
export const MILESTONE_VALUES = [
  50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
  250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000,
  50_000_000, 100_000_000,
];

/** Milestone card titles */
export const MILESTONE_TITLES = [
  "ackboo vacances",
  "Breizh Ellen",
  "M. Chat Chat",
  "Denis balade",
  "Sebum de Rothschild",
  "Pokobé",
  "Ivan maison 4",
  "Farm Bio",
  "Burnout",
  "Flood de Slop",
  "Prompt Magique",
  "Python Spaghetti",
  "Crypto-Slop",
  "Modèle Gelé",
  "Stack Overflow",
  "Fork Infini",
  "Pumpkin Spice AI",
  "Roi du Slop",
  "To The Moon",
  "Singularité",
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
