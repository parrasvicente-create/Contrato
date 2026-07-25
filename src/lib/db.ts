import { PrismaClient } from "@prisma/client";

// Cliente Prisma como singleton. En desarrollo Next.js recarga los módulos
// con hot-reload, lo que crearía muchas conexiones; guardamos la instancia
// en el objeto global para reutilizarla.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
