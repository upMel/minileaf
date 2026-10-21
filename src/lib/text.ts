// Soft hyphens for long Greek words on narrow tiles. Browsers have no Greek
// hyphenation dictionary on most phones, so without these, words such as
// "Αρτοζαχαροπλαστείου" overflow the tile instead of breaking cleanly.

const SOFT = "­";

const BREAKS: Record<string, string> = {
  Γαλακτοκομικά: `Γαλακτο${SOFT}κομικά`,
  Αρτοποιήματα: `Αρτο${SOFT}ποιήματα`,
  Καθαριότητα: `Καθαρι${SOFT}ότητα`,
  Παντοπωλείο: `Παντο${SOFT}πωλείο`,
  Παντοπωλείου: `Παντο${SOFT}πωλείου`,
  Αρτοζαχαροπλαστείου: `Αρτο${SOFT}ζαχαρο${SOFT}πλαστείου`,
  Απορρυπαντικά: `Απορρυ${SOFT}παντικά`,
  Αναπληρώματα: `Αναπλη${SOFT}ρώματα`,
  Delicatessen: `Delica${SOFT}tessen`,
  Καθαρισμού: `Καθαρι${SOFT}σμού`,
  Προσωπικής: `Προσω${SOFT}πικής`,
  Κατοικίδια: `Κατοι${SOFT}κίδια`,
  Επιδόρπια: `Επι${SOFT}δόρπια`,
  Θαλασσινά: `Θαλασ${SOFT}σινά`,
  Σερβιέτες: `Σερβι${SOFT}έτες`,
};

/** Adds soft hyphens to the long words we know about; other text is unchanged. */
export function softHyphenate(text: string): string {
  return text.replace(/[^\s&,]+/g, (word) => BREAKS[word] ?? word);
}
