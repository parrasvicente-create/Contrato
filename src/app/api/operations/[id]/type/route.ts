import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { OperationKind, PaymentStatus } from "@/lib/domain";
import { CONTRACT_CATEGORIES } from "@/lib/ai/categories";

// POST /api/operations/:id/type  { tipo: <categoría> }
// Permite al usuario CORREGIR el tipo de contrato detectado antes de pagar
// (recomendación del spec cuando la confianza del clasificador es baja).

const bodySchema = z.object({ tipo: z.enum(CONTRACT_CATEGORIES) });

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Tipo de contrato no válido." }, { status: 400 });
  }

  const operation = await db.operation.findUnique({
    where: { id: params.id },
    include: { order: true },
  });
  if (!operation || operation.kind !== OperationKind.REVIEW) {
    return NextResponse.json({ error: "Operación no encontrada." }, { status: 404 });
  }

  // Solo se puede corregir antes de pagar (después ya está el informe).
  if (operation.order?.status === PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "La operación ya fue pagada; el tipo no puede cambiarse." },
      { status: 409 },
    );
  }

  await db.operation.update({
    where: { id: operation.id },
    data: { detectedType: parsed.data.tipo },
  });

  return NextResponse.json({ tipo: parsed.data.tipo });
}
