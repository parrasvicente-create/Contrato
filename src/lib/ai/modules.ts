import type { ContractCategory } from "./categories";

// ─────────────────────────────────────────────────────────────────────────
// MÓDULOS DE ESPECIALIZACIÓN (Paso 2 del spec).
//
// Cada módulo es un bloque de texto que se inyecta en el prompt base del
// informe, entre las "Reglas de operación" y la "Estructura del informe",
// según la categoría detectada. Da al analista foco en los riesgos típicos
// de ese tipo de contrato en Chile.
//
// ⚠️ CONTENIDO DE EJEMPLO. El contenido definitivo de cada módulo se entrega
// por separado (ver documento de prompts). Están como constantes editables
// para poder reemplazarlos sin tocar el prompt base ni el código.
//
// Si la categoría es "otro", no se inyecta ningún módulo.
// ─────────────────────────────────────────────────────────────────────────

const modulo_arrendamiento = `MÓDULO DE ESPECIALIZACIÓN — ARRENDAMIENTO
Marco: Ley N° 18.101 sobre arrendamiento de predios urbanos y Código Civil (arts. 1915 y ss.).
Presta especial atención a:
- Monto y naturaleza de la garantía (lo usual es un mes de renta) y su plazo de restitución.
- Reajuste de la renta (IPC/UF) y su periodicidad.
- Distribución de reparaciones: las necesarias y estructurales son de cargo del arrendador; solo las locativas del arrendatario.
- Causales y mecanismos de término anticipado y su equilibrio entre las partes.
- Prohibiciones (subarriendo, cesión) y su proporcionalidad.
- Cláusulas que restrinjan derechos irrenunciables del arrendatario bajo la Ley N° 18.101.`;

const modulo_prestacion_servicios = `MÓDULO DE ESPECIALIZACIÓN — PRESTACIÓN DE SERVICIOS
Marco: Código Civil (arrendamiento de servicios inmateriales) y contraste con el Código del Trabajo (art. 7).
Presta especial atención a:
- Indicios de laboralidad encubierta: jornada u horario fijo, exclusividad, subordinación, supervisión jerárquica. La concurrencia de estos elementos puede recaracterizar la relación como laboral (principio de primacía de la realidad).
- Condiciones de pago de honorarios y su exigibilidad (evitar aprobación puramente discrecional del cliente).
- Propiedad intelectual de los entregables y su condicionamiento al pago (Ley N° 17.336).
- Límites de responsabilidad y multas desproporcionadas.
- Confidencialidad y su vigencia post-término.`;

const modulo_nda = `MÓDULO DE ESPECIALIZACIÓN — ACUERDO DE CONFIDENCIALIDAD (NDA)
Presta especial atención a:
- Definición del alcance de "información confidencial": debe ser precisa; una definición demasiado amplia puede ser inoponible.
- Excepciones estándar (información pública, de desarrollo independiente, o requerida por ley/autoridad).
- Plazo de vigencia de la obligación de reserva y su razonabilidad.
- Unilateralidad vs. reciprocidad de las obligaciones.
- Cláusulas penales por incumplimiento y su proporcionalidad.
- Tratamiento de datos personales cuando la información incluya datos de terceros (Ley N° 21.719).
- Ley aplicable y foro para la solución de controversias.`;

const modulo_compraventa = `MÓDULO DE ESPECIALIZACIÓN — COMPRAVENTA
Marco: Código Civil (arts. 1793 y ss.) y Código de Comercio si es mercantil.
Presta especial atención a:
- Determinación del precio y su forma/oportunidad de pago.
- Transferencia de dominio y modo de efectuar la tradición; riesgo de la cosa.
- Obligación de saneamiento: evicción y vicios redhibitorios; cláusulas que la limiten o excluyan.
- Condiciones y plazos de entrega, y estado en que se entrega el bien.
- Declaraciones y garantías (representations & warranties) del vendedor.
- Si intervienen consumidores, normas de la Ley N° 19.496.`;

const modulo_laboral = `MÓDULO DE ESPECIALIZACIÓN — CONTRATO DE TRABAJO
Marco: Código del Trabajo.
Presta especial atención a:
- Cláusulas que renuncien o disminuyan derechos irrenunciables del trabajador (nulas).
- Jornada, remuneración, gratificaciones y su conformidad con los mínimos legales.
- Causales de término y su ajuste a las causales legales; finiquito.
- Pacto de no competencia post-contractual (su validez es restringida en Chile).
- Confidencialidad y propiedad intelectual de lo creado en la relación laboral.
- Protección de datos personales del trabajador (Ley N° 21.719).`;

const MODULES: Partial<Record<ContractCategory, string>> = {
  arrendamiento: modulo_arrendamiento,
  prestacion_servicios: modulo_prestacion_servicios,
  nda: modulo_nda,
  compraventa: modulo_compraventa,
  laboral: modulo_laboral,
};

/**
 * Devuelve el módulo de especialización para una categoría, o "" si es "otro"
 * (o una categoría sin módulo), en cuyo caso se usa solo el prompt base.
 */
export function getSpecializationModule(category: string): string {
  return MODULES[category as ContractCategory] ?? "";
}
