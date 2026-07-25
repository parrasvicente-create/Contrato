import { DISCLAIMER } from "@/lib/constants";

/**
 * Aviso legal obligatorio, visible en ambos módulos.
 * Deliberadamente sobrio: informa sin competir visualmente con el contenido.
 */
export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <aside
      className={`rounded-lg border-l-2 border-dorado-500 bg-dorado-50/60 px-4 py-3 ${className}`}
      role="note"
    >
      <p className="versalita mb-1 text-dorado-700">Aviso</p>
      <p className="text-sm leading-relaxed text-tinta-600">{DISCLAIMER}</p>
    </aside>
  );
}
