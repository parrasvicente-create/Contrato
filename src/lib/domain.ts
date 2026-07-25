import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
// Tipos de dominio y sus validadores zod.
//
// Como SQLite no soporta enums de Prisma, definimos aquí los valores
// permitidos para los campos String del esquema. Estos esquemas son la
// fuente de verdad usada al leer/escribir en la base de datos.
// ─────────────────────────────────────────────────────────────────────────

/** Qué operación se está realizando. */
export const OperationKind = {
  GENERATE: "GENERATE",
  REVIEW: "REVIEW",
} as const;
export type OperationKind = (typeof OperationKind)[keyof typeof OperationKind];
export const operationKindSchema = z.enum(["GENERATE", "REVIEW"]);

/**
 * Estado de una operación en su ciclo de vida:
 *  - DRAFT:     borrador (wizard en curso / documento recién subido)
 *  - PREVIEW:   hay una vista/resumen gratuito disponible
 *  - PAID:      el usuario pagó y desbloqueó el resultado
 *  - COMPLETED: los documentos finales fueron generados y descargables
 */
export const OperationStatus = {
  DRAFT: "DRAFT",
  PREVIEW: "PREVIEW",
  PAID: "PAID",
  COMPLETED: "COMPLETED",
} as const;
export type OperationStatus =
  (typeof OperationStatus)[keyof typeof OperationStatus];
export const operationStatusSchema = z.enum([
  "DRAFT",
  "PREVIEW",
  "PAID",
  "COMPLETED",
]);

/**
 * Estado de la generación del informe de revisión, que corre en segundo plano
 * tras el pago:
 *  - PENDING:    pagado, aún no se inicia la generación
 *  - GENERATING: el análisis con IA está en curso
 *  - READY:      el informe está listo y guardado
 *  - ERROR:      la generación falló (se puede reintentar)
 */
export const ReportStatus = {
  PENDING: "PENDING",
  GENERATING: "GENERATING",
  READY: "READY",
  ERROR: "ERROR",
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];
export const reportStatusSchema = z.enum([
  "PENDING",
  "GENERATING",
  "READY",
  "ERROR",
]);

/** Estado del pago de una orden. */
export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
} as const;
export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);

/** Proveedores de pago soportados (ver src/lib/payments). */
export const PaymentProvider = {
  SIMULADO: "simulado",
  FLOW: "flow",
  WEBPAY: "webpay",
} as const;
export type PaymentProvider =
  (typeof PaymentProvider)[keyof typeof PaymentProvider];
export const paymentProviderSchema = z.enum(["simulado", "flow", "webpay"]);

/** Severidad de un hallazgo de riesgo. Mapea al semáforo del informe. */
export const Severity = {
  CRITICO: "CRITICO",
  ADVERTENCIA: "ADVERTENCIA",
  SUGERENCIA: "SUGERENCIA",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];
export const severitySchema = z.enum(["CRITICO", "ADVERTENCIA", "SUGERENCIA"]);

/** Color del semáforo asociado a cada severidad, para renderizar la UI. */
export const severityLight: Record<Severity, "rojo" | "ambar" | "azul"> = {
  CRITICO: "rojo",
  ADVERTENCIA: "ambar",
  SUGERENCIA: "azul",
};
