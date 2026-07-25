import Anthropic from "@anthropic-ai/sdk";

// ─────────────────────────────────────────────────────────────────────────
// Cliente de la API de Anthropic.
//
// El modelo se lee de ANTHROPIC_MODEL para poder cambiarlo sin tocar código.
// IMPORTANTE: debe ser un modelo con soporte de "structured outputs" (JSON
// garantizado contra un esquema): claude-sonnet-5, claude-opus-4-8,
// claude-haiku-4-5 o claude-fable-5.
// ─────────────────────────────────────────────────────────────────────────

export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

/**
 * Modelo del CLASIFICADOR (Paso 1). Es una tarea simple, así que usamos un
 * modelo más liviano y barato por defecto, como sugiere la especificación.
 * También debe soportar salida estructurada.
 */
export const CLASSIFIER_MODEL =
  process.env.ANTHROPIC_CLASSIFIER_MODEL ?? "claude-haiku-4-5";

/**
 * Máximo de caracteres del contrato que enviamos al modelo. Los contratos
 * reales rara vez se acercan a este límite; sirve para acotar el costo ante
 * un documento anómalo.
 */
export const MAX_CONTRACT_CHARS = 200_000;

let cached: Anthropic | null = null;

/** Indica si hay credenciales configuradas para llamar a la API. */
export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Devuelve el cliente de Anthropic (singleton). */
export function getAiClient(): Anthropic {
  if (!cached) {
    // Sin argumentos: el SDK resuelve las credenciales desde el entorno.
    cached = new Anthropic();
  }
  return cached;
}

/** Error de la capa de IA, con código estable para mapear a la UI. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_CONFIGURED" | "API_ERROR" | "INVALID_OUTPUT",
  ) {
    super(message);
    this.name = "AiError";
  }
}

/**
 * Recorta el contrato si excede el máximo, dejando constancia del recorte
 * para que el modelo sepa que el documento está incompleto.
 */
export function clampContractText(text: string): string {
  if (text.length <= MAX_CONTRACT_CHARS) return text;
  return (
    text.slice(0, MAX_CONTRACT_CHARS) +
    "\n\n[...] (documento truncado por su extensión)"
  );
}
