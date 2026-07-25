import { PaymentProvider, PaymentStatus } from "@/lib/domain";
import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderAdapter,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────
// Proveedor de pago SIMULADO.
//
// No cobra nada: redirige a una página propia donde el usuario aprieta un
// botón y la orden se marca como pagada. Sirve para desarrollar y probar
// todo el flujo sin depender de un medio de pago real.
//
// Reemplazarlo por Flow o Webpay consiste en escribir otro archivo que
// implemente PaymentProviderAdapter y registrarlo en ./index.ts.
// ─────────────────────────────────────────────────────────────────────────

export const simuladoProvider: PaymentProviderAdapter = {
  id: PaymentProvider.SIMULADO,
  displayName: "Pago simulado (pruebas)",

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Un proveedor real llamaría a su API y devolvería la URL de su pasarela.
    // Aquí redirigimos a nuestra propia página de checkout simulado.
    // Sin providerRef: el simulado no tiene transacción externa que referenciar.
    return { redirectUrl: `/pagar/${input.orderId}` };
  },

  async confirmPayment(
    _input: ConfirmPaymentInput,
  ): Promise<ConfirmPaymentResult> {
    // Un proveedor real verificaría el token contra su API antes de dar por
    // pagada la orden. El simulado siempre aprueba.
    return { status: PaymentStatus.PAID };
  },
};
