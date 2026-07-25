import Link from "next/link";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/Disclaimer";
import { Wizard, type WizardContract } from "@/components/wizard/Wizard";
import { contractTypes, getContractType } from "@/lib/knowledge-base";

// Genera estáticamente las rutas de los tipos de contrato conocidos.
export function generateStaticParams() {
  return contractTypes.map((c) => ({ tipo: c.id }));
}

export default function WizardPage({ params }: { params: { tipo: string } }) {
  const contract = getContractType(params.tipo);
  if (!contract) notFound();

  // Enviamos al cliente solo lo necesario para el wizard: metadatos,
  // cuestionario y cláusulas. Las reglas de riesgo se quedan en el servidor.
  const wizardContract: WizardContract = {
    id: contract.id,
    name: contract.name,
    description: contract.description,
    generationPriceClp: contract.generationPriceClp,
    steps: contract.steps,
    clauses: contract.clauses,
  };

  return (
    <div className="space-y-8">
      <header>
        <Link
          href="/crear"
          className="text-sm text-tinta-500 transition hover:text-tinta-800"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta-800">
          {contract.name}
        </h1>
        <p className="mt-2 max-w-lectura text-tinta-600">
          {contract.description}
        </p>
      </header>

      <Wizard contract={wizardContract} />

      <Disclaimer />
    </div>
  );
}
