export type ListRow<T> = { type: 'item'; key: string; item: T } | { type: 'ad'; key: string };

/**
 * Inserts an ad row after every `interval` items, only between items (never at the very end
 * or start). `interval < 1` returns the items without ads.
 */
export function interleaveAds<T extends { id: string }>(
  items: readonly T[],
  interval: number,
): ListRow<T>[] {
  const rows: ListRow<T>[] = [];
  items.forEach((item, i) => {
    if (interval >= 1 && i > 0 && i % interval === 0) {
      rows.push({ type: 'ad', key: `ad-${i / interval}` });
    }
    rows.push({ type: 'item', key: item.id, item });
  });
  return rows;
}
