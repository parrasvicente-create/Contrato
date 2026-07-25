import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OperationKind, PaymentStatus } from "@/lib/domain";
import { categoryLabel } from "@/lib/ai/categories";
import { Disclaimer } from "@/components/Disclaimer";
import { ReportView } from "@/components/review/ReportView";
import { formatClp } from "@/lib/format";

// Página del informe completo. El contenido solo se carga si la operación
// está pagada; si no, se muestra el muro de pago.

export default async function InformePage({
  params,
}: {
  params: { id: string };
}) {
  const operation = await db.operation.findUnique({
    where: { id: params.id },
    include: { order: true },
  });

  if (!operation || operation.kind !== OperationKind.REVIEW) notFound();

  const contractTypeName = categoryLabel(operation.detectedType ?? "otro");

  const isPaid = operation.order?.status === PaymentStatus.PAID;

  // ── Muro de pago ──────────────────────────────────────────────────────
  if (!isPaid) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <header>
          <p className="versalita text-dorado-600">Informe completo</p>
          <h1 className="regla-dorada mt-3 text-3xl font-semibold tracking-tight text-tinta-800">
            Aún no está desbloqueado
          </h1>
        </header>
        <div className="border border-tinta-100 bg-papel p-6 shadow-sutil">
          <p className="max-w-lectura leading-relaxed text-tinta-600">
            Completa el pago de{" "}
            <strong className="font-serif text-lg font-semibold text-tinta-800">
              {formatClp(operation.amountClp ?? 0)}
            </strong>{" "}
            para ver el análisis cláusula por cláusula de tu{" "}
            {contractTypeName.toLowerCase()}.
          </p>
          {operation.order && (
            <Link
              href={`/pagar/${operation.order.id}`}
              className="mt-5 inline-block rounded bg-tinta-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-tinta-700"
            >
              Ir al pago
            </Link>
          )}
        </div>
        <Disclaimer />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="border-b border-tinta-200 pb-6">
        <p className="versalita text-dorado-600">Informe de revisión</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-tinta-800">
          {contractTypeName}
        </h1>
        {operation.sourceFilename && (
          <p className="mt-1 text-sm text-tinta-400">
            {operation.sourceFilename}
          </p>
        )}
      </header>

      {/* Aviso para no perder el acceso (no hay cuenta obligatoria). */}
      <p className="border-l-2 border-dorado-500 bg-dorado-50/60 px-4 py-2.5 text-xs leading-relaxed text-tinta-600">
        Guarda esta página en favoritos: es el enlace a tu informe. Podrás volver
        a abrirlo y descargar el PDF cuando quieras.
      </p>

      {/* El informe se carga desde la API: si aún no existe, se genera ahí. */}
      <ReportView operationId={operation.id} />

      <Disclaimer />
    </div>
  );
}
