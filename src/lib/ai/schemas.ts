// NOTA: se importa desde "zod/v4" (disponible desde zod 3.25) porque el helper
// `zodOutputFormat` del SDK de Anthropic requiere los tipos de Zod v4. El resto
// de la aplicación sigue usando la API clásica de zod v3, que es compatible.
import { z } from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────
// Esquemas de las respuestas de la IA (salida estructurada / JSON garantizado).
// Alineados con la especificación del módulo de revisión.
// ─────────────────────────────────────────────────────────────────────────

// ── PASO 1: CLASIFICADOR ──────────────────────────────────────────────────

export const classifierSchema = z.object({
  tipo_contrato: z.enum([
    "arrendamiento",
    "prestacion_servicios",
    "nda",
    "compraventa",
    "laboral",
    "otro",
  ]),
  confianza: z.enum(["alta", "media", "baja"]),
  /** Una frase con la señal principal que determinó la clasificación. */
  justificacion: z.string(),
  /** Otras categorías detectadas de forma secundaria, si las hay. */
  senales_mixtas: z.array(z.string()),
});

export type ClassifierResult = z.infer<typeof classifierSchema>;

// ── RESUMEN GRATUITO (teaser, sin cambios del brief original) ─────────────

export const freeSummarySchema = z.object({
  resumenGeneral: z.string(),
  tuRolProbable: z.string(),
  aQueTeComprometes: z.array(z.string()),
  pagos: z.array(z.string()),
  plazos: z.array(z.string()),
  garantias: z.array(z.string()),
  puntosDeAtencion: z.array(z.string()),
  hallazgosEstimados: z.number(),
});

export type FreeSummary = z.infer<typeof freeSummarySchema>;

// ── PASO 3: INFORME COMPLETO (estructura del spec) ────────────────────────

/** Nivel de riesgo por cláusula. Enum estricto (crítico para el frontend). */
export const nivelRiesgoSchema = z.enum(["ALTO", "MEDIO", "BAJO"]);
export type NivelRiesgo = z.infer<typeof nivelRiesgoSchema>;

/** Semáforo global. Enum estricto. */
export const riesgoGlobalSchema = z.enum(["VERDE", "AMARILLO", "ROJO"]);
export type RiesgoGlobal = z.infer<typeof riesgoGlobalSchema>;

/** Prioridad de recomendación. Enum estricto (con tildes, tal como el spec). */
export const prioridadSchema = z.enum(["Crítico", "Negociable", "Menor"]);
export type Prioridad = z.infer<typeof prioridadSchema>;

/** Análisis de una cláusula. */
export const clausulaAnalisisSchema = z.object({
  clausula: z.string(),
  nivel_riesgo: nivelRiesgoSchema,
  que_establece: z.string(),
  por_que_importa: z.string(),
  como_abordarlo: z.string(),
  /**
   * Cita LITERAL del fragmento de la cláusula que se propone reemplazar. Sirve
   * para (a) anclar el comentario y (b) marcar el texto a tachar en el redline
   * del Word. "" si no se puede copiar textualmente.
   */
  cita_textual: z.string(),
  /**
   * Redacción alternativa concreta, lista para reemplazar EXACTAMENTE a
   * `cita_textual`. Se inserta como control de cambios (redline) en el Word.
   * Usa marcadores [PLAZO], [MONTO] para datos faltantes. "" si el arreglo es
   * una acción y no una reescritura de texto.
   */
  redaccion_alternativa: z.string(),
  /**
   * Nota dirigida a la CONTRAPARTE que justifica el cambio propuesto, en tono
   * profesional y negociador (por qué es razonable, equilibrado y conforme a
   * la ley/estándar de mercado). Es el texto del comentario del Word.
   */
  justificacion_contraparte: z.string(),
});
export type ClausulaAnalisis = z.infer<typeof clausulaAnalisisSchema>;

export const fullReportSchema = z.object({
  meta: z.object({
    tipo_contrato: z.string(),
    perspectiva_revision: z.string(),
    riesgo_global: riesgoGlobalSchema,
    veredicto_breve: z.string(),
  }),
  sintesis: z.object({
    naturaleza_juridica: z.string(),
    partes: z.array(z.object({ nombre: z.string(), rol: z.string() })),
    objeto: z.string(),
    plazo: z.string(),
    contraprestacion: z.string(),
  }),
  anatomia: z.object({
    tipo_naturaleza_juridica: z.string(),
    obligaciones_reciprocas: z.array(
      z.object({ parte: z.string(), obligacion: z.string() }),
    ),
    regimen_economico: z.string(),
    vigencia_renovacion_termino: z.string(),
    ley_aplicable_y_controversias: z.string(),
  }),
  /** Ordenado de mayor a menor riesgo. */
  analisis_clausulas: z.array(clausulaAnalisisSchema),
  vacios_contractuales: z.array(
    z.object({
      clausula_ausente: z.string(),
      efecto_de_la_ausencia: z.string(),
      regimen_supletorio: z.string(),
      /**
       * Texto COMPLETO de la cláusula que se propone incorporar (epígrafe +
       * cuerpo), lista para insertar como control de cambios en el Word. Usa
       * marcadores [PLAZO], [MONTO] para datos faltantes. "" si no aplica una
       * cláusula textual.
       */
      clausula_propuesta: z.string(),
      /** Nota a la contraparte que justifica agregar esta cláusula. */
      justificacion_contraparte: z.string(),
    }),
  ),
  legalidad_y_validez: z.object({
    hay_riesgos: z.boolean(),
    observaciones: z.array(
      z.object({
        clausula: z.string(),
        problema: z.string(),
        fundamento_normativo: z.string(),
      }),
    ),
  }),
  equilibrio_contractual: z.object({
    hay_asimetria_relevante: z.boolean(),
    descripcion: z.string(),
  }),
  recomendaciones: z.array(
    z.object({
      prioridad: prioridadSchema,
      descripcion: z.string(),
      clausula_relacionada: z.string(),
    }),
  ),
  cierre: z.string(),
});

export type FullReport = z.infer<typeof fullReportSchema>;
