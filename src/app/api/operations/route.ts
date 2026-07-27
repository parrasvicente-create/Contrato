import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  checkHardRules,
  getContractType,
  validateAnswers,
} from "@/lib/knowledge-base";
import { OperationKind, OperationStatus } from "@/lib/domain";

// POST /api/operations
// Crea una operación de GENERACIÓN a partir de las respuestas del wizard.
// Las respuestas se revalidan en el servidor: nunca confiamos en el cliente.

const bodySchema = z.object({
  contractTypeId: z.string().min(1),
  answers: z.record(z.unknown()),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Petición mal formada." },
      { status: 400 },
    );
  }

  const { contractTypeId, answers } = parsed.data;

  const contract = getContractType(contractTypeId);
  if (!contract) {
    return NextResponse.json(
      { error: "Tipo de contrato desconocido." },
      { status: 404 },
    );
  }

  // Revalidación de las respuestas (respetando la visibilidad condicional):
  // nunca confiamos en el cliente.
  const fieldErrors = validateAnswers(contract, answers);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        error: "Hay datos del formulario que no son válidos.",
        detalles: fieldErrors,
      },
      { status: 422 },
    );
  }

  // Reglas duras: límites legales que bloquean la generación.
  const violations = checkHardRules(contract, answers);
  if (violations.length > 0) {
    return NextResponse.json(
      {
        error: violations[0].message,
        code: "HARD_RULE",
        reglas: violations,
      },
      { status: 422 },
    );
  }

  const operation = await db.operation.create({
    data: {
      kind: OperationKind.GENERATE,
      contractTypeId: contract.id,
      // PREVIEW: hay contrato armado, pero aún no se paga (checkout: Etapa 3).
      status: OperationStatus.PREVIEW,
      answers: JSON.stringify(answers),
      amountClp: contract.generationPriceClp,
    },
  });

  return NextResponse.json({ id: operation.id }, { status: 201 });
}
