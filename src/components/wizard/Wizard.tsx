"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ContractType } from "@/lib/knowledge-base";
import {
  assembleContract,
  checkHardRules,
  validateStep,
  validateField,
  visibleFields,
  type Answers,
} from "@/lib/knowledge-base";
import { formatClp } from "@/lib/format";
import { Field } from "./Field";
import { ContractPreview } from "./ContractPreview";

// Datos del contrato que necesita el wizard. Deliberadamente NO incluye las
// reglas de riesgo: pertenecen al módulo revisor y no se envían al cliente.
export type WizardContract = Pick<
  ContractType,
  | "id"
  | "name"
  | "description"
  | "generationPriceClp"
  | "steps"
  | "clauses"
  | "hardRules"
  | "designGuarantees"
>;

interface WizardProps {
  contract: WizardContract;
}

type GenerationState =
  | { phase: "idle" }
  | { phase: "saving" }
  | { phase: "error"; message: string };

export function Wizard({ contract }: WizardProps) {
  const totalSteps = contract.steps.length;
  const reviewStepIndex = totalSteps; // el último "paso" es la revisión
  const storageKey = `resguardo:draft:${contract.id}`;

  /** Respuestas por defecto según la configuración del contrato. */
  function computeDefaults(): Answers {
    const initial: Answers = {};
    for (const step of contract.steps) {
      for (const field of step.fields) {
        if (field.defaultValue !== undefined) initial[field.name] = field.defaultValue;
        else if (field.type === "boolean") initial[field.name] = false;
      }
    }
    return initial;
  }

  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generation, setGeneration] = useState<GenerationState>({ phase: "idle" });
  const [answers, setAnswers] = useState<Answers>(computeDefaults);
  const [restored, setRestored] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const fieldsRef = useRef<HTMLDivElement>(null);
  const skipSave = useRef(true); // evita clobberar el borrador en el primer render

  const isReview = stepIndex === reviewStepIndex;
  const currentStep = isReview ? null : contract.steps[stepIndex];

  // El contrato se arma en vivo: la vista previa refleja lo escrito al instante.
  const clauses = useMemo(
    () => assembleContract(contract, answers),
    [contract, answers],
  );

  // Campos visibles del paso actual (respeta la visibilidad condicional).
  const shownFields = useMemo(
    () => (currentStep ? visibleFields(currentStep.fields, answers) : []),
    [currentStep, answers],
  );

  // Reglas duras infringidas: bloquean el pago hasta corregirlas.
  const violations = useMemo(
    () => checkHardRules(contract, answers),
    [contract, answers],
  );

  // ── Autoguardado: restaurar borrador al abrir ──────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          setAnswers((prev) => ({ ...prev, ...saved }));
          setRestored(true);
        }
      }
    } catch {
      // localStorage no disponible: seguimos sin autoguardado.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autoguardado: persistir en cada cambio ─────────────────────────────
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    } catch {
      /* ignorar */
    }
  }, [answers, storageKey]);

  // ── Foco en el primer campo al cambiar de paso ─────────────────────────
  useEffect(() => {
    if (isReview) return;
    const el = fieldsRef.current?.querySelector<HTMLElement>(
      "input, select, textarea",
    );
    el?.focus({ preventScroll: true });
  }, [stepIndex, isReview]);

  // Al llegar a "Revisar", abrimos la vista previa colapsable en móvil.
  useEffect(() => {
    if (isReview) setMobilePreviewOpen(true);
  }, [isReview]);

  function handleChange(name: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [name]: value }));
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
    const next = stepIndex + 1;
    setStepIndex(next);
    setMaxReached((m) => Math.max(m, next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setErrors({});
    setStepIndex((i) => Math.max(0, i - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Salta a un paso ya alcanzado (desde el índice de pasos). */
  function jumpTo(i: number) {
    if (i > maxReached) return;
    setErrors({});
    setStepIndex(i);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDraft() {
    setAnswers(computeDefaults());
    setErrors({});
    setStepIndex(0);
    setMaxReached(0);
    setRestored(false);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignorar */
    }
  }

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
        setGeneration({ phase: "error", message: opData.error ?? "No se pudo guardar el contrato." });
        return;
      }
      const payRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId: opData.id }),
      });
      const payData = await payRes.json();
      if (!payRes.ok) {
        setGeneration({ phase: "error", message: payData.error ?? "No se pudo iniciar el pago." });
        return;
      }
      // El contrato quedó guardado en el servidor: limpiamos el borrador local.
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignorar */
      }
      window.location.href = payData.redirectUrl;
    } catch {
      setGeneration({ phase: "error", message: "Error de conexión. Inténtalo nuevamente." });
    }
  }

  const pasoActual = isReview ? totalSteps + 1 : stepIndex + 1;
  const chips = [
    ...contract.steps.map((s, i) => ({ label: s.title, index: i })),
    { label: "Revisar", index: reviewStepIndex },
  ];

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-12">
      {/* ── Columna: formulario (más ancha) ─────────────────────────────── */}
      <div className="space-y-6">
        {/* Progreso: índice de pasos clicable + barra */}
        <nav aria-label="Progreso">
          <ol className="flex flex-wrap gap-1.5">
            {chips.map((c) => {
              const done = c.index < pasoActual - 1;
              const active = c.index === stepIndex;
              const reachable = c.index <= maxReached;
              return (
                <li key={c.index}>
                  <button
                    type="button"
                    onClick={() => jumpTo(c.index)}
                    disabled={!reachable}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-tinta-800 text-white"
                        : done
                          ? "bg-tinta-100 text-tinta-700 hover:bg-tinta-200"
                          : "text-tinta-400"
                    } ${reachable ? "cursor-pointer" : "cursor-default"}`}
                  >
                    {done && !active ? "✓ " : ""}
                    {c.label}
                  </button>
                </li>
              );
            })}
          </ol>
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

        {/* Aviso de borrador restaurado / autoguardado */}
        {restored && (
          <div className="flex items-center justify-between gap-3 rounded border border-tinta-100 bg-papel px-4 py-2.5 text-xs text-tinta-500">
            <span>Restauramos tu borrador. Se guarda solo a medida que avanzas.</span>
            <button
              type="button"
              onClick={resetDraft}
              className="shrink-0 font-medium text-tinta-600 underline underline-offset-2 hover:text-tinta-800"
            >
              Empezar de nuevo
            </button>
          </div>
        )}

        {/* Captura de datos */}
        {currentStep && (
          <section className="border border-tinta-100 bg-papel p-5 shadow-sutil sm:p-7">
            <h2 className="text-xl font-semibold text-tinta-800">{currentStep.title}</h2>
            {currentStep.description && (
              <p className="mt-1.5 text-sm leading-relaxed text-tinta-600">
                {currentStep.description}
              </p>
            )}
            <div ref={fieldsRef} className="mt-6 grid gap-5 sm:grid-cols-2">
              {shownFields.map((field) => (
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

        {/* Revisión: confirmación + precio */}
        {isReview && (
          <div className="space-y-4">
            <div className="border-l-2 border-dorado-500 bg-dorado-50/60 px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-tinta-800">
                Revisa tu contrato antes de generarlo
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                A la derecha ves cómo quedó. El documento definitivo, sin marca de
                agua y descargable en Word y PDF, cuesta{" "}
                <strong className="font-semibold text-tinta-800">
                  {formatClp(contract.generationPriceClp)}
                </strong>
                .
              </p>
            </div>
            {/* Reglas duras infringidas: bloquean el pago. */}
            {violations.length > 0 && (
              <div className="border-l-2 border-riesgo-critico bg-riesgo-criticoSuave px-4 py-3">
                <p className="text-sm font-semibold text-riesgo-critico">
                  Hay que corregir esto antes de continuar
                </p>
                <ul className="mt-1.5 space-y-1.5">
                  {violations.map((v) => (
                    <li key={v.id} className="text-sm text-riesgo-critico">
                      {v.message}{" "}
                      <span className="text-riesgo-critico/70">({v.legalBasis})</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Garantías legales que el contrato cumple por diseño. */}
            {violations.length === 0 &&
              contract.designGuarantees &&
              contract.designGuarantees.length > 0 && (
                <details className="group rounded border border-tinta-100 bg-papel">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-tinta-700">
                    <span>✓ Este contrato respeta {contract.designGuarantees.length} límites legales</span>
                    <span className="text-tinta-400 transition group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <ul className="space-y-1.5 border-t border-tinta-100 px-4 py-3 text-xs leading-relaxed text-tinta-600">
                    {contract.designGuarantees.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </details>
              )}

            {generation.phase === "error" && (
              <p className="border-l-2 border-riesgo-critico bg-riesgo-criticoSuave px-4 py-3 text-sm text-riesgo-critico">
                {generation.message}
              </p>
            )}
          </div>
        )}

        {/* Vista previa colapsable (solo móvil/tablet) */}
        <details
          className="group overflow-hidden rounded border border-tinta-100 bg-papel lg:hidden"
          open={mobilePreviewOpen}
          onToggle={(e) => setMobilePreviewOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-tinta-700">
            <span>Ver cómo va tu contrato</span>
            <span className="text-tinta-400 transition group-open:rotate-180" aria-hidden>
              ▾
            </span>
          </summary>
          <div className="border-t border-tinta-100 p-3">
            <ContractPreview title={contract.name} clauses={clauses} />
          </div>
        </details>

        {/* Navegación fija abajo */}
        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-tinta-100 bg-hueso/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 sm:py-4 lg:mx-0 lg:px-0">
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
              disabled={generation.phase === "saving" || violations.length > 0}
              title={
                violations.length > 0
                  ? "Corrige las observaciones legales para continuar"
                  : undefined
              }
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

      {/* ── Columna: vista previa en vivo (escritorio) ──────────────────── */}
      <aside className="hidden lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="versalita text-dorado-600">Vista previa en vivo</p>
          <p className="text-xs text-tinta-400">Se actualiza al escribir</p>
        </div>
        <p className="mb-3 text-xs text-tinta-500">
          Lo marcado como{" "}
          <span className="rounded-sm bg-dorado-100 px-1 text-dorado-700">
            por completar
          </span>{" "}
          se rellena con tus respuestas.
        </p>
        <ContractPreview title={contract.name} clauses={clauses} />
      </aside>
    </div>
  );
}
