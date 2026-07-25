import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { OperationKind, OperationStatus, PaymentStatus } from "@/lib/domain";
import { triggerReportGeneration } from "@/lib/ai/report-job";

// POST /api/checkout/:orderId/confirm
// Confirma el pago de una orden. Con un proveedor real, aquí llegaría el
// usuario de vuelta desde la pasarela (o su webhook) y se verificaría la
// transacción antes de dar por pagada la orden.

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } },
) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { operation: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada." }, { status: 404 });
  }

  // Idempotencia: confirmar dos veces no cobra ni cambia nada.
  if (order.status === PaymentStatus.PAID) {
    return NextResponse.json({
      status: PaymentStatus.PAID,
      operationId: order.operationId,
      alreadyPaid: true,
    });
  }

  // El proveedor puede necesitar los parámetros que devuelve la pasarela.
  let payload: Record<string, string> = {};
  try {
    const body = await request.json();
    if (body && typeof body === "object") payload = body as Record<string, string>;
  } catch {
    // Sin cuerpo: normal en el proveedor simulado.
  }

  const provider = getPaymentProvider();
  const result = await provider.confirmPayment({
    orderId: order.id,
    payload,
  });

  if (result.status !== PaymentStatus.PAID) {
    await db.order.update({
      where: { id: order.id },
      data: { status: result.status, providerRef: result.providerRef },
    });
    return NextResponse.json(
      { status: result.status, error: result.message ?? "El pago no se completó." },
      { status: 402 },
    );
  }

  // Pago aprobado: marcamos la orden y desbloqueamos la operación.
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: {
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        providerRef: result.providerRef ?? order.providerRef,
      },
    }),
    db.operation.update({
      where: { id: order.operationId },
      data: { status: OperationStatus.PAID },
    }),
  ]);

  // Si es una revisión, arrancamos el informe en segundo plano de inmediato,
  // para que vaya avanzando mientras el usuario llega a la página del informe.
  if (order.operation.kind === OperationKind.REVIEW) {
    void triggerReportGeneration(order.operationId).catch(() => {
      // La UI también lo dispara y reintenta; un fallo aquí no es crítico.
    });
  }

  return NextResponse.json({
    status: PaymentStatus.PAID,
    operationId: order.operationId,
  });
}
