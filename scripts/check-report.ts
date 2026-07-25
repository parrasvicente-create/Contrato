/**
 * Autoprueba del informe completo (esquema del spec).
 * Ejecuta:  npm run report:check
 *
 * Verifica, sin depender de la IA:
 *   1. Anclaje de citas (citationExists).
 *   2. Generación del informe en PDF y del Word anotado (comentarios reales).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { citationExists } from "../src/lib/ai/analyze";
import { buildReportPdf } from "../src/lib/documents/report-pdf";
import { buildAnnotatedDocx } from "../src/lib/documents";
import type { FullReport } from "../src/lib/ai/schemas";

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

const sourceText = `CONTRATO DE ARRENDAMIENTO DE VIVIENDA

CUARTO: De la garantía. La Arrendataria entrega en este acto al Arrendador una garantía equivalente a TRES meses de renta, esto es, la suma de $1.350.000.

QUINTO: De las reparaciones. Serán de cargo exclusivo de la Arrendataria todas las reparaciones que requiera el inmueble durante la vigencia del contrato.`;

console.log("\n▶ Anclaje de citas");
check(
  citationExists("garantía equivalente a TRES meses de renta", sourceText),
  "acepta una cita textual exacta",
);
check(
  !citationExists("El Arrendador contratará un seguro contra todo riesgo", sourceText),
  "rechaza una cita inventada",
);

const report: FullReport = {
  meta: {
    tipo_contrato: "arrendamiento",
    perspectiva_revision: "Arrendataria",
    riesgo_global: "ROJO",
    veredicto_breve:
      "Contrato de arriendo con cláusulas gravosas para la arrendataria: garantía de tres meses y traslado de reparaciones estructurales.",
  },
  sintesis: {
    naturaleza_juridica: "Arrendamiento de predio urbano (Ley N° 18.101).",
    partes: [
      { nombre: "Jorge Muñoz", rol: "Arrendador" },
      { nombre: "Carolina Fernández", rol: "Arrendataria" },
    ],
    objeto: "Arriendo de departamento en Ñuñoa.",
    plazo: "12 meses.",
    contraprestacion: "Renta mensual de $450.000.",
  },
  anatomia: {
    tipo_naturaleza_juridica: "Contrato bilateral, oneroso, de tracto sucesivo.",
    obligaciones_reciprocas: [
      { parte: "Arrendador", obligacion: "Entregar el inmueble." },
      { parte: "Arrendataria", obligacion: "Pagar la renta." },
    ],
    regimen_economico: "Renta de $450.000; garantía de $1.350.000.",
    vigencia_renovacion_termino: "12 meses; sin cláusula de renovación.",
    ley_aplicable_y_controversias: "No especificado; supletoriamente Ley N° 18.101.",
  },
  analisis_clausulas: [
    {
      clausula: "QUINTO: De las reparaciones",
      nivel_riesgo: "ALTO",
      que_establece: "Traslada todas las reparaciones a la arrendataria.",
      por_que_importa: "Contraviene el régimen del Código Civil; puede ser abusiva.",
      como_abordarlo: "Limitar a reparaciones locativas conforme al Código Civil.",
      cita_textual:
        "Serán de cargo exclusivo de la Arrendataria todas las reparaciones que requiera el inmueble",
      redaccion_alternativa:
        "Serán de cargo de la Arrendataria únicamente las reparaciones locativas; las necesarias y estructurales corresponden al Arrendador",
      justificacion_contraparte:
        "Proponemos ajustar la distribución de reparaciones al estándar del Código Civil: el arrendatario asume las locativas y el arrendador las estructurales. Es la práctica habitual del mercado y evita futuros conflictos.",
    },
    {
      clausula: "CUARTO: De la garantía",
      nivel_riesgo: "MEDIO",
      que_establece: "Garantía de tres meses de renta.",
      por_que_importa: "Supera lo usual (un mes); inmoviliza capital.",
      como_abordarlo: "Reducir a un mes y fijar plazo de devolución.",
      cita_textual: "garantía equivalente a TRES meses de renta, esto es, la suma de $1.350.000",
      redaccion_alternativa:
        "garantía equivalente a un mes de renta, esto es, la suma de $450.000, restituible dentro de [30] días de restituido el inmueble",
      justificacion_contraparte:
        "Sugerimos ajustar la garantía a un mes de renta, que es el estándar de mercado, y fijar un plazo de devolución para dar certeza a ambas partes.",
    },
  ],
  vacios_contractuales: [
    {
      clausula_ausente: "Reajuste de la renta",
      efecto_de_la_ausencia: "La renta queda nominalmente fija.",
      regimen_supletorio: "No hay reajuste salvo pacto expreso.",
      clausula_propuesta:
        "DÉCIMO: Del reajuste. La renta se reajustará anualmente según la variación del IPC del período respectivo.",
      justificacion_contraparte:
        "Proponemos incorporar un reajuste anual por IPC para mantener el valor real de la renta, en beneficio de ambas partes.",
    },
  ],
  legalidad_y_validez: {
    hay_riesgos: true,
    observaciones: [
      {
        clausula: "QUINTO: De las reparaciones",
        problema: "Traslado íntegro de reparaciones podría considerarse abusivo.",
        fundamento_normativo: "Código Civil, arts. 1927 y 1940.",
      },
    ],
  },
  equilibrio_contractual: {
    hay_asimetria_relevante: true,
    descripcion: "El contrato concentra cargas en la arrendataria.",
  },
  recomendaciones: [
    { prioridad: "Crítico", descripcion: "Eliminar el traslado de reparaciones estructurales.", clausula_relacionada: "QUINTO" },
    { prioridad: "Negociable", descripcion: "Reducir la garantía a un mes.", clausula_relacionada: "CUARTO" },
    { prioridad: "Menor", descripcion: "Agregar cláusula de reajuste.", clausula_relacionada: "TERCERO" },
  ],
  cierre: "Este informe constituye un análisis automatizado y no reemplaza la asesoría de un abogado habilitado.",
};

async function main() {
  const outDir = join(process.cwd(), "storage", "test-output");
  mkdirSync(outDir, { recursive: true });

  console.log("\n▶ Informe en PDF");
  const pdf = await buildReportPdf({ report, contractTypeName: "Arrendamiento", sourceFilename: "contrato-malo.txt" });
  writeFileSync(join(outDir, "informe-de-prueba.pdf"), pdf);
  check(pdf.subarray(0, 4).toString("latin1") === "%PDF", `.pdf válido (firma %PDF) — ${pdf.length} bytes`);
  check(pdf.length > 3000, "el informe tiene contenido sustancial (> 3 KB)");

  console.log("\n▶ Word anotado con redline + comentarios reales");
  const docx = await buildAnnotatedDocx({ report, sourceText, contractTypeName: "Arrendamiento" });
  writeFileSync(join(outDir, "contrato-anotado.docx"), docx);
  check(docx.subarray(0, 2).toString("latin1") === "PK", `.docx válido (firma ZIP) — ${docx.length} bytes`);
  check(docx.length > 3000, "el Word anotado tiene contenido sustancial");
  console.log(`  → storage/test-output/  (informe-de-prueba.pdf, contrato-anotado.docx)`);
  console.log("    (el control de cambios w:ins/w:del se verifica descomprimiendo el .docx)");

  console.log(`\n${failures === 0 ? "✅ Informe OK" : `❌ ${failures} verificación(es) fallaron`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
