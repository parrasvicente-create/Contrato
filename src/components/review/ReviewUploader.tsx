"use client";

import { useRef, useState } from "react";
import { formatClp } from "@/lib/format";
import type { ClassifierResult, FreeSummary } from "@/lib/ai/schemas";
import { CONTRACT_CATEGORIES, CATEGORY_INFO } from "@/lib/ai/categories";

// Dropzone + resultado del módulo revisor. Todo el análisis ocurre en el
// servidor; aquí se sube el documento, se muestra el resumen gratuito, y se
// permite CONFIRMAR/CORREGIR el tipo detectado antes de pagar.

const MAX_MB = 10;

interface ReviewResult {
  id: string;
  classification: ClassifierResult;
  summary: FreeSummary;
  amountClp: number;
  contractTypeName: string;
}

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; result: ReviewResult }
  | { phase: "error"; message: string };

export function ReviewUploader() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [perspectiva, setPerspectiva] = useState("");
  const [industria, setIndustria] = useState("");
  const [notas, setNotas] = useState("");
  const [dragging, setDragging] = useState(false);
  const [tipoConfirmado, setTipoConfirmado] = useState<string>("");
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(selected: File | null) {
    if (!selected) return;
    if (selected.size > MAX_MB * 1024 * 1024) {
      setState({ phase: "error", message: `El archivo supera el máximo de ${MAX_MB} MB.` });
      return;
    }
    setFile(selected);
    setText("");
    setState({ phase: "idle" });
  }

  async function handleSubmit() {
    if (!file && text.trim().length === 0) {
      setState({ phase: "error", message: "Sube un archivo o pega el texto del contrato." });
      return;
    }
    setState({ phase: "loading" });
    const body = new FormData();
    if (file) body.append("file", file);
    else body.append("text", text);
    if (perspectiva.trim()) body.append("perspectiva", perspectiva.trim());
    if (industria.trim()) body.append("industria", industria.trim());
    if (notas.trim()) body.append("notas", notas.trim());

    try {
      const res = await fetch("/api/review", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setState({ phase: "error", message: data.error ?? "No se pudo analizar el contrato." });
        return;
      }
      const result = data as ReviewResult;
      setTipoConfirmado(result.classification.tipo_contrato);
      setState({ phase: "done", result });
    } catch {
      setState({ phase: "error", message: "Error de conexión. Inténtalo nuevamente." });
    }
  }

  async function handleUnlock(operationId: string, detectedTipo: string) {
    setUnlocking(true);
    try {
      // Si el usuario corrigió el tipo, lo guardamos antes de pagar.
      if (tipoConfirmado && tipoConfirmado !== detectedTipo) {
        await fetch(`/api/operations/${operationId}/type`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: tipoConfirmado }),
        });
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationId }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) window.location.href = data.redirectUrl;
      else if (res.ok && data.alreadyPaid) window.location.href = `/pagar/${data.orderId}`;
      else setUnlocking(false);
    } catch {
      setUnlocking(false);
    }
  }

  function reset() {
    setFile(null);
    setText("");
    setState({ phase: "idle" });
  }

  // ── Resultado ────────────────────────────────────────────────────────
  if (state.phase === "done") {
    const { classification, summary, amountClp, id } = state.result;
    const confColor = {
      alta: "text-riesgo-ok",
      media: "text-riesgo-advertencia",
      baja: "text-tinta-400",
    }[classification.confianza];
    const dudoso = classification.confianza === "baja" || classification.tipo_contrato === "otro";

    return (
      <div className="space-y-8">
        {/* Tipo detectado + confirmar/corregir */}
        <div className="border border-tinta-100 bg-papel p-6 shadow-sutil">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="versalita text-dorado-600">Tipo detectado</p>
            <p className={`text-xs font-medium ${confColor}`}>Confianza {classification.confianza}</p>
          </div>
          <p className="mt-1.5 max-w-lectura text-sm leading-relaxed text-tinta-600">
            {classification.justificacion}
          </p>
          {classification.senales_mixtas.length > 0 && (
            <p className="mt-1.5 text-xs text-tinta-400">
              También se detectaron señales de: {classification.senales_mixtas.join(", ")}.
            </p>
          )}

          <div className="mt-4 border-t border-tinta-100 pt-4">
            <label htmlFor="tipo" className="mb-1.5 block text-sm font-medium text-tinta-800">
              {dudoso ? "Confirma o corrige el tipo antes de continuar" : "Tipo de contrato"}
            </label>
            <select
              id="tipo"
              value={tipoConfirmado}
              onChange={(e) => setTipoConfirmado(e.target.value)}
              className={`w-full rounded border bg-white px-3 py-2.5 text-sm text-tinta-800 shadow-sutil outline-none transition focus:ring-2 focus:ring-tinta-500/15 sm:w-80 ${
                dudoso ? "border-riesgo-advertencia" : "border-tinta-200 focus:border-tinta-500"
              }`}
            >
              {CONTRACT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_INFO[c].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumen gratis */}
        <section>
          <h2 className="regla-dorada text-2xl font-semibold tracking-tight text-tinta-800">A qué te comprometes</h2>
          <p className="mt-7 max-w-lectura text-lg leading-relaxed text-tinta-700">{summary.resumenGeneral}</p>
          {summary.tuRolProbable && (
            <p className="mt-3 text-sm text-tinta-500">
              Tu rol en este contrato: <strong className="font-semibold text-tinta-700">{summary.tuRolProbable}</strong>
            </p>
          )}
          <div className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            <SummaryList title="Obligaciones" items={summary.aQueTeComprometes} />
            <SummaryList title="Pagos" items={summary.pagos} />
            <SummaryList title="Plazos" items={summary.plazos} />
            <SummaryList title="Garantías" items={summary.garantias} />
          </div>
        </section>

        {/* Muro de pago */}
        <section className="border border-tinta-200 bg-tinta-800 p-7 text-tinta-50">
          <p className="versalita text-dorado-300">Informe completo</p>
          <h2 className="mt-2 font-serif text-xl font-semibold text-white">
            {summary.hallazgosEstimados > 0
              ? `Detectamos ${summary.hallazgosEstimados} punto${summary.hallazgosEstimados === 1 ? "" : "s"} que merece${summary.hallazgosEstimados === 1 ? "" : "n"} tu atención`
              : "Puntos que merecen tu atención"}
          </h2>
          <ul className="mt-5 space-y-2.5">
            {summary.puntosDeAtencion.map((punto, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-dorado-400" aria-hidden />
                <span className="text-tinta-100">{punto}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-tinta-600 pt-6">
            <p className="max-w-lectura text-sm leading-relaxed text-tinta-200">
              El informe completo analiza el contrato <strong className="font-semibold text-white">cláusula por cláusula</strong>,
              con síntesis, anatomía, vacíos, legalidad, equilibrio y un plan de recomendaciones priorizadas. Descargable en PDF y Word con comentarios.
            </p>
            <button
              type="button"
              onClick={() => handleUnlock(id, classification.tipo_contrato)}
              disabled={unlocking}
              className="mt-5 w-full rounded bg-dorado-500 px-6 py-3.5 text-sm font-semibold text-tinta-900 transition hover:bg-dorado-400 disabled:opacity-60 sm:w-auto"
            >
              {unlocking ? "Procesando…" : `Desbloquear informe · ${formatClp(amountClp)}`}
            </button>
          </div>
        </section>

        <button type="button" onClick={reset} className="text-sm text-tinta-500 underline underline-offset-4 transition hover:text-tinta-800">
          Analizar otro contrato
        </button>
      </div>
    );
  }

  // ── Formulario de subida ─────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pickFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-dorado-500 bg-dorado-50" : "border-tinta-200 bg-papel hover:border-tinta-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <p className="font-serif text-lg font-semibold text-tinta-800">{file.name}</p>
            <p className="mt-1 text-sm text-tinta-500">{(file.size / 1024).toFixed(0)} KB · haz clic para cambiarlo</p>
          </>
        ) : (
          <>
            <p className="font-serif text-lg font-semibold text-tinta-800">Arrastra tu contrato aquí</p>
            <p className="mt-1.5 text-sm text-tinta-500">o haz clic para elegirlo — PDF, Word o texto, hasta {MAX_MB} MB</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-tinta-100" />
        <span className="versalita text-tinta-400">o pega el texto</span>
        <span className="h-px flex-1 bg-tinta-100" />
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value) setFile(null);
        }}
        rows={6}
        placeholder="Pega aquí el texto del contrato…"
        className="w-full rounded border border-tinta-200 bg-white px-3.5 py-3 text-sm leading-relaxed text-tinta-800 shadow-sutil outline-none transition placeholder:text-tinta-300 focus:border-tinta-500 focus:ring-2 focus:ring-tinta-500/15"
      />

      {/* Contexto opcional: colapsado para no añadir fricción a la subida. */}
      <details className="group rounded border border-tinta-100 bg-papel">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-tinta-700">
          <span>
            Añadir contexto{" "}
            <span className="font-normal text-tinta-400">(opcional, mejora el análisis)</span>
          </span>
          <span className="text-tinta-400 transition group-open:rotate-180" aria-hidden>
            ▾
          </span>
        </summary>
        <div className="space-y-4 border-t border-tinta-100 px-4 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="¿Desde qué parte quieres el análisis?" hint="Ej: arrendatario, comprador…">
              <input
                type="text"
                value={perspectiva}
                onChange={(e) => setPerspectiva(e.target.value)}
                placeholder="Opcional"
                className={INPUT}
              />
            </Campo>
            <Campo label="Industria" hint="Ej: retail, construcción, tecnología…">
              <input type="text" value={industria} onChange={(e) => setIndustria(e.target.value)} placeholder="Opcional" className={INPUT} />
            </Campo>
          </div>
          <Campo label="Contexto adicional" hint="Cualquier detalle que ayude al análisis.">
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Opcional"
              className={`${INPUT} leading-relaxed`}
            />
          </Campo>
        </div>
      </details>

      {state.phase === "error" && (
        <p className="border-l-2 border-riesgo-critico bg-riesgo-criticoSuave px-4 py-3 text-sm text-riesgo-critico">{state.message}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={state.phase === "loading"}
        className="w-full rounded bg-tinta-800 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-tinta-700 disabled:opacity-50"
      >
        {state.phase === "loading" ? "Analizando el contrato…" : "Analizar gratis"}
      </button>
      <p className="text-center text-xs text-tinta-400">Gratis y sin crear cuenta. Te explicamos a qué te comprometes.</p>
    </div>
  );
}

const INPUT =
  "w-full rounded border border-tinta-200 bg-white px-3.5 py-2.5 text-sm text-tinta-800 shadow-sutil outline-none transition placeholder:text-tinta-300 focus:border-tinta-500 focus:ring-2 focus:ring-tinta-500/15";

function Campo({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-tinta-800">
        {label} <span className="font-normal text-tinta-400">(opcional)</span>
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-tinta-500">{hint}</p>}
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="versalita border-b border-tinta-100 pb-2 text-tinta-500">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-tinta-700">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-tinta-300" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
