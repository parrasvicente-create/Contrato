/**
 * Autoprueba de la generación de documentos (Etapa 2).
 * Ejecuta:  npm run docs:check
 *
 * Genera .docx y .pdf reales para cada tipo de contrato con datos de ejemplo,
 * los escribe a disco y valida su integridad:
 *   - .docx debe empezar con "PK" (es un ZIP)
 *   - .pdf  debe empezar con "%PDF"
 *   - ambos deben tener un tamaño razonable (> 1 KB)
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { contractTypes } from "../src/lib/knowledge-base";
import type { Answers } from "../src/lib/knowledge-base";
import {
  buildContractDocx,
  buildContractPdf,
  contractFilename,
} from "../src/lib/documents";

const samples: Record<string, Answers> = {
  "arriendo-vivienda": {
    arrendador_nombre: "María Elena Soto Fuentes",
    arrendador_rut: "12.345.678-5",
    arrendador_domicilio: "Av. Providencia 1234, depto 56, Providencia, Santiago",
    arrendatario_nombre: "Juan Andrés Pérez Rojas",
    arrendatario_rut: "9.876.543-3",
    arrendatario_domicilio: "Calle Los Olmos 789, Ñuñoa, Santiago",
    inmueble_direccion: "Av. Irarrázaval 4560, depto 302, Ñuñoa, Santiago",
    inmueble_rol: "1234-56",
    inmueble_amoblado: true,
    renta_mensual: 450000,
    dia_pago: 5,
    garantia_meses: 2,
    fecha_inicio: "2026-08-01",
    plazo_meses: 12,
    renovacion_automatica: true,
    incluye_reajuste: true,
    reajuste_indice: "UF",
    prohibe_subarriendo: true,
    permite_mascotas: false,
  },
  "prestacion-servicios": {
    prestador_nombre: "Camila Rojas Vega",
    prestador_rut: "15.678.901-1",
    prestador_domicilio: "Calle Manuel Montt 234, Providencia, Santiago",
    prestador_profesion: "Diseñadora gráfica",
    cliente_nombre: "Comercializadora Andes SpA",
    cliente_rut: "76.123.456-0",
    cliente_domicilio: "Av. Apoquindo 5500, of 802, Las Condes, Santiago",
    servicios_descripcion:
      "Diseño de identidad visual: logotipo, paleta de colores y manual de marca, en dos rondas de revisión.",
    entregables: "Archivos en formato .ai, .png y .pdf; manual de marca en PDF.",
    lugar_prestacion: "remoto",
    modalidad_pago: "por_proyecto",
    honorario_monto: 1200000,
    emite_boleta: true,
    fecha_inicio: "2026-08-15",
    tiene_plazo_fijo: true,
    fecha_termino: "2026-10-15",
    preaviso_dias: 30,
    incluye_confidencialidad: true,
    incluye_propiedad_intelectual: true,
    exige_exclusividad: false,
  },
};

const outDir = join(process.cwd(), "storage", "test-output");
mkdirSync(outDir, { recursive: true });

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

async function main() {
  for (const contract of contractTypes) {
    console.log(`\n▶ ${contract.name}`);
    const answers = samples[contract.id];

    // DOCX
    const docx = await buildContractDocx(contract, answers);
    const docxName = contractFilename(contract.name, "docx");
    writeFileSync(join(outDir, docxName), docx);
    check(docx.subarray(0, 2).toString("latin1") === "PK", `.docx válido (firma ZIP) — ${docx.length} bytes`);
    check(docx.length > 1024, ".docx tiene tamaño razonable (> 1 KB)");

    // PDF
    const pdf = await buildContractPdf(contract, answers);
    const pdfName = contractFilename(contract.name, "pdf");
    writeFileSync(join(outDir, pdfName), pdf);
    check(pdf.subarray(0, 4).toString("latin1") === "%PDF", `.pdf válido (firma %PDF) — ${pdf.length} bytes`);
    check(pdf.length > 1024, ".pdf tiene tamaño razonable (> 1 KB)");

    console.log(`  → ${join("storage", "test-output", docxName)}`);
    console.log(`  → ${join("storage", "test-output", pdfName)}`);
  }

  console.log(
    `\n${failures === 0 ? "✅ Documentos generados correctamente" : `❌ ${failures} verificación(es) fallaron`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
