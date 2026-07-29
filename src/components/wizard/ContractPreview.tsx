"use client";

import type React from "react";
import type { RenderedClause } from "@/lib/knowledge-base";

// Vista previa del contrato armado. Se presenta como una hoja de documento:
// serif, márgenes generosos y numeración de cláusulas. Lleva la marca de agua
// "VISTA PREVIA" (clase .watermark en globals.css); el documento definitivo,
// sin marca, se genera tras el pago.
//
// Didáctico: los espacios pendientes (que el motor rellena con "______") se
// resaltan, para que el usuario vea qué se completa con cada respuesta.

interface ContractPreviewProps {
  title: string;
  clauses: RenderedClause[];
  /** Si es false, se muestra sin marca de agua (documento ya pagado). */
  watermark?: boolean;
  /** IDs de cláusulas a resaltar (las que el paso actual está completando). */
  highlightIds?: Set<string>;
  /** Prefijo para dar id a cada sección (permite desplazarse a ella). */
  sectionIdPrefix?: string;
}

/** Resalta los espacios pendientes (secuencias de guiones bajos). */
function renderWithBlanks(text: string, highlight: boolean): React.ReactNode {
  if (!highlight) return text;
  const parts = text.split(/(_{4,})/g);
  return parts.map((part, i) =>
    /^_{4,}$/.test(part) ? (
      <span
        key={i}
        className="mx-0.5 rounded-sm bg-dorado-100 px-1 font-sans text-xs align-middle text-dorado-700"
        title="Se completa con tus respuestas"
      >
        por completar
      </span>
    ) : (
      part
    ),
  );
}

export function ContractPreview({
  title,
  clauses,
  watermark = true,
  highlightIds,
  sectionIdPrefix,
}: ContractPreviewProps) {
  return (
    <div
      className={`superficie-documento px-6 py-8 sm:px-10 sm:py-10 ${
        watermark ? "watermark" : ""
      }`}
    >
      <header className="mb-8 text-center">
        <h2 className="font-serif text-lg font-semibold uppercase tracking-wide text-tinta-800">
          {title}
        </h2>
        <span className="mx-auto mt-3 block h-px w-16 bg-dorado-500" aria-hidden />
      </header>

      <div className="space-y-5">
        {clauses.map((clause) => {
          const active = highlightIds?.has(clause.id) ?? false;
          return (
            <section
              key={clause.id}
              id={sectionIdPrefix ? `${sectionIdPrefix}-clause-${clause.id}` : undefined}
              className={`-mx-3 scroll-mt-6 rounded-md px-3 py-2 transition-colors duration-500 ${
                active ? "bg-dorado-50 ring-1 ring-dorado-300" : "ring-1 ring-transparent"
              }`}
            >
              <h3 className="font-serif text-sm font-semibold text-tinta-800">
                {renderWithBlanks(clause.heading, watermark)}
              </h3>
              {clause.text.split(/\n+/).map((paragraph, i) => (
                <p
                  key={i}
                  className="mt-1.5 text-justify font-serif text-sm leading-7 text-tinta-700"
                >
                  {renderWithBlanks(paragraph, watermark)}
                </p>
              ))}
            </section>
          );
        })}
      </div>

      {/* Espacio de firmas, genérico: no depende del tipo de contrato. */}
      <div className="mt-12 flex justify-around gap-6 text-center text-xs text-tinta-300">
        <span className="w-32 border-t border-tinta-200 pt-2">Firma</span>
        <span className="w-32 border-t border-tinta-200 pt-2">Firma</span>
      </div>
    </div>
  );
}
