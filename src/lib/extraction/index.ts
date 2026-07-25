// ─────────────────────────────────────────────────────────────────────────
// Extracción de texto de documentos subidos.
//
// Soporta PDF (pdf-parse), Word .docx (mammoth) y texto plano. Se ejecuta
// solo en el servidor: estas librerías usan APIs de Node.
// ─────────────────────────────────────────────────────────────────────────

/** Tamaño máximo aceptado para un documento subido: 10 MB. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type SourceFormat = "pdf" | "docx" | "txt";

export interface ExtractionResult {
  text: string;
  format: SourceFormat;
  /** Número de páginas, si el formato lo informa (PDF). */
  pages?: number;
  /** Cantidad de caracteres del texto extraído. */
  characters: number;
}

export class ExtractionError extends Error {
  constructor(
    message: string,
    /** Código estable para mapear a un mensaje de UI. */
    readonly code:
      | "TOO_LARGE"
      | "UNSUPPORTED_FORMAT"
      | "EMPTY_TEXT"
      | "CORRUPT_FILE",
  ) {
    super(message);
    this.name = "ExtractionError";
  }
}

/**
 * Normaliza el texto extraído: unifica saltos de línea, colapsa espacios
 * repetidos y elimina líneas vacías consecutivas. Mantiene la estructura de
 * párrafos, que es lo que la IA necesita para citar cláusulas textualmente.
 */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n") // CRLF → LF
    .replace(/[ \t]+/g, " ") // espacios repetidos
    .replace(/ *\n */g, "\n") // espacios alrededor de saltos
    .replace(/\n{3,}/g, "\n\n") // máximo una línea en blanco
    .trim();
}

/** Detecta el formato a partir del nombre de archivo y el tipo MIME. */
export function detectFormat(
  filename: string,
  mimeType?: string,
): SourceFormat | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf") || mimeType === "application/pdf") return "pdf";
  if (
    lower.endsWith(".docx") ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (lower.endsWith(".txt") || mimeType === "text/plain") return "txt";
  return null;
}

/**
 * Extrae el texto de un documento subido.
 * @param buffer Contenido del archivo.
 * @param filename Nombre original (se usa para detectar el formato).
 * @param mimeType Tipo MIME informado por el navegador (opcional).
 */
export async function extractText(
  buffer: Buffer,
  filename: string,
  mimeType?: string,
): Promise<ExtractionResult> {
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ExtractionError(
      "El archivo supera el máximo de 10 MB.",
      "TOO_LARGE",
    );
  }

  const format = detectFormat(filename, mimeType);
  if (!format) {
    throw new ExtractionError(
      "Formato no soportado. Sube un PDF, un Word (.docx) o pega el texto.",
      "UNSUPPORTED_FORMAT",
    );
  }

  let text: string;
  let pages: number | undefined;

  try {
    if (format === "pdf") {
      // Import dinámico: pdf-parse solo debe cargarse en el servidor.
      const pdfParse = (await import("pdf-parse")).default;
      const parsed = await pdfParse(buffer);
      text = parsed.text;
      pages = parsed.numpages;
    } else if (format === "docx") {
      const mammoth = await import("mammoth");
      const parsed = await mammoth.extractRawText({ buffer });
      text = parsed.value;
    } else {
      text = buffer.toString("utf8");
    }
  } catch (err) {
    throw new ExtractionError(
      `No se pudo leer el archivo. Puede estar dañado o protegido con contraseña.`,
      "CORRUPT_FILE",
    );
  }

  const normalized = normalizeText(text);

  // Un PDF escaneado (imagen sin capa de texto) devuelve texto vacío.
  if (normalized.length < 50) {
    throw new ExtractionError(
      "No se encontró texto en el documento. Si es un PDF escaneado, necesita reconocimiento de texto (OCR).",
      "EMPTY_TEXT",
    );
  }

  return {
    text: normalized,
    format,
    pages,
    characters: normalized.length,
  };
}
