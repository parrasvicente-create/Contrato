import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OperationKind, PaymentStatus } from "@/lib/domain";
import { triggerReportGeneration } from "@/lib/ai/report-job";

// POST /api/operations/:id/report/generate
// Asegura que el informe se esté generando en segundo plano. Idempotente:
// se puede llamar al confirmar el pago, al abrir la página y al reintentar.

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const operation = await db.operation.findUnique({
    where: { id: params.id },
    include: { order: true },
  });

  if (!operation) {
    return NextResponse.json(
      { error: "Operación no encontrada." },
      { status: 404 },
    );
  }
  if (operation.kind !== OperationKind.REVIEW) {
    return NextResponse.json(
      { error: "Esta operación no es una revisión de contrato." },
      { status: 409 },
    );
  }
  if (operation.order?.status !== PaymentStatus.PAID) {
    return NextResponse.json(
      { error: "El informe aún no ha sido pagado.", operationId: operation.id },
      { status: 402 },
    );
  }

  const status = await triggerReportGeneration(operation.id);
  return NextResponse.json({ status });
}
