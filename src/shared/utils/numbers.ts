/** Rounds to `decimals` places, avoiding floating-point artefacts like 1.0000000002. */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Parses user-typed numbers. Accepts a comma as decimal separator and Devanagari digits.
 * Returns `null` when the text is not a finite number.
 */
export function parseDecimal(text: string): number | null {
  const devanagari = '०१२३४५६७८९';
  const normalised = text
    .trim()
    .replace(/[०-९]/g, digit => String(devanagari.indexOf(digit)))
    .replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalised) && !/^-?\.\d+$/.test(normalised)) {
    return null;
  }
  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}
