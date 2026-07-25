import PDFDocument from "pdfkit";
import { APP_NAME } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { FullReport, NivelRiesgo } from "@/lib/ai/schemas";

// ─────────────────────────────────────────────────────────────────────────
// Informe de revisión en PDF (contenido pagado), con la estructura del spec:
// I. Síntesis · II. Anatomía · III. Análisis por cláusula · IV. Vacíos ·
// V. Legalidad · VI. Equilibrio · VII. Recomendaciones. Paleta del sistema.
// ─────────────────────────────────────────────────────────────────────────

const C = {
  ALTO: "#B3261E",
  MEDIO: "#A8730A",
  BAJO: "#1C5D99",
  ok: "#2E6B4F",
  text: "#0F2942",
  muted: "#5C7FA3",
  soft: "#7B5730",
  rule: "#C7D5E3",
  accent: "#B8894A",
  paper: "#FAF8F5",
} as const;

const RIESGO_LABEL: Record<NivelRiesgo, string> = {
  ALTO: "RIESGO ALTO",
  MEDIO: "RIESGO MEDIO",
  BAJO: "RIESGO BAJO",
};

const GLOBAL_LABEL: Record<FullReport["meta"]["riesgo_global"], string> = {
  ROJO: "RIESGO GLOBAL: ROJO",
  AMARILLO: "RIESGO GLOBAL: AMARILLO",
  VERDE: "RIESGO GLOBAL: VERDE",
};
const GLOBAL_COLOR: Record<FullReport["meta"]["riesgo_global"], string> = {
  ROJO: C.ALTO,
  AMARILLO: C.MEDIO,
  VERDE: C.ok,
};

const PRIORIDAD_COLOR: Record<string, string> = {
  Crítico: C.ALTO,
  Negociable: C.MEDIO,
  Menor: C.muted,
};

interface ReportPdfInput {
  report: FullReport;
  contractTypeName: string;
  sourceFilename?: string | null;
}

export function buildReportPdf({
  report,
  contractTypeName,
  sourceFilename,
}: ReportPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 56, bottom: 56, left: 56, right: 56 },
        info: { Title: `Informe de revisión — ${contractTypeName}`, Author: APP_NAME },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const L = doc.page.margins.left;
      const R = doc.page.width - doc.page.margins.right;
      const width = R - L;
      const bottom = doc.page.height - doc.page.margins.bottom;

      const ensure = (n: number) => {
        if (doc.y > bottom - n) doc.addPage();
      };
      const section = (roman: string, title: string) => {
        ensure(64);
        doc.moveDown(0.6);
        doc.font("Helvetica-Bold").fontSize(13).fillColor(C.text).text(`${roman}. ${title}`, L, doc.y);
        doc.moveDown(0.3);
        doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(C.rule).stroke();
        doc.moveDown(0.6);
      };
      const labeled = (label: string, value: string) => {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.text).text(label, { continued: true });
        doc.font("Helvetica").fillColor("#334155").text(` ${value}`, { align: "justify" });
        doc.moveDown(0.25);
      };

      // ── Encabezado + veredicto ──────────────────────────────────────
      doc.rect(L, doc.y, 48, 2).fill(C.accent);
      doc.y += 14;
      doc.x = L;
      doc.font("Helvetica-Bold").fontSize(20).fillColor(C.text).text("Informe de revisión de contrato");
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(C.muted)
        .text(`${contractTypeName}${sourceFilename ? ` · ${sourceFilename}` : ""}`);
      doc.text(`Perspectiva: ${report.meta.perspectiva_revision || "Neutral"}`);
      doc.text(`Generado por ${APP_NAME} el ${formatDate(new Date(), "long")}`);
      doc.moveDown(1);

      const g = report.meta.riesgo_global;
      doc.roundedRect(L, doc.y, width, 30, 4).fillAndStroke(GLOBAL_COLOR[g], GLOBAL_COLOR[g]);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text(GLOBAL_LABEL[g], L + 12, doc.y - 21);
      doc.y += 20;
      doc.x = L;
      doc.moveDown(1);

      // ── I. Síntesis y veredicto ─────────────────────────────────────
      section("I", "Síntesis y veredicto");
      doc.font("Helvetica").fontSize(10.5).fillColor(C.text).text(report.meta.veredicto_breve, { align: "justify" });
      doc.moveDown(0.5);
      labeled("Naturaleza jurídica:", report.sintesis.naturaleza_juridica);
      if (report.sintesis.partes.length > 0) {
        labeled("Partes:", report.sintesis.partes.map((p) => `${p.nombre} (${p.rol})`).join("; "));
      }
      labeled("Objeto:", report.sintesis.objeto);
      labeled("Plazo:", report.sintesis.plazo);
      labeled("Contraprestación:", report.sintesis.contraprestacion);
      doc.moveDown(0.5);

      // ── II. Anatomía ────────────────────────────────────────────────
      section("II", "Anatomía del contrato");
      labeled("Tipo y naturaleza:", report.anatomia.tipo_naturaleza_juridica);
      if (report.anatomia.obligaciones_reciprocas.length > 0) {
        doc.font("Helvetica-Bold").fontSize(9.5).fillColor(C.text).text("Obligaciones recíprocas:");
        for (const o of report.anatomia.obligaciones_reciprocas) {
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(`• ${o.parte}: ${o.obligacion}`, { indent: 10 });
        }
        doc.moveDown(0.2);
      }
      labeled("Régimen económico:", report.anatomia.regimen_economico);
      labeled("Vigencia, renovación y término:", report.anatomia.vigencia_renovacion_termino);
      labeled("Ley aplicable y controversias:", report.anatomia.ley_aplicable_y_controversias);
      doc.moveDown(0.5);

      // ── III. Análisis por cláusula ──────────────────────────────────
      section("III", `Análisis por cláusula (${report.analisis_clausulas.length})`);
      for (const [i, c] of report.analisis_clausulas.entries()) {
        ensure(120);
        const color = C[c.nivel_riesgo];
        const top = doc.y;
        doc.rect(L, top, 3, 13).fill(color);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(color).text(RIESGO_LABEL[c.nivel_riesgo], L + 10, top);
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(C.text).text(`${i + 1}. ${c.clausula}`, L, doc.y + 2);
        doc.moveDown(0.3);
        if (c.cita_textual) {
          doc.font("Helvetica-Oblique").fontSize(9).fillColor("#334155").text(`«${c.cita_textual}»`, { align: "justify", indent: 10 });
          doc.moveDown(0.2);
        }
        labeled("Qué establece:", c.que_establece);
        labeled("Por qué importa:", c.por_que_importa);
        labeled("Cómo abordarlo:", c.como_abordarlo);
        // Redacción propuesta (redline): tachado lo actual, en verde lo nuevo.
        if (c.redaccion_alternativa) {
          doc.moveDown(0.2);
          doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.ok).text("REDACCIÓN PROPUESTA");
          if (c.cita_textual) {
            doc.font("Helvetica-Oblique").fontSize(9).fillColor(C.ALTO).text(c.cita_textual, { align: "justify", indent: 10 });
          }
          doc.font("Helvetica").fontSize(9).fillColor(C.ok).text(c.redaccion_alternativa, { align: "justify", indent: 10 });
        }
        // Nota para la contraparte (justifica el cambio en la negociación).
        if (c.justificacion_contraparte) {
          doc.moveDown(0.2);
          doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.muted).text("NOTA PARA LA CONTRAPARTE");
          doc.font("Helvetica-Oblique").fontSize(9).fillColor("#334155").text(c.justificacion_contraparte, { align: "justify", indent: 10 });
        }
        doc.moveDown(0.4);
        doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(C.rule).stroke();
        doc.moveDown(0.6);
      }

      // ── IV. Vacíos ──────────────────────────────────────────────────
      if (report.vacios_contractuales.length > 0) {
        section("IV", `Vacíos contractuales (${report.vacios_contractuales.length})`);
        for (const v of report.vacios_contractuales) {
          ensure(80);
          doc.font("Helvetica-Bold").fontSize(10).fillColor(C.text).text(v.clausula_ausente);
          labeled("Efecto de la ausencia:", v.efecto_de_la_ausencia);
          labeled("Régimen supletorio:", v.regimen_supletorio);
          if (v.clausula_propuesta) {
            doc.font("Helvetica-Bold").fontSize(8.5).fillColor(C.ok).text("CLÁUSULA PROPUESTA");
            doc.font("Helvetica").fontSize(9).fillColor(C.ok).text(v.clausula_propuesta, { align: "justify", indent: 10 });
          }
          doc.moveDown(0.4);
        }
      }

      // ── V. Legalidad y validez ──────────────────────────────────────
      section("V", "Legalidad y validez");
      if (!report.legalidad_y_validez.hay_riesgos) {
        doc.font("Helvetica").fontSize(10).fillColor(C.ok).text("No se detectaron cláusulas nulas, abusivas o inoponibles ni alertas regulatorias relevantes.");
      } else {
        for (const o of report.legalidad_y_validez.observaciones) {
          ensure(60);
          doc.font("Helvetica-Bold").fontSize(10).fillColor(C.ALTO).text(o.clausula);
          doc.font("Helvetica").fontSize(9.5).fillColor("#334155").text(o.problema, { align: "justify" });
          if (o.fundamento_normativo) doc.font("Helvetica").fontSize(8.5).fillColor(C.muted).text(o.fundamento_normativo);
          doc.moveDown(0.4);
        }
      }
      doc.moveDown(0.3);

      // ── VI. Equilibrio ──────────────────────────────────────────────
      section("VI", "Equilibrio contractual");
      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(report.equilibrio_contractual.hay_asimetria_relevante ? C.MEDIO : C.ok)
        .text(report.equilibrio_contractual.hay_asimetria_relevante ? "Hay asimetría relevante" : "Sin asimetría jurídicamente relevante");
      doc.font("Helvetica").fontSize(10).fillColor("#334155").text(report.equilibrio_contractual.descripcion, { align: "justify" });
      doc.moveDown(0.4);

      // ── VII. Recomendaciones ────────────────────────────────────────
      section("VII", "Recomendaciones");
      for (const [i, r] of report.recomendaciones.entries()) {
        ensure(40);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(PRIORIDAD_COLOR[r.prioridad] ?? C.text).text(`${i + 1}. [${r.prioridad}] `, L, doc.y, { continued: true });
        doc.font("Helvetica").fillColor("#334155").text(r.descripcion, { continued: Boolean(r.clausula_relacionada) });
        if (r.clausula_relacionada) doc.font("Helvetica-Oblique").fillColor(C.muted).text(` (${r.clausula_relacionada})`);
        doc.moveDown(0.35);
      }

      // ── Cierre ──────────────────────────────────────────────────────
      doc.moveDown(1.2);
      ensure(50);
      doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(C.rule).stroke();
      doc.moveDown(0.6);
      doc.font("Helvetica-Oblique").fontSize(8).fillColor(C.muted).text(report.cierre, { align: "left" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
