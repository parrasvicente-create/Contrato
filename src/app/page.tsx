import Link from "next/link";
import { Disclaimer } from "@/components/Disclaimer";
import { listCatalog } from "@/lib/knowledge-base";
import { formatClp } from "@/lib/format";

// Landing: dos servicios con igual peso (crear y revisar), cada uno con su
// propia muestra del producto. Estructura alternada, limpia en escritorio.

export default function HomePage() {
  const catalog = listCatalog();
  const desdeGenerar = Math.min(...catalog.map((c) => c.generationPriceClp));

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="pt-2 text-center">
        <p className="versalita text-dorado-600">Contratos · Chile</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-tinta-800 sm:text-[3.25rem]">
          El contrato que necesitas,{" "}
          <span className="text-dorado-600">sin la parte difícil</span>.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-tinta-600">
          Ármalo tú mismo en minutos respondiendo un cuestionario, o sube el que
          te pasaron y revísalo cláusula por cláusula. Con criterio legal
          chileno, y empiezas gratis.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/crear"
            className="rounded-md bg-tinta-800 px-7 py-4 text-base font-semibold text-white shadow-panel transition hover:bg-tinta-700"
          >
            Crear un contrato
          </Link>
          <Link
            href="/revisar"
            className="rounded-md border border-tinta-300 bg-white px-7 py-4 text-base font-semibold text-tinta-800 transition hover:border-tinta-800"
          >
            Revisar un contrato
          </Link>
        </div>
      </section>

      {/* ── SHOWCASE · CREAR ─────────────────────────────────────────── */}
      <Showcase
        eyebrow="Crear · 01"
        titulo="Arma el contrato que necesitas, sin fricción"
        parrafo="Eliges el tipo, respondes preguntas simples y el documento se arma solo: las cláusulas se redactan y ajustan con tus respuestas. Descárgalo en Word y PDF, listo para firmar."
        puntos={[
          "Cuestionario guiado, paso a paso",
          "Las cláusulas se completan con tus datos",
          "Vista previa gratis · descargas al pagar",
        ]}
        cta={{ href: "/crear", label: "Crear un contrato" }}
        muestra={<CreatePreview />}
        precio={`desde ${formatClp(desdeGenerar)}`}
      />

      {/* ── SHOWCASE · REVISAR (muestra a la izquierda) ──────────────── */}
      <Showcase
        eyebrow="Revisar · 02"
        titulo="Revisa antes de firmar lo que te pasaron"
        parrafo="Sube el contrato y recibe un informe cláusula por cláusula: qué es riesgoso, por qué, y una redacción alternativa concreta. En el Word, cada cambio va marcado como control de cambios para negociar."
        puntos={[
          "Semáforo de riesgo por cláusula",
          "Cada hallazgo cita el texto exacto",
          "Resumen gratis · sin crear cuenta",
        ]}
        cta={{ href: "/revisar", label: "Revisar un contrato" }}
        muestra={<ReportPreview />}
        invertir
      />

      {/* ── POR QUÉ RESGUARDO ────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-tinta-800 sm:text-3xl">
            No es un chatbot que opina. Es trabajo legal que puedes defender.
          </h2>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-tinta-100 bg-tinta-100 sm:grid-cols-2 lg:grid-cols-4">
          <Feature titulo="Ley chilena" texto="Código Civil, Ley 18.101, 19.496, 21.719 y más. Nada de normativa inventada." />
          <Feature titulo="Cita textual" texto="Cada hallazgo copia la cláusula que lo origina. Si no está, no lo inventamos." />
          <Feature titulo="Semáforo claro" texto="Rojo, ámbar y verde: qué es grave, qué negociar y qué está bien." />
          <Feature titulo="Listo para usar" texto="Word y PDF: el contrato generado, o el revisado con control de cambios." />
        </div>
      </section>

      {/* ── CATÁLOGO ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-tinta-800 sm:text-3xl">
          Tipos de contrato que puedes generar
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {catalog.map((c) => (
            <Link
              key={c.id}
              href={`/crear/${c.id}`}
              className="group flex flex-col border border-tinta-100 bg-papel p-5 transition hover:border-tinta-300"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-tinta-800">{c.name}</h3>
                <span className="shrink-0 text-sm text-tinta-400">
                  {formatClp(c.generationPriceClp)}
                </span>
              </div>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-tinta-600">
                {c.description}
              </p>
              <span className="mt-4 text-sm font-medium text-tinta-500 transition group-hover:text-tinta-800">
                Comenzar →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
}

/** Sección showcase: texto + muestra del producto, lado a lado, alternable. */
function Showcase({
  eyebrow,
  titulo,
  parrafo,
  puntos,
  cta,
  muestra,
  precio,
  invertir = false,
}: {
  eyebrow: string;
  titulo: string;
  parrafo: string;
  puntos: string[];
  cta: { href: string; label: string };
  muestra: React.ReactNode;
  precio?: string;
  invertir?: boolean;
}) {
  return (
    <section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={invertir ? "lg:order-2" : ""}>
        <p className="versalita text-dorado-600">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-tinta-800 sm:text-3xl">
          {titulo}
        </h2>
        <p className="mt-4 max-w-xl text-tinta-600">{parrafo}</p>
        <ul className="mt-6 space-y-2.5">
          {puntos.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm text-tinta-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-sm bg-dorado-500" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          <Link
            href={cta.href}
            className="rounded-md bg-tinta-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-tinta-700"
          >
            {cta.label} →
          </Link>
          {precio && <span className="text-sm text-tinta-400">{precio}</span>}
        </div>
      </div>
      <div className={invertir ? "lg:order-1" : ""}>{muestra}</div>
    </section>
  );
}

function Feature({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="bg-papel p-6">
      <h3 className="font-semibold text-tinta-800">{titulo}</h3>
      <p className="mt-2 text-sm leading-relaxed text-tinta-600">{texto}</p>
    </div>
  );
}

/** Muestra del armado de contrato: respuestas → cláusula generada. */
function CreatePreview() {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-4 z-10 rounded-full border border-tinta-100 bg-hueso px-3 py-0.5 text-xs font-medium text-tinta-400">
        Ejemplo de armado
      </span>
      <div className="superficie-documento p-5 sm:p-6">
        <p className="versalita text-tinta-400">Tus respuestas</p>
        <div className="mt-3 space-y-2.5">
          <MockField label="Renta mensual" valor={formatClp(450000)} />
          <MockField label="Plazo del contrato" valor="12 meses" />
          <MockToggle label="Incluir reajuste según IPC" activo />
        </div>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-tinta-100" />
          <span className="versalita text-dorado-600">se arma solo</span>
          <span className="h-px flex-1 bg-tinta-100" />
        </div>

        <div className="rounded border border-tinta-100 bg-hueso p-4">
          <p className="font-serif text-sm font-semibold text-tinta-800">
            TERCERO: De la renta.
          </p>
          <p className="mt-1 font-serif text-sm leading-7 text-tinta-700">
            La renta mensual será la suma de{" "}
            <mark className="bg-dorado-100 px-0.5 text-tinta-800">
              {formatClp(450000)}
            </mark>
            , por un plazo de{" "}
            <mark className="bg-dorado-100 px-0.5 text-tinta-800">12 meses</mark>. La
            renta se reajustará según la variación del IPC.
          </p>
        </div>
      </div>
    </div>
  );
}

function MockField({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-tinta-600">{label}</span>
      <span className="rounded border border-tinta-200 bg-white px-3 py-1.5 text-sm font-medium text-tinta-800">
        {valor}
      </span>
    </div>
  );
}

function MockToggle({ label, activo }: { label: string; activo: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-tinta-600">{label}</span>
      <span
        className={`flex h-5 w-9 items-center rounded-full px-0.5 ${
          activo ? "justify-end bg-riesgo-ok" : "justify-start bg-tinta-200"
        }`}
        aria-hidden
      >
        <span className="h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}

/** Muestra de una revisión: semáforo, cita y redline. */
function ReportPreview() {
  return (
    <div className="relative">
      <span className="absolute -top-3 left-4 z-10 rounded-full border border-tinta-100 bg-hueso px-3 py-0.5 text-xs font-medium text-tinta-400">
        Ejemplo de informe
      </span>
      <div className="superficie-documento overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-tinta-100 px-5 py-3">
          <span className="h-5 w-1.5 rounded-sm bg-riesgo-critico" aria-hidden />
          <span className="versalita text-riesgo-critico">Riesgo global: rojo</span>
          <span className="ml-auto text-xs text-tinta-400">Arriendo · 5 hallazgos</span>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-riesgo-criticoSuave px-2 py-0.5 text-xs font-semibold text-riesgo-critico">
              Riesgo alto
            </span>
            <span className="text-xs text-tinta-500">Cláusula QUINTA</span>
          </div>
          <h4 className="mt-2 font-serif text-base font-semibold text-tinta-800">
            Reparaciones estructurales a cargo del arrendatario
          </h4>
          <blockquote className="mt-3 border-l-2 border-dorado-400 pl-4">
            <p className="font-serif text-sm italic leading-7 text-tinta-700">
              «Serán de cargo exclusivo de la Arrendataria todas las reparaciones
              que requiera el inmueble…»
            </p>
          </blockquote>
          <div className="mt-4">
            <p className="versalita mb-1.5 text-riesgo-ok">Redacción propuesta</p>
            <p className="font-serif text-sm leading-7 text-riesgo-critico line-through decoration-riesgo-critico/40">
              …todas las reparaciones que requiera el inmueble.
            </p>
            <p className="font-serif text-sm leading-7 text-tinta-800">
              …únicamente las reparaciones locativas; las estructurales
              corresponden al Arrendador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
