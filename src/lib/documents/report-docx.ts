import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  InsertedTextRun,
  DeletedTextRun,
  CommentRangeStart,
  CommentRangeEnd,
  CommentReference,
  AlignmentType,
  HeadingLevel,
} from "docx";
import { APP_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { FullReport } from "@/lib/ai/schemas";

// ─────────────────────────────────────────────────────────────────────────
// Word anotado con REDLINE (control de cambios) para negociar con la contraparte.
//
// Tres tipos de marcas:
//  1. Cláusula con redacción alternativa → tacha el original (w:del) e inserta
//     el propuesto (w:ins), con un comentario que JUSTIFICA el cambio a la
//     contraparte (tono negociador).
//  2. Cláusula ausente (vacío) → inserta la cláusula nueva propuesta (w:ins)
//     al final del documento, con su comentario de justificación.
//  3. Observación de legalidad → comentario simple (sin redline).
//
// Se reconstruye desde el texto extraído (sourceText).
// ─────────────────────────────────────────────────────────────────────────

type Run = TextRun | InsertedTextRun | DeletedTextRun | CommentRangeStart | CommentRangeEnd;

interface AnnotatedDocxInput {
  sourceText: string;
  report: FullReport;
  contractTypeName: string;
}

interface Anchor {
  commentId: number;
  paraIndex: number;
  start: number;
  end: number;
  replacement?: string; // si está, es redline
}

interface CommentDef {
  id: number;
  author: string;
  date: Date;
  children: Paragraph[];
}

const AUTHOR = APP_NAME;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function tolerantRegex(fragment: string): RegExp {
  const norm = fragment.trim().replace(/\s+/g, " ");
  return new RegExp(escapeRegex(norm).replace(/ /g, "\\s+"), "i");
}
function findSpan(full: string, citation: string, minChars = 20): { start: number; end: number } | null {
  const frags = citation
    .split(/\[\s*\.\.\.\s*\]|\.\.\./g)
    .map((f) => f.trim())
    .filter((f) => f.replace(/\s+/g, "").length >= minChars);
  if (frags.length === 0) return null;
  const first = tolerantRegex(frags[0]).exec(full);
  if (!first) return null;
  let end = first.index + first[0].length;
  if (frags.length > 1) {
    const last = tolerantRegex(frags[frags.length - 1]).exec(full.slice(first.index));
    if (last) end = first.index + last.index + last[0].length;
  }
  return { start: first.index, end };
}

/** Comentario dirigido a la contraparte (justifica el cambio). */
function comentarioContraparte(texto: string): Paragraph[] {
  return [new Paragraph({ children: [new TextRun(texto)] })];
}

/** Comentario de una observación de legalidad. */
function comentarioLegalidad(problema: string, fundamento: string): Paragraph[] {
  const paras = [new Paragraph({ children: [new TextRun(problema)] })];
  if (fundamento) {
    paras.push(new Paragraph({ children: [new TextRun({ text: "Fundamento: ", bold: true }), new TextRun(fundamento)] }));
  }
  return paras;
}

export async function buildAnnotatedDocx({
  sourceText,
  report,
  contractTypeName,
}: AnnotatedDocxInput): Promise<Buffer> {
  const paragraphs = sourceText.split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const full = paragraphs.join("\n");
  const paraOffsets: { start: number; end: number }[] = [];
  {
    let g = 0;
    for (const p of paragraphs) {
      paraOffsets.push({ start: g, end: g + p.length });
      g += p.length + 1;
    }
  }

  const commentDefs: CommentDef[] = [];
  const anchors: Anchor[] = [];
  let nextCommentId = 0;

  // ── Anotaciones sobre cláusulas existentes ──────────────────────────────
  const inlineItems = [
    ...report.analisis_clausulas.map((c) => ({
      cita: c.cita_textual,
      fallback: c.clausula,
      replacement: c.redaccion_alternativa,
      // El comentario para la contraparte; si falta, cae al "cómo abordarlo".
      commentText: c.justificacion_contraparte?.trim() || c.como_abordarlo,
      author: AUTHOR,
      legalidad: null as null | { problema: string; fundamento: string },
    })),
    ...report.legalidad_y_validez.observaciones.map((o) => ({
      cita: "",
      fallback: o.clausula,
      replacement: "",
      commentText: "",
      author: `${AUTHOR} · Legalidad`,
      legalidad: { problema: o.problema, fundamento: o.fundamento_normativo },
    })),
  ];

  for (const item of inlineItems) {
    let span = item.cita ? findSpan(full, item.cita) : null;
    let esRedline = false;
    if (span && item.replacement.trim()) esRedline = true;
    if (!span && item.fallback) span = findSpan(full, item.fallback, 6);
    if (!span) continue;

    const pi = paraOffsets.findIndex((o) => span!.start >= o.start && span!.start < o.end);
    if (pi === -1) continue;
    const localStart = span.start - paraOffsets[pi].start;
    const localEnd = Math.min(span.end - paraOffsets[pi].start, paragraphs[pi].length);

    const id = nextCommentId++;
    anchors.push({
      commentId: id,
      paraIndex: pi,
      start: localStart,
      end: localEnd > localStart ? localEnd : paragraphs[pi].length,
      replacement: esRedline ? item.replacement : undefined,
    });
    commentDefs.push({
      id,
      author: item.author,
      date: new Date(),
      children: item.legalidad
        ? comentarioLegalidad(item.legalidad.problema, item.legalidad.fundamento)
        : comentarioContraparte(item.commentText),
    });
  }

  const byPara = new Map<number, Anchor[]>();
  for (const a of anchors) {
    const list = byPara.get(a.paraIndex) ?? [];
    list.push(a);
    byPara.set(a.paraIndex, list);
  }

  const nowIso = new Date().toISOString();
  let revId = 1000;
  const insRun = (text: string) => new InsertedTextRun({ text, id: revId++, date: nowIso, author: AUTHOR });

  // ── Cuerpo del documento ────────────────────────────────────────────────
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: contractTypeName.toUpperCase(), bold: true, size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `Documento con propuesta de redacción. Los cambios van marcados como control de cambios; cada comentario explica el porqué a la contraparte.`,
          italics: true,
          size: 18,
          color: "666666",
        }),
      ],
    }),
  ];

  paragraphs.forEach((text, pi) => {
    const paraAnchors = (byPara.get(pi) ?? []).sort((a, b) => a.start - b.start);
    if (paraAnchors.length === 0) {
      children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children: [new TextRun(text)] }));
      return;
    }
    const runs: Run[] = [];
    let cursor = 0;
    for (const a of paraAnchors) {
      if (a.start < cursor || a.end <= a.start) continue;
      if (a.start > cursor) runs.push(new TextRun(text.slice(cursor, a.start)));
      const original = text.slice(a.start, a.end);
      runs.push(new CommentRangeStart(a.commentId));
      if (a.replacement !== undefined) {
        runs.push(new DeletedTextRun({ text: original, id: revId++, date: nowIso, author: AUTHOR }));
        runs.push(insRun(a.replacement));
      } else {
        runs.push(new TextRun(original));
      }
      runs.push(new CommentRangeEnd(a.commentId));
      runs.push(new TextRun({ children: [new CommentReference(a.commentId)] }));
      cursor = a.end;
    }
    if (cursor < text.length) runs.push(new TextRun(text.slice(cursor)));
    children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120 }, children: runs }));
  });

  // ── Cláusulas nuevas propuestas (vacíos) como inserciones ───────────────
  const propuestas = report.vacios_contractuales.filter((v) => v.clausula_propuesta.trim());
  if (propuestas.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: "Cláusulas propuestas para incorporar (adiciones):",
            italics: true,
            bold: true,
            size: 18,
            color: "666666",
          }),
        ],
      }),
    );
    for (const v of propuestas) {
      const id = nextCommentId++;
      commentDefs.push({
        id,
        author: AUTHOR,
        date: new Date(),
        children: comentarioContraparte(v.justificacion_contraparte?.trim() || v.efecto_de_la_ausencia),
      });
      // Párrafo íntegramente insertado (w:ins) + comentario de justificación.
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120 },
          children: [
            new CommentRangeStart(id),
            insRun(v.clausula_propuesta),
            new CommentRangeEnd(id),
            new TextRun({ children: [new CommentReference(id)] }),
          ],
        }),
      );
    }
  }

  children.push(
    new Paragraph({ spacing: { before: 360 }, children: [] }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${report.cierre} Generado por ${APP_NAME} el ${formatDate(new Date(), "long")}.`,
          italics: true,
          size: 16,
          color: "666666",
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: APP_NAME,
    title: `Contrato con propuesta — ${contractTypeName}`,
    comments: { children: commentDefs },
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}
