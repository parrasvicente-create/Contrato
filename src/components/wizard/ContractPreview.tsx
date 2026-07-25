"use client";

import type { RenderedClause } from "@/lib/knowledge-base";

// Vista previa del contrato armado. Se presenta como una hoja de documento:
// serif, márgenes generosos y numeración de cláusulas. Lleva la marca de agua
// "VISTA PREVIA" (clase .watermark en globals.css); el documento definitivo,
// sin marca, se genera tras el pago.

interface ContractPreviewProps {
  title: string;
  clauses: RenderedClause[];
  /** Si es false, se muestra sin marca de agua (documento ya pagado). */
  watermark?: boolean;
}

export function ContractPreview({
  title,
  clauses,
  watermark = true,
}: ContractPreviewProps) {
  return (
    <div
      className={`superficie-documento px-6 py-10 sm:px-14 sm:py-14 ${
        watermark ? "watermark" : ""
      }`}
    >
      <header className="mb-10 text-center">
        <h2 className="font-serif text-xl font-semibold uppercase tracking-wide text-tinta-800">
          {title}
        </h2>
        <span className="mx-auto mt-4 block h-px w-16 bg-dorado-500" aria-hidden />
      </header>

      <div className="mx-auto max-w-lectura space-y-6">
        {clauses.map((clause) => (
          <section key={clause.id}>
            <h3 className="font-serif text-sm font-semibold text-tinta-800">
              {clause.heading}
            </h3>
            {clause.text.split(/\n+/).map((paragraph, i) => (
              <p
                key={i}
                className="mt-1.5 text-justify font-serif text-sm leading-7 text-tinta-700"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      {/* Espacio de firmas, genérico: no depende del tipo de contrato. */}
      <div className="mx-auto mt-16 flex max-w-lectura justify-around gap-8 text-center text-xs text-tinta-300">
        <span className="w-40 border-t border-tinta-200 pt-2">Firma</span>
        <span className="w-40 border-t border-tinta-200 pt-2">Firma</span>
      </div>
    </div>
  );
}
