// ─────────────────────────────────────────────────────────────────────────
// Utilidades para el RUT chileno (Rol Único Tributario).
//
// El RUT se compone de un número y un dígito verificador (DV) calculado con
// el algoritmo módulo 11. El DV puede ser 0-9 o "K".
// ─────────────────────────────────────────────────────────────────────────

/** Quita puntos, guiones y espacios, y deja el DV en mayúscula. */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

/**
 * Calcula el dígito verificador de un número de RUT (sin DV).
 * @param body Número del RUT como string de solo dígitos, p.ej. "12345678".
 * @returns El DV como "0".."9" o "K".
 */
export function computeDv(body: string): string {
  let sum = 0;
  let multiplier = 2;
  // Se recorre de derecha a izquierda multiplicando por la serie 2,3,4,5,6,7.
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return "0";
  if (remainder === 10) return "K";
  return String(remainder);
}

/**
 * Valida un RUT completo (número + DV), en cualquier formato de entrada.
 * Acepta "12.345.678-5", "12345678-5" o "123456785".
 */
export function isValidRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  // El cuerpo debe ser solo dígitos y el DV un dígito o K.
  if (!/^\d+$/.test(body)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;

  return computeDv(body) === dv;
}

/**
 * Formatea un RUT al estilo chileno con puntos y guion: "12.345.678-5".
 * Si el RUT no es válido en estructura, devuelve la entrada limpia sin formato.
 */
export function formatRut(rut: string): string {
  const clean = cleanRut(rut);
  if (clean.length < 2) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return clean;

  const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${withDots}-${dv}`;
}
