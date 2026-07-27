import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/health — diagnóstico de configuración en producción.
//
// Comprueba, SIN exponer secretos, si la app puede:
//   - conectarse a la base de datos (y, si no, con qué error de Prisma), y
//   - si la clave de la IA está presente.
// Útil para depurar despliegues (Railway/Vercel). No devuelve contraseñas ni
// la API key: solo host/puerto y códigos de error.

export const dynamic = "force-dynamic";

function urlParts(raw?: string): {
  host: string | null;
  port: string | null;
  pgbouncer: boolean;
} {
  if (!raw) return { host: null, port: null, pgbouncer: false };
  try {
    const u = new URL(raw);
    return {
      host: u.hostname,
      port: u.port || null,
      pgbouncer: u.searchParams.get("pgbouncer") === "true",
    };
  } catch {
    return { host: "no-parseable", port: null, pgbouncer: false };
  }
}

export async function GET() {
  const dbUrl = urlParts(process.env.DATABASE_URL);
  const directUrl = urlParts(process.env.DIRECT_URL);

  const result: Record<string, unknown> = {
    env: {
      DATABASE_URL: dbUrl,
      DIRECT_URL: directUrl,
      ANTHROPIC_API_KEY_present: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL ?? null,
    },
  };

  try {
    await db.$queryRaw`SELECT 1`;
    result.db = "ok";
  } catch (err) {
    const e = err as { code?: string; name?: string; message?: string };
    result.db = "error";
    result.dbError = {
      code: e?.code ?? null,
      name: e?.name ?? null,
      message: String(e?.message ?? err).slice(0, 600),
    };
  }

  return NextResponse.json(result, {
    status: result.db === "ok" ? 200 : 503,
  });
}
