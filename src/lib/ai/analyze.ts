import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  AI_MODEL,
  AiError,
  clampContractText,
  getAiClient,
  isAiConfigured,
} from "./client";
import { fullReportSchema, type FullReport } from "./schemas";
import { categoryLabel } from "./categories";
import { getSpecializationModule } from "./modules";

// ─────────────────────────────────────────────────────────────────────────
// PASO 3: INFORME COMPLETO (según el spec).
//
// Prompt base ("abogado corporativo senior") + módulo de especialización
// inyectado según la categoría. Salida en JSON estructurado con enums
// estrictos (garantizados por la API). Se valida contra el esquema y se
// reintenta si la validación falla.
// ─────────────────────────────────────────────────────────────────────────

/** Texto de cierre canónico (fijado por el spec; lo forzamos en el servidor). */
const CIERRE =
  "Este informe constituye un análisis automatizado y no reemplaza la asesoría de un abogado habilitado. Ante observaciones calificadas como riesgo ALTO o crítico, se recomienda revisión profesional previa a la suscripción.";

/** Utilidad de anclaje de citas (usada por el Word anotado y las pruebas). */
function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MIN_CITATION_CHARS = 20;

/** Comprueba que una cita exista realmente en el documento original. */
export function citationExists(citation: string, sourceText: string): boolean {
  const source = normalizeForMatch(sourceText);
  const fragments = citation
    .split(/\[\s*\.\.\.\s*\]|\.\.\./g)
    .map(normalizeForMatch)
    .filter((f) => f.length >= MIN_CITATION_CHARS);
  if (fragments.length === 0) return false;
  return fragments.every((f) => source.includes(f));
}

export interface ReportInput {
  /** Categoría del clasificador (arrendamiento, laboral, ...). */
  tipoContrato: string;
  /** Parte representada; null/"" → revisión neutral. */
  perspectiva?: string | null;
  industria?: string | null;
  notas?: string | null;
}

function buildSystemPrompt(tipoContrato: string): string {
  const modulo = getSpecializationModule(tipoContrato);

  return `Eres un abogado corporativo senior especializado en derecho contractual chileno. Elaboras un informe de revisión con lenguaje jurídico preciso y técnico, pero estructurado de forma didáctica y progresiva, de modo que el lector comprenda no solo qué observas, sino por qué es relevante y cómo resolverlo.

Reglas de operación:
- Mantén rigor y terminología jurídica. No simplifiques el vocabulario legal.
- Lo didáctico está en la organización, la progresión y la explicación del razonamiento, no en rebajar el lenguaje.
- Cada observación debe explicitar su fundamento jurídico (norma, principio o efecto legal) y su consecuencia práctica.
- Analiza únicamente el texto entregado. Los vacíos se declaran como tales; no se presumen.
- Cita siempre la cláusula por número y epígrafe (campo "clausula").
- REDLINE (control de cambios): cuando propongas mejorar la redacción de una cláusula, en "cita_textual" copia LITERALMENTE el fragmento EXACTO del contrato que debe reemplazarse (tal como aparece, carácter por carácter), y en "redaccion_alternativa" escribe el texto que lo reemplazará. Ambos deben calzar: lo de "cita_textual" se tachará y lo de "redaccion_alternativa" se insertará en su lugar.
  · En "redaccion_alternativa" usa marcadores entre corchetes [PLAZO], [MONTO], [DÍAS DE AVISO] para datos que el contrato no tenga; nunca inventes el dato.
  · Si el arreglo es una ACCIÓN y no una reescritura de texto (p.ej. "solicitar un anexo"), deja "redaccion_alternativa" en "" y explica la acción en "como_abordarlo". Igual copia "cita_textual" para anclar la observación.
  · Si no puedes copiar textualmente la cláusula, deja "cita_textual" y "redaccion_alternativa" en "".
- "como_abordarlo" explica el porqué del cambio en lenguaje jurídico (fundamento y efecto), aunque haya redacción alternativa.
- COMENTARIO PARA LA CONTRAPARTE ("justificacion_contraparte"): escribe una nota BREVE dirigida a la otra parte para justificar el cambio propuesto en una negociación. Tono profesional, cortés y persuasivo, en primera persona plural ("proponemos", "sugerimos ajustar"). Explica por qué el cambio es razonable, equilibrado y conforme a la ley o al estándar de mercado, sin lenguaje interno de riesgo ("crítico", "alto") ni acusaciones. Es lo que se le muestra a la contraparte junto al redline.
- CLÁUSULAS AUSENTES: para cada vacío relevante, en "clausula_propuesta" redacta el TEXTO COMPLETO de la cláusula que se propone incorporar (epígrafe en mayúsculas + cuerpo), lista para insertar; usa marcadores [PLAZO], [MONTO], etc. para datos faltantes. En "justificacion_contraparte" del vacío, escribe la nota a la contraparte que justifica agregarla. Si no corresponde una cláusula textual, deja "clausula_propuesta" en "".
- No inventes números de artículo. Si no estás seguro del artículo exacto, cita solo el nombre de la ley.
- Aplica legislación chilena (Código Civil, Código de Comercio, Ley 19.496, Ley 21.719, Ley 20.393 y normativa sectorial pertinente).
- Adopta la perspectiva de la parte indicada; si no se indica, revisa de forma neutral y decláralo en "meta.perspectiva_revision".
${modulo ? `\n${modulo}\n` : ""}
Estructura del informe (responde en JSON según el esquema, ordenando analisis_clausulas de mayor a menor riesgo):

I. Síntesis y veredicto — naturaleza jurídica, partes, objeto, plazo, contraprestación, semáforo de riesgo global (VERDE/AMARILLO/ROJO) y frase de justificación (veredicto_breve).
II. Anatomía del contrato — tipo y naturaleza jurídica; estructura de obligaciones recíprocas; régimen económico; vigencia, renovación y término; ley aplicable y solución de controversias.
III. Análisis por cláusula — para cada cláusula relevante: cláusula (número y epígrafe), nivel de riesgo (ALTO/MEDIO/BAJO), qué establece, por qué importa (fundamento jurídico y consecuencia), cómo abordarlo (redacción alternativa o acción concreta). Ordenar de mayor a menor riesgo.
IV. Vacíos contractuales — cláusulas esperables ausentes, efecto de la ausencia, régimen supletorio aplicable.
V. Legalidad y validez — cláusulas potencialmente nulas, abusivas o inoponibles bajo derecho chileno, con fundamento normativo. Incluye alertas regulatorias (datos personales, libre competencia, anticorrupción, conflictos de interés) cuando corresponda. Si no hay riesgos de este tipo, declara hay_riesgos: false.
VI. Equilibrio contractual — asimetrías entre las partes en obligaciones, multas, plazos, causales de término y facultades unilaterales; si el desequilibrio es jurídicamente relevante o meramente comercial.
VII. Recomendaciones — observaciones priorizadas: Crítico (debe resolverse antes de suscribir), Negociable (conviene ajustar), Menor (mejora de técnica jurídica sin impacto material).

Responde exclusivamente con un objeto JSON válido según el esquema indicado, sin markdown ni preámbulo.`;
}

function buildUserPrompt(text: string, input: ReportInput): string {
  const perspectiva = input.perspectiva?.trim() || "No indicada (revisión neutral)";
  const industria = input.industria?.trim() || "No indicada";
  const notas = input.notas?.trim() || "Ninguno";
  const tipo = categoryLabel(input.tipoContrato);

  return `Perspectiva de revisión: ${perspectiva}
Tipo de contrato declarado: ${tipo}
Industria: ${industria}
Contexto adicional: ${notas}

TEXTO DEL CONTRATO:
${clampContractText(text)}`;
}

/** Ejecuta una llamada de streaming y devuelve el JSON parseado del informe. */
async function callOnce(system: string, user: string): Promise<FullReport | null> {
  // Streaming: el informe es largo y el SDK exige stream para salidas grandes.
  const stream = getAiClient().messages.stream({
    model: AI_MODEL,
    max_tokens: 32000,
    system,
    thinking: { type: "adaptive" },
    output_config: { format: zodOutputFormat(fullReportSchema), effort: "high" },
    messages: [{ role: "user", content: user }],
  });

  const message = await stream.finalMessage();
  const json = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");

  const result = fullReportSchema.safeParse(JSON.parse(json));
  return result.success ? result.data : null;
}

/**
 * Genera el informe completo del contrato.
 * @param text Texto extraído del documento.
 * @param input Categoría + perspectiva/industria/notas.
 */
export async function buildFullReport(
  text: string,
  input: ReportInput,
): Promise<FullReport> {
  if (!isAiConfigured()) {
    throw new AiError(
      "El análisis con IA no está configurado. Falta la clave ANTHROPIC_API_KEY.",
      "NOT_CONFIGURED",
    );
  }

  const system = buildSystemPrompt(input.tipoContrato);
  const user = buildUserPrompt(text, input);

  let report: FullReport | null = null;
  try {
    // Un reintento si la validación del esquema falla (spec: no confiar en
    // que el modelo mantenga el formato; reintentar).
    report = await callOnce(system, user);
    if (!report) {
      console.warn("[ia] Informe no validó contra el esquema; reintentando…");
      report = await callOnce(system, user);
    }
  } catch (err) {
    if (err instanceof AiError) throw err;
    console.error("[ia] Falló la generación del informe:", err);
    throw new AiError(
      "No se pudo generar el informe en este momento. Inténtalo nuevamente.",
      "API_ERROR",
    );
  }

  if (!report) {
    throw new AiError("La IA no devolvió un informe válido.", "INVALID_OUTPUT");
  }

  // Forzamos el texto de cierre canónico del spec.
  report.cierre = CIERRE;
  return report;
}
