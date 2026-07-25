"use client";

import { useState } from "react";
import { formatClp } from "@/lib/format";

// Panel de pago. Muestra el resumen del cobro y, tras confirmar, el acceso al
// contenido desbloqueado. Con un proveedor real, "Pagar" llevaría a la
// pasarela externa en vez de confirmar directamente.

interface CheckoutPanelProps {
  orderId: string;
  operationId: string;
  concepto: string;
  amountClp: number;
  providerName: string;
  isSimulated: boolean;
  initiallyPaid: boolean;
  /** Si es una generación de contrato, ofrecemos .docx y .pdf. */
  isGeneration: boolean;
}

export function CheckoutPanel({
  orderId,
  operationId,
  concepto,
  amountClp,
  providerName,
  isSimulated,
  initiallyPaid,
  isGeneration,
}: CheckoutPanelProps) {
  const [paid, setPaid] = useState(initiallyPaid);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/checkout/${orderId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar el pago.");
        return;
      }
      setPaid(true);
    } catch {
      setError("Error de conexión. Inténtalo nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Boleta del cobro */}
      <div className="border border-tinta-100 bg-papel p-6 shadow-sutil">
        <p className="versalita text-tinta-400">Detalle</p>
        <dl className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-6">
            <dt className="text-sm text-tinta-500">Concepto</dt>
            <dd className="text-right text-sm font-medium text-tinta-800">
              {concepto}
            </dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-tinta-100 pt-3">
            <dt className="text-sm text-tinta-500">Total</dt>
            <dd className="font-serif text-2xl font-semibold text-tinta-800">
              {formatClp(amountClp)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-xs text-tinta-400">Medio de pago</dt>
            <dd className="text-xs text-tinta-400">{providerName}</dd>
          </div>
        </dl>
      </div>

      {isSimulated && !paid && (
        <p className="border-l-2 border-dorado-500 bg-dorado-50/60 px-4 py-3 text-sm text-tinta-600">
          <strong className="font-semibold text-tinta-800">
            Modo de pruebas.
          </strong>{" "}
          No se realizará ningún cobro real. Al confirmar, la orden se marcará
          como pagada.
        </p>
      )}

      {error && (
        <p className="border-l-2 border-riesgo-critico bg-riesgo-criticoSuave px-4 py-3 text-sm text-riesgo-critico">
          {error}
        </p>
      )}

      {paid ? (
        <div className="border border-riesgo-ok/30 bg-riesgo-okSuave p-6">
          <p className="versalita text-riesgo-ok">Pago confirmado</p>
          <h2 className="mt-2 font-serif text-lg font-semibold text-tinta-800">
            Tu documento está desbloqueado
          </h2>
          <p className="mt-1 text-sm text-tinta-600">
            Guarda este enlace para volver a descargarlo cuando quieras.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {isGeneration ? (
              <>
                <a
                  href={`/api/operations/${operationId}/document?format=docx`}
                  className="rounded bg-tinta-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta-700"
                >
                  Descargar Word
                </a>
                <a
                  href={`/api/operations/${operationId}/document?format=pdf`}
                  className="rounded border border-tinta-300 px-5 py-2.5 text-sm font-semibold text-tinta-700 transition hover:border-tinta-800 hover:bg-white"
                >
                  Descargar PDF
                </a>
              </>
            ) : (
              // El informe se genera en segundo plano; en la página del
              // informe se muestra el progreso y, al terminar, la descarga.
              <a
                href={`/informe/${operationId}`}
                className="rounded bg-tinta-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta-700"
              >
                Ver informe completo
              </a>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="w-full rounded bg-tinta-800 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-tinta-700 disabled:opacity-50"
        >
          {loading ? "Procesando…" : `Pagar ${formatClp(amountClp)}`}
        </button>
      )}
    </div>
  );
}
