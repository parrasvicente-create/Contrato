import { simuladoProvider } from "./simulado";
import type { PaymentProviderAdapter } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// REGISTRO de proveedores de pago.
//
// Para integrar Flow o Webpay:
//   1. Crea ./flow.ts (o ./webpay.ts) exportando un PaymentProviderAdapter.
//   2. Impórtalo y agrégalo al registro de abajo.
//   3. Cambia PAYMENT_PROVIDER en el .env.
// Nada más de la aplicación necesita cambiar.
// ─────────────────────────────────────────────────────────────────────────

const providers: Record<string, PaymentProviderAdapter> = {
  [simuladoProvider.id]: simuladoProvider,
  // [flowProvider.id]: flowProvider,
  // [webpayProvider.id]: webpayProvider,
};

/**
 * Devuelve el proveedor de pago activo según la variable de entorno
 * PAYMENT_PROVIDER. Si no está definida o no se reconoce, usa el simulado.
 */
export function getPaymentProvider(): PaymentProviderAdapter {
  const configured = process.env.PAYMENT_PROVIDER ?? simuladoProvider.id;
  const provider = providers[configured];

  if (!provider) {
    console.warn(
      `[pagos] Proveedor "${configured}" no está registrado. Usando el simulado.`,
    );
    return simuladoProvider;
  }
  return provider;
}

export * from "./types";
