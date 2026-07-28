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
  checkHardRules,
  evalCondition,
  validateAnswers,
  type Answers,
} from "../src/lib/knowledge-base/engine";
import { isValidRut } from "../src/lib/rut";
import { formatDate } from "../src/lib/format";

// Datos de ejemplo realistas por tipo de contrato.
const samples: Record<string, Answers> = {
  "arriendo-vivienda": {
    contrato_ciudad: "Santiago",
    contrato_fecha: "2026-08-01",
    arrendador_naturaleza: "natural",
    arrendador_nombre: "María Elena Soto Fuentes",
    arrendador_nacionalidad: "chilena",
    arrendador_rut: "12.345.678-5",
    arrendador_domicilio: "Av. Providencia 1234, depto 56",
    arrendador_comuna: "Providencia",
    arrendador_email: "maria@correo.cl",
    arrendatario_naturaleza: "natural",
    arrendatario_nombre: "Juan Andrés Pérez Rojas",
    arrendatario_nacionalidad: "chilena",
    arrendatario_rut: "9.876.543-3",
    arrendatario_domicilio: "Calle Los Olmos 789",
    arrendatario_comuna: "Ñuñoa",
    arrendatario_email: "juan@correo.cl",
    titulo_calidad: "dueno",
    titulo_modo_adquisicion: "compraventa",
    titulo_fojas: "12345",
    titulo_numero: "6789",
    titulo_anio: "2019",
    titulo_conservador: "Santiago",
    aval_existe: true,
    aval_nombre: "Ana Díaz Soto",
    aval_rut: "11.111.111-1",
    aval_nacionalidad: "chilena",
    aval_domicilio: "Calle El Roble 12",
    inmueble_tipo: "departamento",
    inmueble_direccion: "Av. Irarrázaval 4560",
    inmueble_numero_unidad: "302",
    inmueble_comuna: "Ñuñoa",
    inmueble_region: "Región Metropolitana",
    inmueble_rol_sii: "1234-56",
    inmueble_en_copropiedad: true,
    inmueble_amoblado: true,
    destino_uso: "habitacional",
    plazo_modalidad: "fijo_renovable",
    plazo_fecha_inicio: "2026-08-01",
    plazo_duracion_meses: 12,
    plazo_fecha_termino: "2027-07-31",
    plazo_periodo_renovacion_meses: 12,
    plazo_aviso_no_renovacion_dias: 60,
    renta_moneda: "CLP",
    renta_monto_clp: 450000,
    renta_dia_pago: 5,
    renta_medio_pago: "transferencia electrónica",
    renta_cuenta_banco: "Banco de Chile",
    renta_cuenta_tipo: "corriente",
    renta_cuenta_numero: "00012345678",
    renta_cuenta_titular: "María Elena Soto Fuentes",
    renta_cuenta_rut: "12.345.678-5",
    renta_reajuste_aplica: true,
    renta_reajuste_frecuencia: "anual",
    renta_mora_interes: "corriente",
    garantia_aplica: true,
    garantia_rentas: 1,
    garantia_plazo_restitucion_dias: 30,
    gastos_comunes: "Arrendatario",
    gastos_contribuciones: "Arrendador",
    uso_subarriendo: "prohibido",
    uso_mascotas: "permitidas_con_condiciones",
    uso_mascotas_condiciones: "un perro de raza pequeña",
    uso_fumar: "prohibido",
    inspeccion_aviso_horas: 48,
    terminacion_aviso_previo_dias: 60,
    terminacion_multa_rentas: 1,
    restitucion_recargo_pct: 50,
    entrega_hay_acta: true,
    entrega_fecha: "2026-08-01",
    entrega_llaves: 2,
    firma_modalidad: "notarial",
    firma_ejemplares: 3,
  },
  "prestacion-servicios": {
    contrato_ciudad: "Santiago",
    contrato_fecha: "2026-08-15",
    prestador_naturaleza: "persona_natural",
    prestador_nombre: "Camila Rojas Vega",
    prestador_nacionalidad: "chilena",
    prestador_profesion: "Diseñadora gráfica",
    prestador_rut: "15.678.901-1",
    prestador_domicilio: "Calle Manuel Montt 234",
    prestador_comuna: "Providencia",
    prestador_email: "camila@correo.cl",
    prestador_no_exclusivo: true,
    cliente_naturaleza: "juridica",
    cliente_razon_social: "Comercializadora Andes SpA",
    cliente_giro: "comercio",
    cliente_rep_nombre: "Pedro Ruiz",
    cliente_rep_rut: "12.345.678-5",
    cliente_rut: "76.123.456-0",
    cliente_domicilio: "Av. Apoquindo 5500, of 802",
    cliente_comuna: "Las Condes",
    cliente_email: "contacto@andes.cl",
    cliente_contraparte_nombre: "Laura Vidal",
    cliente_contraparte_cargo: "Jefa de Marketing",
    proyecto_titulo: "Diseño de identidad de marca",
    proyecto_necesidad: "renovar su imagen corporativa para el relanzamiento de la marca.",
    proyecto_descripcion:
      "Diseño de identidad visual: logotipo, paleta de colores y manual de marca, en dos rondas de revisión.",
    proyecto_entregables: "Archivos en formato .ai, .png y .pdf; manual de marca en PDF.",
    plazo_modalidad: "definido",
    plazo_inicio: "2026-08-15",
    plazo_termino: "2026-10-15",
    plazo_renovable: false,
    honorarios_modalidad: "por_hito",
    honorarios_moneda: "CLP",
    honorarios_monto_clp: 1200000,
    honorarios_hitos: "40% al aprobar la propuesta; 60% contra la entrega final.",
    honorarios_plazo_pago_dias: 30,
    honorarios_reajuste: false,
    pi_genera_obra: true,
    pi_variante: "cesion_encargo",
    confidencialidad_plazo_anios: 3,
    datos_hay_tratamiento: false,
    subcontratacion_prohibida: true,
    no_solicitacion_aplica: true,
    no_solicitacion_meses: 12,
    obligaciones_variante: "neutra",
    obligaciones_plazo_observacion: 10,
    obligaciones_plazo_subsanacion: 10,
    responsabilidad_variante: "neutra",
    termino_variante: "neutra",
    termino_aviso: 30,
    termino_plazo_subsanacion: 15,
    jurisdiccion_es_arbitraje: false,
    jurisdiccion_comuna: "Santiago",
    firma_modalidad: "simple",
    firma_ejemplares: 2,
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

  // 2. Validación (respetando visibilidad condicional)
  const errs = validateAnswers(contract, answers);
  check(Object.keys(errs).length === 0, "las respuestas pasan la validación");
  if (Object.keys(errs).length > 0) {
    console.log("    → errores:", JSON.stringify(errs, null, 2));
  }

  // 2-bis. Reglas duras: la config de ejemplo no debe infringir ninguna.
  const violations = checkHardRules(contract, answers);
  check(violations.length === 0, "no infringe reglas duras");

  // 3. Ensamblado + condiciones
  const clauses = assembleContract(contract, answers);
  check(clauses.length > 0, `se ensamblaron cláusulas (${clauses.length})`);

  // Verificación puntual de condiciones esperadas
  const ids = new Set(clauses.map((c) => c.id));
  if (contract.id === "arriendo-vivienda") {
    check(ids.has("codeudor"), "cláusula de codeudor incluida (aval_existe = sí)");
    check(ids.has("garantia"), "cláusula de garantía incluida (garantia_aplica = sí)");
    check(ids.has("titulo") && ids.has("firmas"), "cláusulas de título y firmas presentes");
    const full = clauses.map((c) => `${c.heading}\n${c.text}`).join("\n");
    check(full.includes("un perro de raza pequeña"), "condicional inline de mascotas aplicado");
    check(full.includes("$450.000"), "renta en CLP formateada");
  }
  if (contract.id === "prestacion-servicios") {
    check(ids.has("confidencialidad"), "cláusula de confidencialidad incluida");
    check(ids.has("propiedad-intelectual"), "cláusula de PI incluida (genera obra = sí)");
    check(!ids.has("datos"), "cláusula de datos OMITIDA (sin tratamiento)");
    check(ids.has("no-solicitacion"), "cláusula de no solicitación incluida");
    const full = clauses.map((c) => `${c.heading}\n${c.text}`).join("\n");
    check(full.includes("15,25%"), "retención tributaria desde params (persona natural)");
    check(full.includes("Anexo D"), "Anexo D de cesión (PI no es licencia)");
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
