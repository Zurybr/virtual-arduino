/**
 * localStorage key for persisting the recently-used component list.
 */
export const STORAGE_KEY = "palette-recently-used";

/**
 * Maximum number of recently-used items to track.
 */
const MAX_ITEMS = 5;

/**
 * Reads the recently-used component types from localStorage.
 * Returns an empty array if no data exists or if the data is corrupted.
 */
export function getRecentlyUsed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/**
 * Adds a component type to the recently-used list.
 * - If the type already exists, it's moved to the front (deduplication).
 * - The list is capped at MAX_ITEMS (oldest entries evicted).
 * - The result is persisted to localStorage.
 */
export function addRecentlyUsed(componentType: string): void {
  const current = getRecentlyUsed();

  // Remove the type if it already exists (will re-add at front)
  const filtered = current.filter((t) => t !== componentType);

  // Prepend and cap
  const updated = [componentType, ...filtered].slice(0, MAX_ITEMS);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Clears the recently-used list from localStorage.
 */
export function clearRecentlyUsed(): void {
  localStorage.removeItem(STORAGE_KEY);
}
