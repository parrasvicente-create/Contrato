import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { listCatalog } from "@/lib/knowledge-base";
import { formatClp } from "@/lib/format";

export default function CrearPage() {
  const catalog = listCatalog();

  return (
    <div className="space-y-10">
      <header>
        <p className="versalita text-dorado-600">Crear contrato</p>
        <h1 className="regla-dorada mt-3 text-3xl font-semibold tracking-tight text-tinta-800">
          Elige el tipo de contrato
        </h1>
        <p className="mt-6 max-w-lectura text-tinta-600">
          Respondes un cuestionario paso a paso y armamos el documento. La vista
          previa es gratis; pagas solo si decides descargarlo.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {catalog.map((c) => (
          <article
            key={c.id}
            className="flex flex-col border border-tinta-100 bg-papel p-6 shadow-sutil transition hover:border-tinta-300"
          >
            <h2 className="text-xl font-semibold text-tinta-800">{c.name}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-tinta-600">
              {c.description}
            </p>

            {c.legalBasis.length > 0 && (
              <ul className="mt-4 space-y-1">
                {c.legalBasis.map((l) => (
                  <li key={l} className="text-xs text-tinta-400">
                    {l}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex items-baseline justify-between border-t border-tinta-100 pt-4">
              <span className="versalita text-tinta-400">Precio</span>
              <span className="font-serif text-xl font-semibold text-tinta-800">
                {formatClp(c.generationPriceClp)}
              </span>
            </div>

            <Link
              href={`/crear/${c.id}`}
              className="mt-4 rounded bg-tinta-800 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-tinta-700"
            >
              Comenzar
            </Link>
          </article>
        ))}
      </div>

      <Disclaimer />
    </div>
  );
}
