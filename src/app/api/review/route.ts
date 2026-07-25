import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OperationKind, OperationStatus } from "@/lib/domain";
import {
  ExtractionError,
  MAX_UPLOAD_BYTES,
  extractText,
  normalizeText,
} from "@/lib/extraction";
import { classifyContract } from "@/lib/ai/detect";
import { buildFreeSummary } from "@/lib/ai/summary";
import { AiError } from "@/lib/ai/client";
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
      if (err instanceof ExtractionError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 422 },
        );
      }
      throw err;
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
  const classification = await classifyContract(text);

  // ── 3. Resumen gratuito ──────────────────────────────────────────────
  let summary;
  try {
    summary = await buildFreeSummary(text, classification.tipo_contrato);
  } catch (err) {
    if (err instanceof AiError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.code === "NOT_CONFIGURED" ? 503 : 502 },
      );
    }
    throw err;
  }

  // ── 4. Persistencia ──────────────────────────────────────────────────
  const operation = await db.operation.create({
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
