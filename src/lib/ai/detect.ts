import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  CLASSIFIER_MODEL,
  AiError,
  clampContractText,
  getAiClient,
  isAiConfigured,
} from "./client";
import { classifierSchema, type ClassifierResult } from "./schemas";
import {
  CATEGORY_INFO,
  CONTRACT_CATEGORIES,
  type ContractCategory,
} from "./categories";

// ─────────────────────────────────────────────────────────────────────────
// PASO 1: CLASIFICADOR de contratos (según el spec).
//
// Determina el tipo contractual entre 6 categorías. Usa un modelo liviano y
// salida estructurada (el enum queda garantizado por la API). Si la IA no
// está disponible, cae a una heurística por palabras clave.
// ─────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un clasificador de contratos legales chilenos. Tu única tarea es leer el texto entregado y determinar su tipo contractual. No hagas análisis de riesgo, no des opiniones, no redactes recomendaciones.

Categorías posibles:
- arrendamiento
- prestacion_servicios
- nda
- compraventa
- laboral
- otro

Criterios de clasificación:
- arrendamiento: hay entrega temporal de uso de un bien (inmueble o mueble) a cambio de renta.
- prestacion_servicios: una parte se obliga a ejecutar un servicio o entregable a cambio de un pago, sin relación de subordinación declarada.
- nda: el objeto principal es proteger información confidencial, sin que exista otra prestación sustantiva.
- compraventa: hay transferencia de dominio de un bien a cambio de un precio.
- laboral: hay prestación de servicios personales bajo subordinación y dependencia (jornada, remuneración periódica, cargo, jefatura).
- otro: si no calza claramente con ninguna de las anteriores, o es un tipo mixto/atípico (ej. franquicia, distribución, sociedad, mutuo, leasing, transacción, mandato).

Reglas:
- Si el contrato combina elementos de varias categorías, elige la que corresponda a la obligación principal, no a las accesorias.
- Si el título del documento no coincide con su contenido real, prioriza el contenido.
- Si hay ambigüedad genuina entre dos categorías, elige la más específica antes que "otro".`;

/** Quita tildes y pasa a minúsculas, para comparar texto de forma robusta. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/** Clasificación de respaldo por coincidencia de palabras clave. */
export function classifyByKeywords(text: string): ClassifierResult {
  const haystack = normalize(text);

  let best: { id: ContractCategory; score: number } | null = null;
  for (const category of CONTRACT_CATEGORIES) {
    const keywords = CATEGORY_INFO[category].keywords;
    let score = 0;
    for (const keyword of keywords) {
      const needle = normalize(keyword);
      let index = haystack.indexOf(needle);
      while (index !== -1) {
        score++;
        index = haystack.indexOf(needle, index + needle.length);
      }
    }
    if (!best || score > best.score) best = { id: category, score };
  }

  if (!best || best.score < 3) {
    return {
      tipo_contrato: "otro",
      confianza: "baja",
      justificacion:
        "No se reconocieron suficientes señales de un tipo de contrato conocido.",
      senales_mixtas: [],
    };
  }

  return {
    tipo_contrato: best.id,
    confianza: best.score >= 8 ? "media" : "baja",
    justificacion: `Detectado por coincidencia de ${best.score} términos característicos.`,
    senales_mixtas: [],
  };
}

/**
 * Clasifica el contrato con IA, con respaldo heurístico.
 * @param text Texto extraído del documento.
 */
export async function classifyContract(text: string): Promise<ClassifierResult> {
  if (!isAiConfigured()) return classifyByKeywords(text);

  try {
    const response = await getAiClient().messages.parse({
      model: CLASSIFIER_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(classifierSchema) },
      messages: [
        {
          role: "user",
          content: `TEXTO DEL CONTRATO:\n${clampContractText(text)}`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new AiError("La IA no devolvió una clasificación válida.", "INVALID_OUTPUT");
    }
    return parsed;
  } catch (err) {
    // Ante cualquier fallo, seguimos con la heurística en vez de dejar al
    // usuario sin resultado.
    console.error("[ia] Falló la clasificación con IA, usando heurística:", err);
    return classifyByKeywords(text);
  }
}
