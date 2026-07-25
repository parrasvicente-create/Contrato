import { db } from "@/lib/db";
import { OperationStatus, PaymentStatus, ReportStatus } from "@/lib/domain";
import { AiError } from "./client";
import { buildFullReport } from "./analyze";

// ─────────────────────────────────────────────────────────────────────────
// Generación del informe en SEGUNDO PLANO.
//
// El análisis con IA tarda ~2 minutos, demasiado para hacerlo dentro de una
// petición HTTP. Aquí se dispara como tarea que corre aparte, y su avance se
// consulta por polling desde la UI (estado en Operation.reportStatus).
//
// NOTA sobre producción: en un servidor Node de larga vida (como el actual)
// el "fire-and-forget" funciona. Si más adelante se despliega en un entorno
// serverless (Vercel), la función se congela al responder y esta tarea no
// terminaría; ahí conviene reemplazar `triggerReportGeneration` por una cola
// de trabajos (o `after()`), sin tocar el resto de la app.
// ─────────────────────────────────────────────────────────────────────────

/** Operaciones cuya generación está corriendo en este proceso. */
const inFlight = new Set<string>();

/**
 * Si una operación quedó en GENERATING pero su último cambio es más viejo que
 * esto, se considera colgada (p.ej. el proceso se reinició) y se permite
 * reintentar.
 */
const STALE_MS = 5 * 60 * 1000;

/**
 * Asegura que el informe de una operación pagada se esté generando.
 * Es idempotente: llamarla varias veces no duplica el trabajo.
 * @returns El estado resultante del informe.
 */
export async function triggerReportGeneration(
  operationId: string,
): Promise<ReportStatus> {
  const op = await db.operation.findUnique({
    where: { id: operationId },
    include: { order: true },
  });

  if (!op) return ReportStatus.PENDING;
  if (op.order?.status !== PaymentStatus.PAID) return ReportStatus.PENDING;
  if (op.fullReport) return ReportStatus.READY;

  // Ya está corriendo en este proceso.
  if (inFlight.has(operationId)) return ReportStatus.GENERATING;

  // Marcado como GENERATING y reciente: otra ejecución lo está haciendo.
  if (op.reportStatus === ReportStatus.GENERATING) {
    const fresh = Date.now() - op.updatedAt.getTime() < STALE_MS;
    if (fresh) return ReportStatus.GENERATING;
    // Si no, se considera colgado y se reintenta abajo.
  }

  inFlight.add(operationId);
  await db.operation.update({
    where: { id: operationId },
    data: { reportStatus: ReportStatus.GENERATING, reportError: null },
  });

  // Fire-and-forget: no se espera. Los errores se guardan en la operación.
  void runGeneration(operationId).finally(() => inFlight.delete(operationId));

  return ReportStatus.GENERATING;
}

/** Ejecuta la generación y persiste el resultado o el error. */
async function runGeneration(operationId: string): Promise<void> {
  try {
    const op = await db.operation.findUnique({ where: { id: operationId } });
    if (!op?.sourceText) {
      throw new AiError(
        "La operación no tiene el texto del contrato.",
        "INVALID_OUTPUT",
      );
    }

    const report = await buildFullReport(op.sourceText, {
      tipoContrato: op.detectedType ?? "otro",
      perspectiva: op.perspective,
      industria: op.industria,
      notas: op.notas,
    });

    await db.operation.update({
      where: { id: operationId },
      data: {
        fullReport: JSON.stringify(report),
        reportStatus: ReportStatus.READY,
        reportError: null,
        status: OperationStatus.COMPLETED,
      },
    });
  } catch (err) {
    const message =
      err instanceof AiError
        ? err.message
        : "No se pudo generar el informe. Inténtalo nuevamente.";
    console.error("[informe] Falló la generación en segundo plano:", err);
    await db.operation
      .update({
        where: { id: operationId },
        data: { reportStatus: ReportStatus.ERROR, reportError: message },
      })
      .catch(() => {
        // Si ni siquiera podemos guardar el error, no hay más que hacer aquí.
      });
  }
}
