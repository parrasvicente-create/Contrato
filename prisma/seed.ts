/**
 * Seed de datos de ejemplo (Etapa 1).
 * Ejecuta:  npm run db:seed
 *
 * Crea operaciones de ejemplo (una de generación y una de revisión) con sus
 * órdenes, para poder probar el flujo y ver datos en Prisma Studio.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Limpieza idempotente
  await db.order.deleteMany();
  await db.operation.deleteMany();

  // 1) Operación de GENERACIÓN (arriendo), ya pagada y completada.
  const generacion = await db.operation.create({
    data: {
      kind: "GENERATE",
      contractTypeId: "arriendo-vivienda",
      status: "COMPLETED",
      amountClp: 9990,
      answers: JSON.stringify({
        arrendador_nombre: "María Elena Soto Fuentes",
        arrendador_rut: "12.345.678-5",
        arrendatario_nombre: "Juan Andrés Pérez Rojas",
        renta_mensual: 450000,
        garantia_meses: 2,
        fecha_inicio: "2026-08-01",
        plazo_meses: 12,
      }),
      order: {
        create: {
          provider: "simulado",
          amountClp: 9990,
          status: "PAID",
          paidAt: new Date(),
        },
      },
    },
    include: { order: true },
  });

  // 2) Operación de REVISIÓN (servicios), con resumen gratis, aún sin pagar.
  const revision = await db.operation.create({
    data: {
      kind: "REVIEW",
      contractTypeId: "prestacion-servicios",
      detectedType: "prestacion-servicios",
      status: "PREVIEW",
      amountClp: 7990,
      sourceFilename: "contrato-honorarios-ejemplo.docx",
      sourceText:
        "CONTRATO DE PRESTACIÓN DE SERVICIOS... El prestador cumplirá jornada de lunes a viernes de 9 a 18 horas en las oficinas del cliente, en forma exclusiva...",
      freeSummary: JSON.stringify({
        aQueTeComprometes: [
          "Prestar servicios de diseño en forma exclusiva para el cliente.",
          "Cumplir horario de oficina de lunes a viernes.",
        ],
        pagos: "Honorario mensual contra boleta.",
        alertaPreliminar:
          "Hay indicios de subordinación laboral (horario fijo + exclusividad).",
      }),
      order: {
        create: {
          provider: "simulado",
          amountClp: 7990,
          status: "PENDING",
        },
      },
    },
    include: { order: true },
  });

  console.log("Seed completado:");
  console.log(`  • Generación: ${generacion.id} (orden ${generacion.order?.status})`);
  console.log(`  • Revisión:   ${revision.id} (orden ${revision.order?.status})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
