/** How a product's price is quoted. */
export type PriceUnit = "piece" | "kg";

export const DEFAULT_PRICE_UNIT: PriceUnit = "piece";

export function isPriceUnit(value: unknown): value is PriceUnit {
  return value === "piece" || value === "kg";
}

/** Normalizes anything coming back from the database to a valid unit. */
export function toPriceUnit(value: unknown): PriceUnit {
  return isPriceUnit(value) ? value : DEFAULT_PRICE_UNIT;
}

export function formatEUR(value: number): string {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Price with its unit suffix. Per-piece prices render bare — that's the default
 * and adding "/τεμ." everywhere just adds noise — while per-kilo prices always
 * carry the suffix, since that's the distinction shoppers need to see.
 */
export function formatPrice(value: number, unit: PriceUnit, kgSuffix: string): string {
  const amount = formatEUR(value);
  return unit === "kg" ? `${amount}/${kgSuffix}` : amount;
}
