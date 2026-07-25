import type { ContractType } from "./types";
import { arriendoVivienda } from "./contracts/arriendo-vivienda";
import { prestacionServicios } from "./contracts/prestacion-servicios";

// ─────────────────────────────────────────────────────────────────────────
// REGISTRO de la base de conocimiento.
//
// Para agregar un tipo de contrato nuevo:
//   1. Crea un archivo en ./contracts/mi-contrato.ts que exporte un ContractType.
//   2. Impórtalo y añádelo al arreglo `contractTypes` de abajo.
// No hace falta tocar el motor ni la UI: todo se deriva de la configuración.
// ─────────────────────────────────────────────────────────────────────────

export const contractTypes: ContractType[] = [
  arriendoVivienda,
  prestacionServicios,
];

/** Índice por id para búsquedas O(1). */
const byId = new Map<string, ContractType>(
  contractTypes.map((c) => [c.id, c]),
);

/** Devuelve un tipo de contrato por su slug, o undefined si no existe. */
export function getContractType(id: string): ContractType | undefined {
  return byId.get(id);
}

/** Lista para el catálogo (solo metadatos). */
export function listCatalog() {
  return contractTypes.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    generationPriceClp: c.generationPriceClp,
    reviewPriceClp: c.reviewPriceClp,
    legalBasis: c.legalBasis ?? [],
  }));
}

export * from "./types";
export * from "./engine";
