import type { Metadata } from "next";
import Link from "next/link";
import { Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

// Tipografías auto-alojadas por Next en el build: no hay peticiones a
// servidores externos en tiempo de ejecución.
//   Lora  → títulos y citas de cláusulas (peso documental)
//   Source Sans 3 → interfaz, formularios y datos
const serif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description:
    "Genera y revisa contratos en Chile. Crea documentos a partir de plantillas o sube un contrato para recibir un informe de riesgo cláusula por cláusula.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className={`${serif.variable} ${sans.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <header className="border-b border-tinta-800 bg-tinta-800 text-tinta-50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3.5 sm:px-6">
            <Link href="/" className="group flex shrink-0 items-center gap-2.5">
              {/* Marca: barra dorada + nombre en serif */}
              <span className="h-6 w-1 rounded-sm bg-dorado-500" aria-hidden />
              <span className="font-serif text-lg font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>

            <nav className="flex items-center gap-1 text-sm">
              <NavLink href="/crear">Crear</NavLink>
              <NavLink href="/revisar">Revisar</NavLink>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          {children}
        </main>

        <footer className="mt-8 border-t border-tinta-100 bg-papel">
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-tinta-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              © {new Date().getFullYear()} {APP_NAME}
            </p>
            <p>No constituye asesoría legal.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded px-3 py-1.5 text-tinta-100 transition hover:bg-tinta-700 hover:text-white"
    >
      {children}
    </Link>
  );
}
