import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getContractType } from "@/lib/knowledge-base";
import { categoryLabel } from "@/lib/ai/categories";
import { getPaymentProvider } from "@/lib/payments";
import { OperationKind, PaymentStatus } from "@/lib/domain";
import { Disclaimer } from "@/components/Disclaimer";
import { CheckoutPanel } from "@/components/checkout/CheckoutPanel";

// Página de checkout. Es COMPARTIDA por ambos módulos: funciona igual para
// una operación de generación que para una de revisión, porque solo depende
// de la orden y su monto.

export default async function PagarPage({
  params,
}: {
  params: { orderId: string };
}) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: { operation: true },
  });

  if (!order) notFound();

  const provider = getPaymentProvider();
  const isPaid = order.status === PaymentStatus.PAID;

  const concepto =
    order.operation.kind === OperationKind.GENERATE
      ? // Generación: el tipo viene de la base de conocimiento.
        `Generación de contrato — ${
          getContractType(order.operation.contractTypeId ?? "")?.name ?? "Contrato"
        }`
      : // Revisión: el tipo es la categoría del clasificador (detectedType).
        `Informe de revisión — ${categoryLabel(order.operation.detectedType ?? "otro")}`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <p className="versalita text-dorado-600">Checkout</p>
        <h1 className="regla-dorada mt-3 text-3xl font-semibold tracking-tight text-tinta-800">
          {isPaid ? "Pago completado" : "Confirmar pago"}
        </h1>
      </header>

      <CheckoutPanel
        orderId={order.id}
        operationId={order.operationId}
        concepto={concepto}
        amountClp={order.amountClp}
        providerName={provider.displayName}
        isSimulated={provider.id === "simulado"}
        initiallyPaid={isPaid}
        isGeneration={order.operation.kind === OperationKind.GENERATE}
      />

      <Disclaimer />
    </div>
  );
}
