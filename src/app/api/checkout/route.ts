import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { PaymentStatus } from "@/lib/domain";
import { getContractType } from "@/lib/knowledge-base";

// POST /api/checkout
// Inicia el pago de una operación (sirve tanto para GENERAR como para REVISAR).
// Crea la orden si no existe y delega en el proveedor de pago configurado.

const bodySchema = z.object({ operationId: z.string().min(1) });

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Petición mal formada." }, { status: 400 });
  }

  const operation = await db.operation.findUnique({
    where: { id: parsed.data.operationId },
    include: { order: true },
  });

  if (!operation) {
    return NextResponse.json(
      { error: "Operación no encontrada." },
      { status: 404 },
    );
  }

  // Si ya está pagada, no cobramos de nuevo.
  if (operation.order?.status === PaymentStatus.PAID) {
    return NextResponse.json(
      { orderId: operation.order.id, alreadyPaid: true },
      { status: 200 },
    );
  }

  const amountClp = operation.amountClp ?? 0;
  if (amountClp <= 0) {
    return NextResponse.json(
      { error: "La operación no tiene un monto válido." },
      { status: 409 },
    );
  }

  const provider = getPaymentProvider();

  // Reutilizamos la orden pendiente si ya existe; si no, la creamos.
  const order =
    operation.order ??
    (await db.order.create({
      data: {
        operationId: operation.id,
        provider: provider.id,
        amountClp,
        status: PaymentStatus.PENDING,
      },
    }));

  const contract = operation.contractTypeId
    ? getContractType(operation.contractTypeId)
    : undefined;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const payment = await provider.createPayment({
    orderId: order.id,
    amountClp: order.amountClp,
    description: contract?.name ?? "Servicio Resguardo",
    returnUrl: `${baseUrl}/pagar/${order.id}`,
  });

  // Guardamos la referencia del proveedor para poder conciliar después.
  if (payment.providerRef) {
    await db.order.update({
      where: { id: order.id },
      data: { providerRef: payment.providerRef },
    });
  }

  return NextResponse.json(
    { orderId: order.id, redirectUrl: payment.redirectUrl },
    { status: 201 },
  );
}
