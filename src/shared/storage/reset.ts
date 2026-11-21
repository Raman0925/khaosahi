/**
 * In-memory stores register a reset function here so "Delete all data" can return every store to
 * its defaults after the storage itself has been wiped. Register once, at module load.
 */
const resetHandlers = new Set<() => void>();

export function registerStoreReset(reset: () => void): void {
  resetHandlers.add(reset);
}

export function resetAllStores(): void {
  resetHandlers.forEach(reset => {
    try {
      reset();
    } catch (error) {
      console.warn('[storage] store reset failed', error);
    }
  });
}
