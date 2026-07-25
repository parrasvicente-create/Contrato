import { Disclaimer } from "@/components/Disclaimer";
import { ReviewUploader } from "@/components/review/ReviewUploader";
import { isAiConfigured } from "@/lib/ai/client";

export default function RevisarPage() {
  // Avisamos en desarrollo si falta la clave, para no dejar al usuario
  // adivinando por qué el análisis no funciona.
  const aiReady = isAiConfigured();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="versalita text-dorado-600">Revisar contrato</p>
        <h1 className="regla-dorada mt-3 text-3xl font-semibold tracking-tight text-tinta-800">
          ¿Qué dice realmente tu contrato?
        </h1>
        <p className="mt-7 max-w-lectura text-lg leading-relaxed text-tinta-600">
          Sube el contrato que te pasaron y te explicamos, en lenguaje simple, a
          qué te estás comprometiendo.
        </p>
      </header>

      {!aiReady && (
        <p className="border-l-2 border-riesgo-advertencia bg-riesgo-advertenciaSuave px-4 py-3 text-sm text-tinta-700">
          <strong className="font-semibold">Falta configurar la IA.</strong>{" "}
          Define <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> en
          el archivo <code className="font-mono text-xs">.env</code> para
          habilitar el análisis. La detección del tipo seguirá funcionando con la
          heurística de respaldo.
        </p>
      )}

      <ReviewUploader />

      <Disclaimer />
    </div>
  );
}
