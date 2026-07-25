import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type { ContractType } from "@/lib/knowledge-base";
import { assembleContract, type Answers } from "@/lib/knowledge-base";
import { DISCLAIMER } from "@/lib/constants";
import { formatDate } from "@/lib/format";

// ─────────────────────────────────────────────────────────────────────────
// Generación del contrato en formato Word (.docx).
//
// Produce el documento DEFINITIVO (sin marca de agua). La marca de agua
// "VISTA PREVIA" solo existe en la previsualización en pantalla.
// ─────────────────────────────────────────────────────────────────────────

/** Divide el texto de una cláusula en párrafos (por saltos de línea). */
function toParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/**
 * Construye el .docx del contrato ya armado con las respuestas.
 * @returns Buffer con el archivo Word listo para descargar/guardar.
 */
export async function buildContractDocx(
  contract: ContractType,
  answers: Answers,
): Promise<Buffer> {
  const clauses = assembleContract(contract, answers);

  const children: Paragraph[] = [];

  // Título
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({ text: contract.name.toUpperCase(), bold: true, size: 32 }),
      ],
    }),
  );

  // Cláusulas
  for (const clause of clauses) {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: clause.heading, bold: true })],
      }),
    );
    for (const p of toParagraphs(clause.text)) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: [new TextRun({ text: p })],
        }),
      );
    }
  }

  // Espacio para firmas
  children.push(
    new Paragraph({ spacing: { before: 600 }, text: "" }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "_______________________          _______________________" }),
      ],
    }),
  );

  // Pie: disclaimer + fecha de generación
  children.push(
    new Paragraph({ spacing: { before: 480 }, text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${DISCLAIMER} Documento generado por Resguardo el ${formatDate(new Date(), "long")}.`,
          italics: true,
          size: 16,
          color: "666666",
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "Resguardo",
    title: contract.name,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 }, // 11pt
        },
      },
    },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
