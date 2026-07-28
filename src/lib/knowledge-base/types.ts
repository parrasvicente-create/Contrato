import type { Severity } from "@/lib/domain";

// ─────────────────────────────────────────────────────────────────────────
// BASE DE CONOCIMIENTO LEGAL — definición de tipos.
//
// Cada tipo de contrato se describe con un objeto `ContractType`. El objetivo
// de diseño es que agregar un contrato nuevo sea SOLO crear un archivo de
// configuración en `contracts/` y registrarlo — sin tocar el motor.
//
// Un `ContractType` contiene 4 partes:
//   a) METADATOS      → nombre, descripción, precios
//   b) CUESTIONARIO   → pasos y campos con validaciones (alimenta el wizard)
//   c) CLÁUSULAS      → texto con placeholders y bloques condicionales
//   d) REGLAS DE RIESGO → qué detectar al revisar un contrato ajeno
// ─────────────────────────────────────────────────────────────────────────

// ── (b) CUESTIONARIO ──────────────────────────────────────────────────────

/**
 * Tipo de un campo del cuestionario. Determina el control de UI a mostrar y
 * la validación aplicada.
 */
export type FieldType =
  | "text" // texto corto
  | "textarea" // texto largo
  | "rut" // RUT chileno (valida DV)
  | "money_clp" // monto en pesos chilenos (entero)
  | "money_uf" // monto en UF (decimal)
  | "number" // número genérico
  | "date" // fecha (ISO en el estado, se muestra en formato CL)
  | "select" // opción de una lista
  | "boolean"; // sí / no (activa cláusulas condicionales)

/** Una opción para campos de tipo "select". */
export interface FieldOption {
  value: string;
  label: string;
}

/** Reglas de validación adicionales sobre un campo. */
export interface FieldValidation {
  min?: number; // valor mínimo (números/montos) o largo mínimo (texto)
  max?: number; // valor máximo o largo máximo
  pattern?: string; // expresión regular (para "text")
  patternMessage?: string; // mensaje si no cumple el patrón
}

/** Un campo individual del cuestionario. */
export interface QuestionField {
  /** Clave única dentro del contrato; se usa como placeholder y en `answers`. */
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Texto de ayuda mostrado bajo el campo. */
  help?: string;
  /** Opciones para type === "select". */
  options?: FieldOption[];
  /** Valor por defecto. */
  defaultValue?: string | number | boolean;
  validation?: FieldValidation;
  /**
   * Visibilidad condicional: si está presente, el campo solo se muestra (y solo
   * se valida) cuando la condición es verdadera. Ej: "fecha de término" solo si
   * el plazo no es mes a mes. Se evalúa igual que las condiciones de cláusula.
   */
  visibleIf?: Condition;
}

/** Un paso del wizard: agrupa campos relacionados. */
export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  fields: QuestionField[];
}

// ── (c) CLÁUSULAS ─────────────────────────────────────────────────────────

/**
 * Condición declarativa (segura, sin `eval`) para incluir/omitir una cláusula
 * o para requerir un campo. Se evalúa contra las respuestas del cuestionario.
 *
 * Ejemplos:
 *   { field: "incluye_reajuste", op: "eq", value: true }
 *   { all: [ { field: "garantia_meses", op: "gt", value: 1 }, ... ] }
 */
export type Condition =
  // Operadores de comparación: requieren un valor de referencia.
  | { field: string; op: ComparisonOp; value: string | number | boolean }
  // Operadores unarios: solo miran si el campo tiene/no tiene valor.
  | { field: string; op: "truthy" | "falsy" }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

export type ComparisonOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte";
export type ConditionOp = ComparisonOp | "truthy" | "falsy";

/**
 * Bloque de cláusula. El `text` puede contener placeholders `{{campo}}` y
 * `{{campo:tipo}}` para formatear (p.ej. `{{renta:money_clp}}`). Si tiene
 * `condition`, la cláusula solo se incluye cuando la condición es verdadera.
 */
export interface ClauseBlock {
  id: string;
  /** Encabezado de la cláusula, p.ej. "PRIMERO: Del inmueble". */
  heading: string;
  text: string;
  /** Si está presente, la cláusula se incluye solo si la condición se cumple. */
  condition?: Condition;
  /**
   * Marca cláusulas que el usuario puede activar/desactivar explícitamente en
   * el wizard (paso "cláusulas opcionales"). Suele ir junto a un campo boolean.
   */
  optional?: boolean;
}

// ── (c-bis) REGLAS DURAS DEL GENERADOR ────────────────────────────────────

/**
 * Regla dura: límite LEGAL que el generador no puede cruzar. A diferencia de
 * las validaciones de campo (min/max), mira varios campos a la vez y, si la
 * configuración la infringe, BLOQUEA la generación (no solo advierte).
 *
 * Muchas reglas del arriendo (irrenunciabilidad, prohibición de autotutela,
 * garantía que no es renta anticipada, competencia del tribunal) se cumplen
 * "por diseño": el motor simplemente nunca emite ese texto. Esas se listan en
 * `designGuarantees`. Las que SÍ dependen de lo que el usuario configura
 * (p.ej. el tope de la cláusula penal) se modelan aquí.
 */
export interface HardRule {
  /** Identificador estable, p.ej. "R4". */
  id: string;
  title: string;
  /** Fundamento normativo, p.ej. "Art. 1544 CC". */
  legalBasis: string;
  /** Condición que, si es VERDADERA, significa que la config es ilegal. */
  violatedWhen: Condition;
  /** Mensaje mostrado al usuario cuando se bloquea. */
  message: string;
}

// ── (d) REGLAS DE RIESGO ──────────────────────────────────────────────────

/**
 * Regla de riesgo a detectar al REVISAR un contrato ajeno. La IA analiza el
 * documento CONTRA estas reglas; no debe inventar normativa fuera de aquí.
 */
export interface RiskRule {
  id: string;
  /** Nombre del hallazgo, p.ej. "Garantía superior a un mes de renta". */
  name: string;
  severity: Severity;
  /** Explicación en lenguaje simple, sin jerga legal. */
  explanation: string;
  /** Qué es "lo usual" en Chile, para comparar. */
  usualInChile: string;
  /** Referencia normativa cuando corresponda (ley, artículo). Opcional. */
  normativeReference?: string;
  /**
   * Guía concreta para que la IA sepa qué patrón textual buscar en el
   * contrato. No se muestra al usuario final; orienta la detección.
   */
  detectionGuidance: string;
}

// ── (a) METADATOS + AGREGADO ──────────────────────────────────────────────

/** Definición completa de un tipo de contrato en la base de conocimiento. */
export interface ContractType {
  /** Slug único y estable, p.ej. "arriendo-vivienda". */
  id: string;
  name: string;
  description: string;
  /** Precio de GENERAR el contrato (CLP). */
  generationPriceClp: number;
  /** Precio de REVISAR un contrato de este tipo (CLP). */
  reviewPriceClp: number;

  /** Ley/normas de referencia general del tipo de contrato (informativo). */
  legalBasis?: string[];

  /**
   * Palabras y frases características de este tipo de contrato. Se usan como
   * detección de respaldo (heurística) cuando la IA no está disponible, y
   * como pista adicional para el prompt de detección.
   */
  detectionKeywords?: string[];

  /** Pasos del cuestionario que alimentan el wizard del generador. */
  steps: WizardStep[];

  /** Cláusulas que arman el documento generado. */
  clauses: ClauseBlock[];

  /**
   * Reglas duras (límites legales que bloquean la generación). Se evalúan en el
   * wizard y se revalidan en el servidor.
   */
  hardRules?: HardRule[];

  /**
   * Garantías que el contrato cumple "por diseño": límites legales que el motor
   * respeta siempre porque nunca genera el texto contrario. Se muestran como
   * tranquilidad al usuario en la revisión.
   */
  designGuarantees?: string[];

  /**
   * Parámetros del contrato (tasas, valores) inyectados al renderizar como
   * placeholders `{{param_...}}`. Centralizan lo que cambia por ley o por año
   * (p.ej. la retención de segunda categoría) para no escribirlo en el texto.
   */
  params?: Record<string, string | number>;

  /** Reglas de riesgo aplicadas por el revisor. */
  riskRules: RiskRule[];
}

/**
 * Subconjunto del contrato necesario para armar el documento. Permite que el
 * wizard del cliente reciba solo cuestionario y cláusulas, sin las reglas de
 * riesgo (que son propias del módulo revisor).
 */
export type AssemblableContract = Pick<
  ContractType,
  "steps" | "clauses" | "params"
>;

/** Devuelve todos los campos de un contrato, aplanando los pasos del wizard. */
export function allFields(contract: Pick<ContractType, "steps">): QuestionField[] {
  return contract.steps.flatMap((step) => step.fields);
}
