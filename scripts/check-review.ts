/**
 * Autoprueba del módulo revisor (Etapa 4).
 * Ejecuta:  npm run review:check
 *
 * Prueba de ida y vuelta: toma los documentos que genera el módulo GENERADOR
 * (npm run docs:check), los pasa por el extractor de texto y verifica que el
 * detector de tipo reconozca de qué contrato se trata.
 *
 * No requiere ANTHROPIC_API_KEY: prueba la extracción y la detección
 * heurística de respaldo, que es la que funciona sin IA.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { extractText, ExtractionError, normalizeText } from "../src/lib/extraction";
import { classifyByKeywords } from "../src/lib/ai/detect";

const outDir = join(process.cwd(), "storage", "test-output");

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

/** Casos: archivo generado en la Etapa 2 → tipo que debe detectarse. */
const cases = [
  {
    file: "contrato-arriendo-de-vivienda.docx",
    expect: "arrendamiento",
    contains: ["Arrendador", "Arrendatario", "450.000"],
  },
  {
    file: "contrato-arriendo-de-vivienda.pdf",
    expect: "arrendamiento",
    contains: ["Arrendador", "Irarrázaval"],
  },
  {
    file: "contrato-prestacion-de-servicios-profesionales.docx",
    expect: "prestacion_servicios",
    contains: ["Prestador", "honorarios"],
  },
  {
    file: "contrato-prestacion-de-servicios-profesionales.pdf",
    expect: "prestacion_servicios",
    contains: ["Prestador", "subordinación"],
  },
];

async function main() {
  if (!existsSync(outDir)) {
    console.error(
      "No hay documentos de prueba. Ejecuta primero: npm run docs:check",
    );
    process.exit(1);
  }

  for (const c of cases) {
    console.log(`\n▶ ${c.file}`);
    const path = join(outDir, c.file);
    if (!existsSync(path)) {
      check(false, `existe el archivo (ejecuta 'npm run docs:check' primero)`);
      continue;
    }

    const buffer = readFileSync(path);
    const extracted = await extractText(buffer, c.file);

    check(
      extracted.text.length > 200,
      `texto extraído (${extracted.characters} caracteres, formato ${extracted.format}${extracted.pages ? `, ${extracted.pages} págs` : ""})`,
    );

    // El texto extraído debe conservar el contenido real del contrato.
    const flat = extracted.text.replace(/\s+/g, " ");
    for (const needle of c.contains) {
      check(flat.includes(needle), `conserva el contenido: "${needle}"`);
    }

    // Clasificación (heurística de respaldo, sin IA).
    const detection = classifyByKeywords(extracted.text);
    check(
      detection.tipo_contrato === c.expect,
      `clasifica correctamente: ${detection.tipo_contrato} (esperado ${c.expect}) — confianza ${detection.confianza}`,
    );
  }

  // ── Casos de error ────────────────────────────────────────────────────
  console.log("\n▶ Manejo de errores");

  // Formato no soportado
  try {
    await extractText(Buffer.from("contenido"), "imagen.jpg", "image/jpeg");
    check(false, "rechaza formato no soportado");
  } catch (e) {
    check(
      e instanceof ExtractionError && e.code === "UNSUPPORTED_FORMAT",
      "rechaza formato no soportado (.jpg)",
    );
  }

  // Archivo demasiado grande
  try {
    await extractText(Buffer.alloc(11 * 1024 * 1024), "grande.pdf");
    check(false, "rechaza archivo > 10 MB");
  } catch (e) {
    check(
      e instanceof ExtractionError && e.code === "TOO_LARGE",
      "rechaza archivo mayor a 10 MB",
    );
  }

  // Documento sin texto (simula un PDF escaneado)
  try {
    await extractText(Buffer.from("hola"), "vacio.txt");
    check(false, "rechaza documento sin texto");
  } catch (e) {
    check(
      e instanceof ExtractionError && e.code === "EMPTY_TEXT",
      "rechaza documento sin texto suficiente (caso PDF escaneado)",
    );
  }

  // ── Texto pegado y contrato desconocido ───────────────────────────────
  console.log("\n▶ Texto pegado y contrato desconocido");

  const textoPegado = normalizeText(`
    CONTRATO   DE  ARRENDAMIENTO

    El   arrendador  entrega  al  arrendatario   el inmueble,
    por  una  renta mensual  de $500.000.


    El arrendatario no podrá subarrendar.
  `);
  check(
    !textoPegado.includes("  ") && !textoPegado.includes("\n\n\n"),
    "normaliza espacios y saltos de línea del texto pegado",
  );
  check(
    classifyByKeywords(textoPegado).tipo_contrato === "arrendamiento",
    "clasifica desde texto pegado",
  );

  const compraventa =
    "CONTRATO DE COMPRAVENTA DE VEHÍCULO MOTORIZADO. El vendedor transfiere el dominio del automóvil marca X al comprador, quien paga el precio de venta convenido al contado, con saneamiento de la evicción.";
  check(
    classifyByKeywords(compraventa).tipo_contrato === "compraventa",
    "clasifica una compraventa (categoría nueva del spec)",
  );

  const atipico =
    "CONTRATO DE MANDATO. El mandante confiere poder al mandatario para administrar sus bienes y representarlo ante terceros, rindiendo cuenta de su gestión.";
  check(
    classifyByKeywords(atipico).tipo_contrato === "otro",
    "un contrato atípico cae a 'otro' (no fuerza un tipo equivocado)",
  );

  console.log(
    `\n${failures === 0 ? "✅ Módulo revisor OK" : `❌ ${failures} verificación(es) fallaron`}`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
