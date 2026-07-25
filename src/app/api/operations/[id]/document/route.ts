import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PaymentStatus } from "@/lib/domain";
import { getContractType, type Answers } from "@/lib/knowledge-base";
import {
  buildContractDocx,
  buildContractPdf,
  contractFilename,
} from "@/lib/documents";

// GET /api/operations/:id/document?format=docx|pdf
// Genera y devuelve el contrato definitivo (sin marca de agua).
//
// Requiere que la operación tenga una orden PAGADA: este endpoint es lo que
// el usuario compra, así que la verificación de pago se hace aquí, en el
// servidor, y no puede saltarse desde el cliente.

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "pdf";

  if (format !== "docx" && format !== "pdf") {
    return NextResponse.json(
      { error: "Formato no soportado. Usa 'docx' o 'pdf'." },
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

  // Verificación de pago: sin orden pagada no se entrega el documento.
  if (operation.order?.status !== PaymentStatus.PAID) {
    return NextResponse.json(
      {
        error:
          "Este documento aún no ha sido pagado. Completa el pago para descargarlo.",
        operationId: operation.id,
      },
      { status: 402 }, // 402 Payment Required
    );
  }

  if (!operation.contractTypeId || !operation.answers) {
    return NextResponse.json(
      { error: "La operación no tiene datos de contrato." },
      { status: 409 },
    );
  }

  const contract = getContractType(operation.contractTypeId);
  if (!contract) {
    return NextResponse.json(
      { error: "Tipo de contrato desconocido." },
      { status: 404 },
    );
  }

  const answers = JSON.parse(operation.answers) as Answers;

  const file =
    format === "docx"
      ? await buildContractDocx(contract, answers)
      : await buildContractPdf(contract, answers);

  const filename = contractFilename(contract.name, format);
  const contentType =
    format === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/pdf";

  return new NextResponse(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(file.length),
    },
  });
}
