// ─────────────────────────────────────────────────────────────────────────
// Categorías de contrato del MÓDULO DE REVISIÓN (según el spec).
//
// Estas 6 categorías son las del clasificador (Paso 1). Son independientes de
// los "tipos de contrato" de la base de conocimiento (que alimentan el módulo
// GENERADOR): aquí clasificamos cualquier contrato subido, no solo los que
// sabemos generar.
// ─────────────────────────────────────────────────────────────────────────

export const CONTRACT_CATEGORIES = [
  "arrendamiento",
  "prestacion_servicios",
  "nda",
  "compraventa",
  "laboral",
  "otro",
] as const;

export type ContractCategory = (typeof CONTRACT_CATEGORIES)[number];

/** Etiqueta legible + palabras clave (heurística de respaldo) por categoría. */
export const CATEGORY_INFO: Record<
  ContractCategory,
  { label: string; keywords: string[] }
> = {
  arrendamiento: {
    label: "Arrendamiento",
    keywords: [
      "arrendador",
      "arrendataria",
      "arrendatario",
      "arrendamiento",
      "renta mensual",
      "canon de arriendo",
      "restitución del inmueble",
      "subarrendar",
    ],
  },
  prestacion_servicios: {
    label: "Prestación de servicios",
    keywords: [
      "prestador",
      "prestación de servicios",
      "honorarios",
      "boleta de honorarios",
      "entregables",
      "sin vínculo de subordinación",
      "autonomía técnica",
    ],
  },
  nda: {
    label: "Acuerdo de confidencialidad (NDA)",
    keywords: [
      "confidencialidad",
      "información confidencial",
      "acuerdo de confidencialidad",
      "no divulgación",
      "non-disclosure",
      "secreto empresarial",
      "deber de reserva",
    ],
  },
  compraventa: {
    label: "Compraventa",
    keywords: [
      "compraventa",
      "vendedor",
      "comprador",
      "precio de venta",
      "transferencia de dominio",
      "tradición",
      "saneamiento de la evicción",
    ],
  },
  laboral: {
    label: "Contrato de trabajo",
    keywords: [
      "trabajador",
      "empleador",
      "remuneración",
      "jornada de trabajo",
      "subordinación y dependencia",
      "contrato de trabajo",
      "código del trabajo",
      "feriado legal",
    ],
  },
  otro: {
    label: "Otro / atípico",
    keywords: [],
  },
};

/** Precio de la revisión (CLP). Plano para todas las categorías por ahora. */
export const REVIEW_PRICE_CLP = 7990;

export function isContractCategory(value: string): value is ContractCategory {
  return (CONTRACT_CATEGORIES as readonly string[]).includes(value);
}

export function categoryLabel(category: string): string {
  return isContractCategory(category)
    ? CATEGORY_INFO[category].label
    : "Contrato";
}
