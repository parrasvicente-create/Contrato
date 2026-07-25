import type { PaymentProvider as ProviderId, PaymentStatus } from "@/lib/domain";

// ─────────────────────────────────────────────────────────────────────────
// Abstracción de PROVEEDOR DE PAGO.
//
// El resto de la aplicación nunca habla con Flow ni Webpay directamente:
// solo usa esta interfaz. Para integrar un proveedor real basta con crear un
// archivo que la implemente y registrarlo en ./index.ts — sin tocar las rutas
// de checkout ni la interfaz de usuario.
//
// La forma de los métodos está pensada para calzar con el flujo típico de los
// medios de pago chilenos (Flow, Webpay Plus):
//   1. createPayment  → se crea la transacción y se redirige al usuario.
//   2. confirmPayment → el proveedor devuelve al usuario y se verifica el pago.
// ─────────────────────────────────────────────────────────────────────────

export interface CreatePaymentInput {
  /** Identificador de la orden en nuestra base de datos. */
  orderId: string;
  amountClp: number;
  /** Descripción visible para el usuario, p.ej. "Arriendo de vivienda". */
  description: string;
  /** URL a la que el proveedor debe devolver al usuario al terminar. */
  returnUrl: string;
}

export interface CreatePaymentResult {
  /** A dónde enviar al usuario para completar el pago. */
  redirectUrl: string;
  /**
   * Referencia de la transacción en el proveedor (token de Flow, buyOrder de
   * Webpay…). Se guarda en Order.providerRef para poder conciliar después.
   */
  providerRef?: string;
}

export interface ConfirmPaymentInput {
  orderId: string;
  /**
   * Parámetros que el proveedor entrega al volver (token_ws en Webpay,
   * token en Flow, etc.). En el proveedor simulado va vacío.
   */
  payload?: Record<string, string>;
}

export interface ConfirmPaymentResult {
  status: PaymentStatus;
  providerRef?: string;
  /** Motivo del rechazo, si lo hubo. */
  message?: string;
}

/** Contrato que debe cumplir todo proveedor de pago. */
export interface PaymentProviderAdapter {
  readonly id: ProviderId;
  /** Nombre visible para el usuario. */
  readonly displayName: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
}
