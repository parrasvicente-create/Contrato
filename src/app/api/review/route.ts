import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OperationKind, OperationStatus } from "@/lib/domain";
import {
  ExtractionError,
  MAX_UPLOAD_BYTES,
  detectFormat,
  extractText,
  normalizeText,
} from "@/lib/extraction";
import { classifyContract } from "@/lib/ai/detect";
import { buildFreeSummary } from "@/lib/ai/summary";
import { AiError, isAiConfigured } from "@/lib/ai/client";
import { ocrPdf } from "@/lib/ai/ocr";
import { REVIEW_PRICE_CLP, categoryLabel } from "@/lib/ai/categories";

// POST /api/review
// Paso 1 (clasificar) + resumen GRATUITO. Crea la operación de revisión.
//
// Acepta multipart/form-data con:
//   - "file" (PDF/.docx) o "text" (texto pegado)
//   - "perspectiva", "industria", "notas" (opcionales)

function field(form: FormData, name: string, max = 200): string | null {
  const v = form.get(name);
  return typeof v === "string" && v.trim().length > 0
    ? v.trim().slice(0, max)
    : null;
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer el formulario." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const pastedText = form.get("text");
  const perspectiva = field(form, "perspectiva", 120);
  const industria = field(form, "industria", 120);
  const notas = field(form, "notas", 2000);

  // ── 1. Extracción del texto ──────────────────────────────────────────
  let text: string;
  let sourceFilename: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "El archivo supera el máximo de 10 MB." },
        { status: 413 },
      );
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    try {
      const extracted = await extractText(buffer, file.name, file.type);
      text = extracted.text;
      sourceFilename = file.name;
    } catch (err) {
      if (!(err instanceof ExtractionError)) throw err;

      // PDF escaneado (sin capa de texto): en vez de rendirnos, lo leemos con
      // la visión de Claude (OCR) y seguimos con el pipeline normal.
      const isScannedPdf =
        err.code === "EMPTY_TEXT" &&
        detectFormat(file.name, file.type) === "pdf";

      if (isScannedPdf && isAiConfigured()) {
        try {
          const ocrText = normalizeText(await ocrPdf(buffer));
          if (ocrText.length < 50) {
            return NextResponse.json(
              { error: err.message, code: err.code },
              { status: 422 },
            );
          }
          text = ocrText;
          sourceFilename = file.name;
        } catch {
          return NextResponse.json(
            {
              error:
                "No pudimos leer el PDF escaneado. Prueba con un archivo más nítido o pega el texto.",
              code: "OCR_FAILED",
            },
            { status: 422 },
          );
        }
      } else {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 422 },
        );
      }
    }
  } else if (typeof pastedText === "string" && pastedText.trim().length > 0) {
    text = normalizeText(pastedText);
    if (text.length < 50) {
      return NextResponse.json(
        { error: "El texto es demasiado corto para analizarlo." },
        { status: 422 },
      );
    }
    sourceFilename = "texto-pegado.txt";
  } else {
    return NextResponse.json(
      { error: "Sube un archivo o pega el texto del contrato." },
      { status: 400 },
    );
  }

  // ── 2. Clasificación (Paso 1) ────────────────────────────────────────
  let classification;
  try {
    classification = await classifyContract(text);
  } catch (err) {
    if (err instanceof AiError) {
      console.error("[review] Falló la clasificación:", err.code, err.message);
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code === "NOT_CONFIGURED" ? 503 : 502 },
      );
    }
    throw err;
  }

  // ── 3. Resumen gratuito ──────────────────────────────────────────────
  let summary;
  try {
    summary = await buildFreeSummary(text, classification.tipo_contrato);
  } catch (err) {
    if (err instanceof AiError) {
      console.error("[review] Falló el resumen:", err.code, err.message);
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code === "NOT_CONFIGURED" ? 503 : 502 },
      );
    }
    throw err;
  }

  // ── 4. Persistencia ──────────────────────────────────────────────────
  let operation;
  try {
    operation = await db.operation.create({
      data: {
        kind: OperationKind.REVIEW,
        // La categoría del clasificador se guarda en detectedType.
        detectedType: classification.tipo_contrato,
        status: OperationStatus.PREVIEW,
        sourceText: text,
        sourceFilename,
        perspective: perspectiva,
        industria,
        notas,
        freeSummary: JSON.stringify(summary),
        amountClp: REVIEW_PRICE_CLP,
      },
    });
  } catch (err) {
    // Falla típica en producción: la base (Supabase) no está accesible o la
    // URL de conexión quedó mal en el hosting.
    console.error("[review] Falló al guardar la operación en la base:", err);
    return NextResponse.json(
      {
        error:
          "No pudimos guardar el análisis. Hay un problema con la base de datos; inténtalo nuevamente en un momento.",
        code: "DB_ERROR",
      },
      { status: 503 },
    );
  }

  return NextResponse.json(
    {
      id: operation.id,
      classification,
      summary,
      amountClp: REVIEW_PRICE_CLP,
      contractTypeName: categoryLabel(classification.tipo_contrato),
    },
    { status: 201 },
  );
}
