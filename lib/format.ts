// Explicit locale so kroner amounts render the same whether computed in a
// server component (Node's OS locale) or a client component (browser locale)
// — those two default locales can disagree on thousands separators.
export function formatKr(amount: number): string {
  return amount.toLocaleString("da-DK");
}
