/**
 * Autoprueba de la base de conocimiento (Etapa 1).
 *
 * Ejecuta:  npm run kb:check
 *
 * Recorre cada tipo de contrato con datos de ejemplo realistas y verifica:
 *   1. Que el RUT de ejemplo sea válido (algoritmo módulo 11).
 *   2. Que las respuestas pasen el validador zod construido desde el cuestionario.
 *   3. Que el ensamblado aplique correctamente las cláusulas condicionales.
 *   4. Que no queden placeholders sin reemplazar.
 *   5. Que las reglas de riesgo estén bien formadas.
 *
 * No requiere base de datos ni red: solo prueba el motor puro.
 */
import { contractTypes } from "../src/lib/knowledge-base";
import {
  assembleContract,
  buildAnswersSchema,
  evalCondition,
  type Answers,
} from "../src/lib/knowledge-base/engine";
import { isValidRut } from "../src/lib/rut";
import { formatDate } from "../src/lib/format";

// Datos de ejemplo realistas por tipo de contrato.
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
    garantia_meses: 2, // dispara la regla "garantía superior a un mes"
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

let failures = 0;
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? "✓" : "✗"} ${msg}`);
  if (!ok) failures++;
};

for (const contract of contractTypes) {
  console.log(`\n▶ ${contract.name}  (${contract.id})`);
  const answers = samples[contract.id];

  if (!answers) {
    check(false, "hay datos de ejemplo para este contrato");
    continue;
  }

  // 1. RUTs válidos
  const rutFields = Object.keys(answers).filter((k) => k.endsWith("_rut"));
  for (const f of rutFields) {
    check(isValidRut(String(answers[f])), `RUT válido en ${f}: ${answers[f]}`);
  }

  // 2. Validación zod
  const schema = buildAnswersSchema(contract);
  const result = schema.safeParse(answers);
  check(result.success, "las respuestas pasan la validación zod");
  if (!result.success) {
    console.log("    → errores:", JSON.stringify(result.error.format(), null, 2));
  }

  // 3. Ensamblado + condiciones
  const clauses = assembleContract(contract, answers);
  check(clauses.length > 0, `se ensamblaron cláusulas (${clauses.length})`);

  // Verificación puntual de condiciones esperadas
  const ids = new Set(clauses.map((c) => c.id));
  if (contract.id === "arriendo-vivienda") {
    check(ids.has("inmueble-amoblado"), "cláusula de mobiliario incluida (amoblado = sí)");
    check(ids.has("reajuste"), "cláusula de reajuste incluida (incluye_reajuste = sí)");
    check(!ids.has("mascotas"), "cláusula de mascotas OMITIDA (permite_mascotas = no)");
  }
  if (contract.id === "prestacion-servicios") {
    check(ids.has("confidencialidad"), "cláusula de confidencialidad incluida");
    check(!ids.has("exclusividad"), "cláusula de exclusividad OMITIDA (exige_exclusividad = no)");
    check(ids.has("plazo-fijo"), "cláusula de plazo de término incluida (tiene_plazo_fijo = sí)");
  }

  // 4. Sin placeholders huérfanos
  const orphan = clauses.find((c) => /\{\{.*?\}\}/.test(c.text) || /\{\{.*?\}\}/.test(c.heading));
  check(!orphan, "ningún placeholder quedó sin reemplazar");
  if (orphan) console.log(`    → en cláusula "${orphan.id}": ${orphan.text}`);

  // 5. Reglas de riesgo bien formadas
  const validSeverities = new Set(["CRITICO", "ADVERTENCIA", "SUGERENCIA"]);
  const badRule = contract.riskRules.find(
    (r) => !validSeverities.has(r.severity) || !r.explanation || !r.usualInChile || !r.detectionGuidance,
  );
  check(!badRule, `${contract.riskRules.length} reglas de riesgo bien formadas`);

  // Muestra la primera cláusula ensamblada como ejemplo visual
  console.log(`\n    Ejemplo — ${clauses[1]?.heading}:`);
  console.log(`    ${clauses[1]?.text.slice(0, 220)}...`);
}

// Formato de fechas: regresión del bug de zona horaria.
// "2026-08-01" debe mostrarse como 1 de agosto, NO como 31 de julio.
console.log("\n▶ Formato de fechas (regresión zona horaria)");
check(
  formatDate("2026-08-01", "long") === "1 de agosto de 2026",
  `"2026-08-01" → "${formatDate("2026-08-01", "long")}" (debe ser 1 de agosto)`,
);
check(
  formatDate("2026-01-01", "short") === "01-01-2026",
  `"2026-01-01" → "${formatDate("2026-01-01", "short")}" (debe ser 01-01-2026)`,
);

// Verificación adicional del evaluador de condiciones
console.log("\n▶ Evaluador de condiciones");
check(
  evalCondition({ field: "x", op: "gt", value: 1 }, { x: 2 }),
  "gt: 2 > 1 es verdadero",
);
check(
  !evalCondition({ all: [{ field: "a", op: "truthy" }, { field: "b", op: "truthy" }] }, { a: true, b: false }),
  "all: falla si un término es falso",
);

console.log(
  `\n${failures === 0 ? "✅ Todo OK" : `❌ ${failures} verificación(es) fallaron`}`,
);
process.exit(failures === 0 ? 0 : 1);
