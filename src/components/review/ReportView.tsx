"use client";

import { useEffect, useRef, useState } from "react";
import type { FullReport, NivelRiesgo } from "@/lib/ai/schemas";

// Pantalla del informe completo. El informe se genera en SEGUNDO PLANO tras el
// pago (ver report-job.ts); este componente lo dispara, sondea el estado y
// muestra progreso por etapas. Cuando está listo, renderiza el informe con la
// estructura del spec (I. Síntesis … VII. Recomendaciones).

type ServerStatus = "PENDING" | "GENERATING" | "READY" | "ERROR";
type State =
  | { phase: "working" }
  | { phase: "ready"; report: FullReport }
  | { phase: "error"; message: string };

const POLL_MS = 3000;
const ETAPAS = [
  { hasta: 15, texto: "Leyendo el contrato…" },
  { hasta: 45, texto: "Identificando las cláusulas…" },
  { hasta: 90, texto: "Contrastando con la legislación chilena…" },
  { hasta: Infinity, texto: "Redactando el informe…" },
];

export function ReportView({ operationId }: { operationId: string }) {
  const [state, setState] = useState<State>({ phase: "working" });
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimers() {
    if (pollRef.current) clearTimeout(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  }

  function start() {
    stopTimers();
    setState({ phase: "working" });
    setElapsed(0);
    tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    let cancelled = false;
    const finish = () => {
      cancelled = true;
      stopTimers();
    };

    fetch(`/api/operations/${operationId}/report/generate`, { method: "POST" }).catch(() => {});

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/operations/${operationId}/report`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ phase: "error", message: data.error ?? "No se pudo cargar el informe." });
          finish();
          return;
        }
        const status = data.status as ServerStatus;
        if (status === "READY" && data.report) {
          setState({ phase: "ready", report: data.report as FullReport });
          finish();
          return;
        }
        if (status === "ERROR") {
          setState({ phase: "error", message: data.error ?? "No se pudo generar el informe." });
          finish();
          return;
        }
        pollRef.current = setTimeout(poll, POLL_MS);
      } catch {
        if (!cancelled) pollRef.current = setTimeout(poll, POLL_MS);
      }
    };
    poll();
    return finish;
  }

  useEffect(() => {
    const finish = start();
    return () => {
      finish?.();
      stopTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operationId]);

  if (state.phase === "working") {
    const etapa = ETAPAS.find((e) => elapsed < e.hasta)?.texto ?? "";
    const mm = Math.floor(elapsed / 60);
    const ss = String(elapsed % 60).padStart(2, "0");
    return (
      <div className="superficie-documento px-6 py-14 text-center sm:px-10">
        <p className="versalita text-dorado-600">Analizando</p>
        <p className="mt-3 font-serif text-xl font-semibold text-tinta-800">{etapa}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-tinta-500">
          Un abogado especialista revisa tu contrato cláusula por cláusula y lo
          contrasta con la legislación chilena. Suele tardar entre uno y dos
          minutos; puedes esperar aquí sin problema.
        </p>
        <div className="mx-auto mt-7 h-1.5 w-56 overflow-hidden rounded-sm bg-tinta-100">
          <div className="report-progress h-full w-1/3 rounded-sm bg-dorado-500" />
        </div>
        <p className="mt-3 font-serif text-sm tabular-nums text-tinta-400">
          {mm}:{ss}
        </p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="superficie-documento p-8 text-center">
        <p className="versalita text-riesgo-critico">No se pudo generar</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-tinta-600">{state.message}</p>
        <p className="mt-2 text-xs text-tinta-400">
          Tu pago está registrado. Puedes reintentar sin costo.
        </p>
        <button
          type="button"
          onClick={() => start()}
          className="mt-6 rounded bg-tinta-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-tinta-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return <ReportBody report={state.report} operationId={operationId} />;
}

// ── Render del informe (estructura del spec) ─────────────────────────────

const RIESGO: Record<NivelRiesgo, { barra: string; texto: string; fondo: string; etiqueta: string }> = {
  ALTO: { barra: "bg-riesgo-critico", texto: "text-riesgo-critico", fondo: "bg-riesgo-criticoSuave", etiqueta: "Riesgo alto" },
  MEDIO: { barra: "bg-riesgo-advertencia", texto: "text-riesgo-advertencia", fondo: "bg-riesgo-advertenciaSuave", etiqueta: "Riesgo medio" },
  BAJO: { barra: "bg-riesgo-sugerencia", texto: "text-riesgo-sugerencia", fondo: "bg-riesgo-sugerenciaSuave", etiqueta: "Riesgo bajo" },
};

const GLOBAL: Record<FullReport["meta"]["riesgo_global"], { barra: string; texto: string; etiqueta: string }> = {
  ROJO: { barra: "bg-riesgo-critico", texto: "text-riesgo-critico", etiqueta: "Riesgo global: rojo" },
  AMARILLO: { barra: "bg-riesgo-advertencia", texto: "text-riesgo-advertencia", etiqueta: "Riesgo global: amarillo" },
  VERDE: { barra: "bg-riesgo-ok", texto: "text-riesgo-ok", etiqueta: "Riesgo global: verde" },
};

const PRIORIDAD: Record<string, string> = {
  Crítico: "bg-riesgo-criticoSuave text-riesgo-critico",
  Negociable: "bg-riesgo-advertenciaSuave text-riesgo-advertencia",
  Menor: "bg-tinta-100 text-tinta-500",
};

function ReportBody({ report, operationId }: { report: FullReport; operationId: string }) {
  const gl = GLOBAL[report.meta.riesgo_global];
  const conteo = report.analisis_clausulas.reduce<Record<string, number>>((acc, c) => {
    acc[c.nivel_riesgo] = (acc[c.nivel_riesgo] ?? 0) + 1;
    return acc;
  }, {});

  // Índice de secciones: solo las que existen en este informe.
  const secciones = [
    { id: "sec-sintesis", label: "Síntesis" },
    { id: "sec-anatomia", label: "Anatomía" },
    { id: "sec-clausulas", label: `Cláusulas · ${report.analisis_clausulas.length}` },
    report.vacios_contractuales.length > 0 ? { id: "sec-vacios", label: "Vacíos" } : null,
    { id: "sec-legalidad", label: "Legalidad" },
    { id: "sec-equilibrio", label: "Equilibrio" },
    { id: "sec-recomendaciones", label: "Recomendaciones" },
  ].filter((x): x is { id: string; label: string } => x !== null);

  const descargas = (
    <>
      <a
        href={`/api/operations/${operationId}/report?format=docx`}
        className="whitespace-nowrap rounded border border-tinta-300 px-3.5 py-2 text-sm font-semibold text-tinta-700 transition hover:border-tinta-800 hover:bg-white"
      >
        Word con redline
      </a>
      <a
        href={`/api/operations/${operationId}/report?format=pdf`}
        className="whitespace-nowrap rounded border border-tinta-300 px-3.5 py-2 text-sm font-semibold text-tinta-700 transition hover:border-tinta-800 hover:bg-white"
      >
        PDF
      </a>
    </>
  );

  return (
    <article className="space-y-10 sm:space-y-12">
      <div className="space-y-3">
        {/* Descargas (fila normal). */}
        <div className="flex flex-wrap justify-end gap-2">{descargas}</div>

        {/* Índice fijo: chips navegables, siempre a la vista al hacer scroll. */}
        <div className="sticky top-0 z-20 -mx-4 border-b border-tinta-100 bg-hueso/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
          <nav
            aria-label="Secciones del informe"
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto"
          >
            {secciones.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium text-tinta-600 transition hover:bg-tinta-100 hover:text-tinta-900"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* I. Síntesis y veredicto */}
      <section id="sec-sintesis" className="scroll-anchor superficie-documento p-6 sm:p-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`h-8 w-1.5 rounded-sm ${gl.barra}`} aria-hidden />
            <p className={`versalita ${gl.texto}`}>{gl.etiqueta}</p>
          </div>
          {report.meta.perspectiva_revision && (
            <p className="text-xs text-tinta-500">
              Perspectiva: <span className="font-medium text-tinta-700">{report.meta.perspectiva_revision}</span>
            </p>
          )}
        </div>

        <h2 className="mt-5 font-serif text-xl font-semibold text-tinta-800">Síntesis y veredicto</h2>
        <p className="mt-3 max-w-lectura font-serif text-[15px] leading-8 text-tinta-700">{report.meta.veredicto_breve}</p>

        <dl className="mt-6 grid gap-x-10 gap-y-4 border-t border-tinta-100 pt-5 sm:grid-cols-2">
          <Dato label="Naturaleza jurídica" valor={report.sintesis.naturaleza_juridica} />
          <Dato label="Objeto" valor={report.sintesis.objeto} />
          <Dato label="Plazo" valor={report.sintesis.plazo} />
          <Dato label="Contraprestación" valor={report.sintesis.contraprestacion} />
          {report.sintesis.partes.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="versalita text-tinta-400">Partes</dt>
              <dd className="mt-2 flex flex-wrap gap-x-8 gap-y-1.5">
                {report.sintesis.partes.map((p, i) => (
                  <span key={i} className="text-sm text-tinta-700">
                    <span className="font-medium text-tinta-800">{p.nombre}</span>
                    <span className="text-tinta-400"> · {p.rol}</span>
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>

        {report.analisis_clausulas.length > 0 && (
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t border-tinta-100 pt-5">
            {(["ALTO", "MEDIO", "BAJO"] as const).map((n) =>
              conteo[n] ? (
                <div key={n} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-sm ${RIESGO[n].barra}`} aria-hidden />
                  <dt className="text-sm text-tinta-600">{RIESGO[n].etiqueta}</dt>
                  <dd className="font-serif text-sm font-semibold text-tinta-800">{conteo[n]}</dd>
                </div>
              ) : null,
            )}
          </dl>
        )}
      </section>

      {/* II. Anatomía */}
      <Seccion id="sec-anatomia" titulo="Anatomía del contrato">
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          <Dato label="Tipo y naturaleza jurídica" valor={report.anatomia.tipo_naturaleza_juridica} />
          <Dato label="Régimen económico" valor={report.anatomia.regimen_economico} />
          <Dato label="Vigencia, renovación y término" valor={report.anatomia.vigencia_renovacion_termino} />
          <Dato label="Ley aplicable y controversias" valor={report.anatomia.ley_aplicable_y_controversias} />
          {report.anatomia.obligaciones_reciprocas.length > 0 && (
            <div className="sm:col-span-2">
              <dt className="versalita text-tinta-400">Obligaciones recíprocas</dt>
              <ul className="mt-2 space-y-1.5">
                {report.anatomia.obligaciones_reciprocas.map((o, i) => (
                  <li key={i} className="text-sm text-tinta-700">
                    <span className="font-medium text-tinta-800">{o.parte}:</span> {o.obligacion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </dl>
      </Seccion>

      {/* III. Análisis por cláusula */}
      <Seccion id="sec-clausulas" titulo="Análisis por cláusula">
        {report.analisis_clausulas.length === 0 ? (
          <p className="superficie-documento p-6 text-sm text-tinta-600">Sin cláusulas observadas.</p>
        ) : (
          <ol className="space-y-6">
            {report.analisis_clausulas.map((c, i) => {
              const s = RIESGO[c.nivel_riesgo];
              return (
                <li key={i} className="superficie-documento overflow-hidden">
                  <div className={`flex items-center gap-3 px-5 py-3 sm:px-6 ${s.fondo}`}>
                    <span className={`h-4 w-1 shrink-0 rounded-sm ${s.barra}`} aria-hidden />
                    <span className={`versalita shrink-0 ${s.texto}`}>{s.etiqueta}</span>
                    <span className="ml-auto min-w-0 truncate text-xs text-tinta-500">{c.clausula}</span>
                  </div>
                  <div className="px-5 py-5 sm:px-8 sm:py-6">
                    <h3 className="font-serif text-lg font-semibold text-tinta-800">
                      <span className="mr-2 text-tinta-300">{i + 1}.</span>
                      {c.clausula}
                    </h3>
                    {c.cita_textual && (
                      <blockquote className="mt-4 border-l-2 border-dorado-400 py-1 pl-5">
                        <p className="font-serif text-[15px] italic leading-8 text-tinta-700">«{c.cita_textual}»</p>
                      </blockquote>
                    )}
                    <dl className="mt-6 space-y-4 border-t border-tinta-100 pt-5">
                      <Dato label="Qué establece" valor={c.que_establece} />
                      <Dato label="Por qué importa" valor={c.por_que_importa} />
                    </dl>
                    <div className="mt-5">
                      <p className="versalita mb-2 text-dorado-600">Cómo abordarlo</p>
                      <div className="rounded border border-dashed border-tinta-200 bg-hueso px-4 py-3">
                        <p className="font-serif text-sm leading-7 text-tinta-700">{c.como_abordarlo}</p>
                      </div>
                    </div>

                    {/* Redacción alternativa: se muestra como redline (lo que
                        se propone reemplazar). En el Word va como control de cambios. */}
                    {c.redaccion_alternativa && (
                      <div className="mt-4">
                        <p className="versalita mb-2 text-riesgo-ok">Redacción propuesta</p>
                        {c.cita_textual && (
                          <p className="mb-1.5 font-serif text-sm leading-7 text-riesgo-critico line-through decoration-riesgo-critico/50">
                            {c.cita_textual}
                          </p>
                        )}
                        <div className="rounded border border-riesgo-ok/30 bg-riesgo-okSuave px-4 py-3">
                          <p className="font-serif text-sm leading-7 text-tinta-800">
                            {c.redaccion_alternativa}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Nota que se le muestra a la contraparte junto al redline */}
                    {c.justificacion_contraparte && (
                      <div className="mt-4 rounded bg-tinta-50 px-4 py-3">
                        <p className="versalita mb-1.5 text-tinta-400">Nota para la contraparte</p>
                        <p className="text-sm leading-relaxed text-tinta-600">{c.justificacion_contraparte}</p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Seccion>

      {/* IV. Vacíos */}
      {report.vacios_contractuales.length > 0 && (
        <Seccion id="sec-vacios" titulo="Vacíos contractuales">
          <ul className="divide-y divide-tinta-100 border-y border-tinta-100">
            {report.vacios_contractuales.map((v, i) => (
              <li key={i} className="py-4">
                <p className="text-sm font-semibold text-tinta-800">{v.clausula_ausente}</p>
                <p className="mt-1 text-sm leading-relaxed text-tinta-600">
                  <span className="text-tinta-400">Efecto: </span>{v.efecto_de_la_ausencia}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-tinta-600">
                  <span className="text-tinta-400">Régimen supletorio: </span>{v.regimen_supletorio}
                </p>
                {/* Cláusula propuesta: en el Word va insertada como texto nuevo */}
                {v.clausula_propuesta && (
                  <div className="mt-3">
                    <p className="versalita mb-1.5 text-riesgo-ok">Cláusula propuesta</p>
                    <div className="rounded border border-riesgo-ok/30 bg-riesgo-okSuave px-4 py-3">
                      <p className="font-serif text-sm leading-7 text-tinta-800">{v.clausula_propuesta}</p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* V. Legalidad y validez */}
      <Seccion id="sec-legalidad" titulo="Legalidad y validez">
        {!report.legalidad_y_validez.hay_riesgos ? (
          <p className="flex items-center gap-3 border border-riesgo-ok/30 bg-riesgo-okSuave p-4 text-sm text-tinta-700">
            <span className="h-2.5 w-2.5 rounded-sm bg-riesgo-ok" aria-hidden />
            No se detectaron cláusulas nulas, abusivas o inoponibles, ni alertas regulatorias relevantes.
          </p>
        ) : (
          <ul className="space-y-4">
            {report.legalidad_y_validez.observaciones.map((o, i) => (
              <li key={i} className="superficie-documento p-6">
                <p className="text-sm font-semibold text-tinta-800">{o.clausula}</p>
                <p className="mt-2 text-sm leading-relaxed text-tinta-700">{o.problema}</p>
                {o.fundamento_normativo && (
                  <p className="mt-2 text-xs text-tinta-400">{o.fundamento_normativo}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {/* VI. Equilibrio */}
      <Seccion id="sec-equilibrio" titulo="Equilibrio contractual">
        <div className="border border-tinta-100 bg-papel p-5">
          <p className={`versalita ${report.equilibrio_contractual.hay_asimetria_relevante ? "text-riesgo-advertencia" : "text-riesgo-ok"}`}>
            {report.equilibrio_contractual.hay_asimetria_relevante ? "Hay asimetría relevante" : "Sin asimetría jurídicamente relevante"}
          </p>
          <p className="mt-2 max-w-lectura text-sm leading-relaxed text-tinta-700">{report.equilibrio_contractual.descripcion}</p>
        </div>
      </Seccion>

      {/* VII. Recomendaciones */}
      <Seccion id="sec-recomendaciones" titulo="Recomendaciones">
        <ol className="space-y-2.5">
          {report.recomendaciones.map((r, i) => (
            <li key={i} className="flex items-start gap-4 border border-tinta-100 bg-papel p-4">
              <span className="font-serif text-sm font-semibold text-tinta-300">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-tinta-700">{r.descripcion}</p>
                {r.clausula_relacionada && (
                  <p className="mt-0.5 text-xs text-tinta-400">{r.clausula_relacionada}</p>
                )}
              </div>
              <span className={`shrink-0 rounded-sm px-2 py-0.5 text-xs font-semibold ${PRIORIDAD[r.prioridad] ?? "bg-tinta-100 text-tinta-500"}`}>
                {r.prioridad}
              </span>
            </li>
          ))}
        </ol>
      </Seccion>

      <p className="border-t border-tinta-100 pt-6 text-xs leading-relaxed text-tinta-400">{report.cierre}</p>
    </article>
  );
}

function Seccion({
  id,
  titulo,
  children,
}: {
  id?: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-anchor">
      <h2 className="regla-dorada mb-6 text-xl font-semibold tracking-tight text-tinta-800 sm:mb-7 sm:text-2xl">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="versalita text-tinta-400">{label}</dt>
      <dd className="mt-1 max-w-lectura text-sm leading-relaxed text-tinta-700">{valor}</dd>
    </div>
  );
}
