export type ListRow<T> = { kind: 'item'; item: T } | { kind: 'ad'; key: string };

/**
 * Inserts an ad row after every `interval` items. Never starts or ends the list with an ad,
 * so a short list has no ads and the last row is always content.
 */
export function interleaveAds<T>(items: readonly T[], interval: number): ListRow<T>[] {
  const rows: ListRow<T>[] = [];
  items.forEach((item, index) => {
    rows.push({ kind: 'item', item });
    const count = index + 1;
    if (interval > 0 && count % interval === 0 && count < items.length) {
      rows.push({ kind: 'ad', key: `ad-${count / interval}` });
    }
  });
  return rows;
}
