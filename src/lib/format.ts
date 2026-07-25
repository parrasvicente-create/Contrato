// ─────────────────────────────────────────────────────────────────────────
// Formateo con convenciones chilenas: moneda CLP, UF, fechas y números.
// ─────────────────────────────────────────────────────────────────────────

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const NUM_CL = new Intl.NumberFormat("es-CL");

const UF = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto en pesos chilenos: 350000 → "$350.000". */
export function formatClp(amount: number): string {
  return CLP.format(amount);
}

/** Formatea un valor en UF: 25.5 → "25,50 UF". */
export function formatUf(amount: number): string {
  return `${UF.format(amount)} UF`;
}

/** Separador de miles chileno para números genéricos: 12345 → "12.345". */
export function formatNumber(value: number): string {
  return NUM_CL.format(value);
}

/**
 * Convierte a Date un valor de fecha proveniente del formulario.
 *
 * IMPORTANTE: los `<input type="date">` entregan "YYYY-MM-DD". `new Date()`
 * interpreta ese formato como UTC medianoche, de modo que al formatearlo en
 * el huso de Chile (UTC-4/-3) la fecha retrocede un día ("2026-08-01" se
 * mostraría como "31 de julio"). Por eso las fechas sin hora se construyen
 * explícitamente en hora local.
 */
export function parseDateInput(value: Date | string): Date {
  if (value instanceof Date) return value;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }
  return new Date(value);
}

/**
 * Formatea una fecha en formato chileno.
 * @param date Fecha o string ISO / "YYYY-MM-DD".
 * @param style "short" → "23-07-2026"; "long" → "23 de julio de 2026".
 */
export function formatDate(
  date: Date | string,
  style: "short" | "long" = "short",
): string {
  const d = parseDateInput(date);
  if (Number.isNaN(d.getTime())) return "";

  if (style === "long") {
    return new Intl.DateTimeFormat("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
