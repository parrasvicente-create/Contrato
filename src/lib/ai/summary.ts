import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { DISCLAIMER } from "@/lib/constants";
import {
  AI_MODEL,
  AiError,
  clampContractText,
  getAiClient,
  isAiConfigured,
} from "./client";
import { freeSummarySchema, type FreeSummary } from "./schemas";
import { categoryLabel } from "./categories";

// ─────────────────────────────────────────────────────────────────────────
// Resumen GRATUITO del contrato, en lenguaje simple.
//
// Es lo que el usuario ve sin pagar y sin crear cuenta: "a qué te
// comprometes". Deliberadamente NO entrega el análisis de riesgo cláusula
// por cláusula — eso se desbloquea con el pago (Etapa 5).
// ─────────────────────────────────────────────────────────────────────────

function buildSystemPrompt(tipoContrato: string): string {
  const contexto =
    tipoContrato && tipoContrato !== "otro"
      ? `El documento fue clasificado como: ${categoryLabel(tipoContrato)}.`
      : "El documento no corresponde a un tipo de contrato conocido; analízalo según principios generales del derecho civil y laboral chileno.";

  return `Eres un asistente que explica contratos chilenos a personas SIN formación legal.

${contexto}

Tu tarea es producir un resumen claro y honesto de a qué se compromete quien firma.

Reglas estrictas:
- Escribe en español de Chile, en lenguaje simple y directo. Prohibido usar jerga legal sin explicarla.
- Básate ÚNICAMENTE en el texto del contrato entregado. No inventes cláusulas, montos, plazos ni normativa.
- Si el contrato no dice algo (por ejemplo, no fija garantía), NO lo inventes: omítelo o señala que no está.
- Los montos exprésalos como aparecen en el documento.
- En "puntosDeAtencion" señala de forma BREVE qué temas merecen revisión, sin desarrollar el análisis
  completo ni dar recomendaciones detalladas: ese contenido es parte del informe pagado.
- En "hallazgosEstimados" indica cuántos puntos problemáticos detectaste, como número entero.
- No des asesoría legal ni afirmes que algo es "ilegal". Describe lo que dice el contrato.

Contexto del servicio: ${DISCLAIMER}`;
}

/**
 * Genera el resumen gratuito del contrato.
 * @param text Texto extraído del documento.
 * @param tipoContrato Categoría detectada por el clasificador.
 */
export async function buildFreeSummary(
  text: string,
  tipoContrato: string,
): Promise<FreeSummary> {
  if (!isAiConfigured()) {
    throw new AiError(
      "El análisis con IA no está configurado. Falta la clave ANTHROPIC_API_KEY.",
      "NOT_CONFIGURED",
    );
  }

  try {
    const response = await getAiClient().messages.parse({
      model: AI_MODEL,
      max_tokens: 16000,
      system: buildSystemPrompt(tipoContrato),
      thinking: { type: "adaptive" },
      output_config: {
        format: zodOutputFormat(freeSummarySchema),
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `Resume el siguiente contrato:\n\n---\n${clampContractText(text)}\n---`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new AiError(
        "La IA no devolvió un resumen válido.",
        "INVALID_OUTPUT",
      );
    }
    return parsed;
  } catch (err) {
    if (err instanceof AiError) throw err;
    console.error("[ia] Falló la generación del resumen:", err);
    throw new AiError(
      "No se pudo analizar el contrato en este momento. Inténtalo nuevamente.",
      "API_ERROR",
    );
  }
}
