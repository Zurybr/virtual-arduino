/**
 * Fuzzy search/filter for palette components.
 * Matches if all characters in the query appear in order in the component name.
 * Case-insensitive. Returns only categories that have matching items.
 */

export interface PaletteItem {
  type: string;
  label: string;
  icon?: string;
}

export interface PaletteCategory {
  name: string;
  items: PaletteItem[];
}

/**
 * Checks if a string fuzzy-matches a query.
 * All characters in the query must appear in order in the target.
 */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++;
    }
  }

  return qi === q.length;
}

/**
 * Filters palette categories by a search query using fuzzy matching.
 * Returns only categories that have at least one matching item.
 * An empty query returns all categories unchanged.
 */
export function filterComponents(
  query: string,
  categories: PaletteCategory[],
): PaletteCategory[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return categories;
  }

  const result: PaletteCategory[] = [];

  for (const category of categories) {
    const matchingItems = category.items.filter((item) =>
      fuzzyMatch(trimmed, item.label),
    );

    if (matchingItems.length > 0) {
      result.push({
        name: category.name,
        items: matchingItems,
      });
    }
  }

  return result;
}
