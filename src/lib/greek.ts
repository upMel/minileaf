/**
 * Case- and accent-insensitive Greek text key.
 *
 * Mirrors `public.greek_fold()` in supabase/add_kaimakidis_refactor.sql, which
 * fills `products.search_key`. Fold the shopper's query with this, then match
 * it against `search_key` — "γιαουρτι", "Γιαούρτι" and "ΓΙΑΟΥΡΤΙ" all hit.
 */
const ACCENTED = "άέήίόύώϊϋΐΰς";
const PLAIN = "αεηιουωιυιυσ";

const FOLD_MAP: Record<string, string> = Object.fromEntries(
  [...ACCENTED].map((ch, i) => [ch, PLAIN[i]]),
);

export function foldGreek(text: string | null | undefined): string {
  const lower = (text ?? "").normalize("NFC").toLowerCase().trim();
  let out = "";
  for (const ch of lower) out += FOLD_MAP[ch] ?? ch;
  return out;
}

/** Folded, non-empty words of a search query. Every word must match. */
export function searchTerms(query: string): string[] {
  return foldGreek(query).split(/\s+/).filter(Boolean);
}

/** Escapes `%`, `_` and `\` so user input is matched literally inside an ILIKE pattern. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}
