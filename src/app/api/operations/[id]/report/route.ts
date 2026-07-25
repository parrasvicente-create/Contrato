import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OperationKind, PaymentStatus, ReportStatus } from "@/lib/domain";
import { categoryLabel } from "@/lib/ai/categories";
import { buildReportPdf } from "@/lib/documents/report-pdf";
import { buildAnnotatedDocx, slugify } from "@/lib/documents";
import type { FullReport } from "@/lib/ai/schemas";

// GET /api/operations/:id/report?format=json|pdf
//
// NO BLOQUEANTE: no genera el informe. Devuelve su estado y, si está listo,
// el contenido. La generación corre en segundo plano (ver report-job.ts) y se
// dispara con POST .../report/generate. La UI consulta este endpoint por polling.
//
// Requiere que la operación tenga una orden PAGADA.

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";

  if (format !== "json" && format !== "pdf" && format !== "docx") {
    return NextResponse.json(
      { error: "Formato no soportado. Usa 'json', 'pdf' o 'docx'." },
      { status: 400 },
    );
  }

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

  // Verificación de pago.
  if (operation.order?.status !== PaymentStatus.PAID) {
    return NextResponse.json(
      {
        error:
          "El informe completo aún no ha sido pagado. Completa el pago para desbloquearlo.",
        operationId: operation.id,
      },
      { status: 402 },
    );
  }

  // La categoría del clasificador se guarda en detectedType.
  const contractTypeName = categoryLabel(operation.detectedType ?? "otro");

  const report: FullReport | null = operation.fullReport
    ? (JSON.parse(operation.fullReport) as FullReport)
    : null;

  // ── Descargas (PDF / Word): solo cuando el informe está listo ─────────
  if (format === "pdf" || format === "docx") {
    if (!report) {
      return NextResponse.json(
        { error: "El informe aún se está generando. Inténtalo en unos momentos." },
        { status: 409 },
      );
    }

    if (format === "docx") {
      // Word con los hallazgos como comentarios reales, anclados a la cláusula.
      if (!operation.sourceText) {
        return NextResponse.json(
          { error: "No se dispone del texto del contrato para anotarlo." },
          { status: 409 },
        );
      }
      const docx = await buildAnnotatedDocx({
        sourceText: operation.sourceText,
        report,
        contractTypeName,
      });
      const filename = `contrato-revisado-${slugify(contractTypeName)}.docx`;
      return new NextResponse(new Uint8Array(docx), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(docx.length),
        },
      });
    }

    const pdf = await buildReportPdf({
      report,
      contractTypeName,
      sourceFilename: operation.sourceFilename,
    });
    const filename = `informe-${slugify(contractTypeName)}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  }

  // ── JSON: estado + contenido si está listo ────────────────────────────
  if (report) {
    return NextResponse.json({
      status: ReportStatus.READY,
      report,
      contractTypeName,
    });
  }

  // Aún no hay informe: devolvemos el estado de la generación.
  const status =
    (operation.reportStatus as ReportStatus | null) ?? ReportStatus.PENDING;
  return NextResponse.json({
    status,
    error: operation.reportError ?? null,
    contractTypeName,
  });
}
