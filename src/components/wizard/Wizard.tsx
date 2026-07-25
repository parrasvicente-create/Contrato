"use client";

import { useMemo, useState } from "react";
import type { ContractType } from "@/lib/knowledge-base";
import {
  assembleContract,
  validateStep,
  validateField,
  type Answers,
} from "@/lib/knowledge-base";
import { formatClp } from "@/lib/format";
import { Field } from "./Field";
import { ContractPreview } from "./ContractPreview";

// Datos del contrato que necesita el wizard. Deliberadamente NO incluye las
// reglas de riesgo: pertenecen al módulo revisor y no se envían al cliente.
export type WizardContract = Pick<
  ContractType,
  "id" | "name" | "description" | "generationPriceClp" | "steps" | "clauses"
>;

interface WizardProps {
  contract: WizardContract;
}

/**
 * Estado del envío al completar el wizard. Al confirmar se guarda la
 * operación y se redirige al checkout, por lo que no hay estado "listo":
 * la descarga vive en la página de pago.
 */
type GenerationState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "error"; message: string };

export function Wizard({ contract }: WizardProps) {
  const totalSteps = contract.steps.length;
  const reviewStepIndex = totalSteps; // el último "paso" es la revisión

  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generation, setGeneration] = useState<GenerationState>({ phase: "idle" });

  // Respuestas inicializadas con los valores por defecto de la configuración.
  const [answers, setAnswers] = useState<Answers>(() => {
    const initial: Answers = {};
    for (const step of contract.steps) {
      for (const field of step.fields) {
        if (field.defaultValue !== undefined) initial[field.name] = field.defaultValue;
        else if (field.type === "boolean") initial[field.name] = false;
      }
    }
    return initial;
  });

  const isReview = stepIndex === reviewStepIndex;
  const currentStep = isReview ? null : contract.steps[stepIndex];

  // El contrato se arma en vivo: la vista previa refleja lo escrito al instante.
  const clauses = useMemo(
    () => assembleContract(contract, answers),
    [contract, answers],
  );

  function handleChange(name: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [name]: value }));
    // Si el campo ya tenía error, revalidamos al escribir para quitarlo apenas
    // se corrija (sin marcar error en campos que aún no se han tocado).
    if (errors[name]) {
      const field = currentStep?.fields.find((f) => f.name === name);
      if (field) {
        const message = validateField(field, value);
        setErrors((prev) => {
          const next = { ...prev };
          if (message) next[name] = message;
          else delete next[name];
          return next;
        });
      }
    }
  }

  function handleBlur(name: string) {
    const field = currentStep?.fields.find((f) => f.name === name);
    if (!field) return;
    const message = validateField(field, answers[field.name]);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  function goNext() {
    if (!currentStep) return;
    const stepErrors = validateStep(currentStep.fields, answers);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) return;
    setStepIndex((i) => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Persiste la operación y arranca el checkout. */
  async function handleContinueToPayment() {
    setGeneration({ phase: "saving" });
    try {
      const opRes = await fetch("/api/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractTypeId: contract.id, answers }),
      });
      const opData = await opRes.json();
      if (!opRes.ok) {
        setGeneration({
          phase: "error",
          message: opData.error ?? "No se pudo guardar el contrato.",
        });
        return;
      }

      const payRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId: opData.id }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setGeneration({
          phase: "error",
          message: payData.error ?? "No se pudo iniciar el pago.",
        });
        return;
      }

      window.location.href = payData.redirectUrl;
    } catch {
      setGeneration({
        phase: "error",
        message: "Error de conexión. Inténtalo nuevamente.",
      });
    }
  }

  const pasoActual = isReview ? totalSteps + 1 : stepIndex + 1;

  return (
    <div className="space-y-8">
      {/* ── Progreso ──────────────────────────────────────────────────── */}
      <nav aria-label="Progreso">
        <div className="flex items-baseline justify-between">
          <p className="versalita text-dorado-600">
            Paso {pasoActual} de {totalSteps + 1}
          </p>
          <p className="text-sm text-tinta-500">
            {isReview ? "Revisar" : currentStep?.title}
          </p>
        </div>
        {/* Barra segmentada: un tramo por paso. */}
        <div className="mt-2 flex gap-1" aria-hidden>
          {Array.from({ length: totalSteps + 1 }).map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-sm transition-colors ${
                i < pasoActual ? "bg-tinta-800" : "bg-tinta-100"
              }`}
            />
          ))}
        </div>
      </nav>

      {/* ── Captura de datos ──────────────────────────────────────────── */}
      {currentStep && (
        <section className="border border-tinta-100 bg-papel p-6 shadow-sutil sm:p-8">
          <h2 className="text-xl font-semibold text-tinta-800">
            {currentStep.title}
          </h2>
          {currentStep.description && (
            <p className="mt-1.5 max-w-lectura text-sm leading-relaxed text-tinta-600">
              {currentStep.description}
            </p>
          )}

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            {currentStep.fields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === "textarea" || field.type === "boolean"
                    ? "sm:col-span-2"
                    : ""
                }
              >
                <Field
                  field={field}
                  value={answers[field.name]}
                  error={errors[field.name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Revisión: vista previa con marca de agua ──────────────────── */}
      {isReview && (
        <div className="space-y-5">
          <div className="border-l-2 border-dorado-500 bg-dorado-50/60 px-5 py-4">
            <h2 className="font-serif text-lg font-semibold text-tinta-800">
              Revisa tu contrato antes de generarlo
            </h2>
            <p className="mt-1 max-w-lectura text-sm leading-relaxed text-tinta-600">
              Esta es una vista previa. El documento definitivo, sin marca de
              agua y descargable en Word y PDF, cuesta{" "}
              <strong className="font-semibold text-tinta-800">
                {formatClp(contract.generationPriceClp)}
              </strong>
              .
            </p>
          </div>

          <ContractPreview title={contract.name} clauses={clauses} />

          {generation.phase === "error" && (
            <p className="border-l-2 border-riesgo-critico bg-riesgo-criticoSuave px-4 py-3 text-sm text-riesgo-critico">
              {generation.message}
            </p>
          )}
        </div>
      )}

      {/* ── Navegación (fija abajo: siempre accesible) ────────────────── */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-tinta-100 bg-hueso/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 sm:py-4">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="rounded px-4 py-2.5 text-sm font-medium text-tinta-600 transition hover:bg-tinta-50 hover:text-tinta-800 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Atrás
        </button>

        {isReview ? (
          <button
            type="button"
            onClick={handleContinueToPayment}
            disabled={generation.phase === "saving"}
            className="rounded bg-tinta-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-tinta-700 disabled:opacity-50 sm:px-6"
          >
            {generation.phase === "saving"
              ? "Procesando…"
              : `Continuar al pago · ${formatClp(contract.generationPriceClp)}`}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="rounded bg-tinta-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-tinta-700 sm:px-6"
          >
            {stepIndex === totalSteps - 1 ? "Ver vista previa →" : "Siguiente →"}
          </button>
        )}
      </div>
    </div>
  );
}
