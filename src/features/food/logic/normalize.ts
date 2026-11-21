/** Latin combining diacritical marks (after NFKD): "ā" → "a" + U+0304. */
const LATIN_DIACRITICS = /[̀-ͯ]/g;
/** Devanagari nukta: "ज़" → "ज" (NFKD splits precomposed nukta letters first). */
const NUKTA = /़/g;
/** Chandrabindu is spelt as anusvara in everyday writing: "मूँग" ≈ "मूंग". */
const CHANDRABINDU = /ँ/g;
/**
 * Everything that is not part of a word: whitespace, ASCII and Latin-1 punctuation, general
 * punctuation (incl. ZWJ/ZWNJ and dashes) and the Devanagari danda. Explicit ranges instead of
 * `\p{...}` keep this safe on every JS engine.
 */
const NON_WORD = /[\s!-/:-@[-`{-¿ -⁯।॥]/g;

/**
 * Normalises food names, aliases and queries so variant spellings match:
 * lowercase, no Latin diacritics, no spaces/punctuation/hyphens, Devanagari nukta dropped,
 * chandrabindu treated as anusvara, ZWJ/ZWNJ ignored.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(LATIN_DIACRITICS, '')
    .replace(NUKTA, '')
    .replace(CHANDRABINDU, 'ं')
    .replace(NON_WORD, '');
}
