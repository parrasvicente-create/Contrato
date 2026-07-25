import PDFDocument from "pdfkit";
import type { ContractType } from "@/lib/knowledge-base";
import { assembleContract, type Answers } from "@/lib/knowledge-base";
import { DISCLAIMER } from "@/lib/constants";
import { formatDate } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────
// Generación del contrato en formato PDF con pdfkit.
//
// pdfkit maneja automáticamente el ajuste de línea y la paginación. Usa la
// fuente estándar Helvetica (incluida en la librería, sin archivos externos).
// Produce el documento DEFINITIVO (sin marca de agua).
// ─────────────────────────────────────────────────────────────────────────

function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Construye el PDF del contrato ya armado con las respuestas.
 * @returns Buffer con el archivo PDF listo para descargar/guardar.
 */
export function buildContractPdf(
  contract: ContractType,
  answers: Answers,
): Promise<Buffer> {
  const clauses = assembleContract(contract, answers);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 64, bottom: 64, left: 64, right: 64 },
        info: { Title: contract.name, Author: "Resguardo" },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Título
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(contract.name.toUpperCase(), { align: "center" });
      doc.moveDown(1.5);

      // Cláusulas
      for (const clause of clauses) {
        doc.font("Helvetica-Bold").fontSize(11).text(clause.heading);
        doc.moveDown(0.3);
        doc.font("Helvetica").fontSize(11);
        for (const p of toParagraphs(clause.text)) {
          doc.text(p, { align: "justify" });
          doc.moveDown(0.5);
        }
        doc.moveDown(0.4);
      }

      // Espacio de firmas
      doc.moveDown(3);
      doc
        .font("Helvetica")
        .fontSize(11)
        .text("_______________________          _______________________", {
          align: "center",
        });

      // Pie: disclaimer + fecha
      doc.moveDown(3);
      doc
        .font("Helvetica-Oblique")
        .fontSize(8)
        .fillColor("#666666")
        .text(
          `${DISCLAIMER} Documento generado por Resguardo el ${formatDate(new Date(), "long")}.`,
          { align: "left" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
