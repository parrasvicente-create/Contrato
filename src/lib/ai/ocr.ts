import { AiError, getAiClient, isAiConfigured } from "./client";

// ─────────────────────────────────────────────────────────────────────────
// OCR de PDFs escaneados usando la VISIÓN de Claude.
//
// Cuando un PDF no tiene capa de texto (es una imagen/escaneo), pdf-parse
// devuelve vacío. Aquí mandamos el PDF a Claude, que lo lee con visión y
// transcribe el texto. Esa transcripción se usa como `sourceText` y el resto
// del pipeline (clasificar, resumen, informe, Word) sigue igual.
//
// Se usa un modelo liviano con visión (Haiku por defecto), configurable con
// ANTHROPIC_OCR_MODEL. No requiere Tesseract ni otro proveedor.
// ─────────────────────────────────────────────────────────────────────────

const OCR_MODEL = process.env.ANTHROPIC_OCR_MODEL ?? "claude-haiku-4-5";

const SYSTEM = `Eres un transcriptor de documentos legales. Devuelves ÚNICAMENTE el texto del documento entregado, tal como aparece, respetando el orden, los párrafos y los epígrafes de las cláusulas.

Reglas:
- No agregues comentarios, títulos, explicaciones ni markdown.
- No resumas ni corrijas: transcribe literalmente lo que ves.
- Conserva números de cláusula, montos, RUT, fechas y nombres tal cual.
- Si una parte es ilegible, escribe [ilegible] en su lugar.`;

/**
 * Transcribe el texto de un PDF escaneado con Claude.
 * @param buffer Contenido del PDF.
 * @returns El texto transcrito.
 */
export async function ocrPdf(buffer: Buffer): Promise<string> {
  if (!isAiConfigured()) {
    throw new AiError(
      "El OCR con IA no está configurado. Falta la clave ANTHROPIC_API_KEY.",
      "NOT_CONFIGURED",
    );
  }

  const base64 = buffer.toString("base64");

  try {
    // Streaming: la transcripción puede ser larga y el SDK exige stream para
    // salidas grandes.
    const stream = getAiClient().messages.stream({
      model: OCR_MODEL,
      max_tokens: 32000,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Transcribe el texto completo de este documento, respetando el orden y los saltos de párrafo.",
            },
          ],
        },
      ],
    });

    const message = await stream.finalMessage();
    return message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
  } catch (err) {
    if (err instanceof AiError) throw err;
    console.error("[ocr] Falló la transcripción del PDF:", err);
    throw new AiError(
      "No se pudo leer el PDF escaneado. Inténtalo nuevamente.",
      "API_ERROR",
    );
  }
}
