import type { Config } from "tailwindcss";

// ─────────────────────────────────────────────────────────────────────────
// Sistema de diseño de Resguardo — dirección "institucional / confianza".
//
// Azul tinta como color de autoridad (legal y financiero), dorado apagado
// como acento cálido, y fondo hueso en vez de blanco puro para bajar el
// contraste y hacer más cómoda la lectura de documentos largos.
//
// El semáforo de riesgo usa tonos DESATURADOS a propósito: en un informe
// legal queremos que la persona confíe en el diagnóstico, no que entre en
// pánico. Un rojo alarma haría ver alarmista un análisis serio.
// ─────────────────────────────────────────────────────────────────────────

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul tinta: color principal de marca.
        tinta: {
          50: "#F2F5F8",
          100: "#E3EAF1",
          200: "#C7D5E3",
          300: "#94AEC7",
          400: "#5C7FA3",
          500: "#2F5578",
          600: "#1C3F5E",
          700: "#143049",
          800: "#0F2942", // color base de marca
          900: "#0A1C2E",
        },
        // Dorado apagado: acento, reglas y detalles. Nunca para texto largo.
        dorado: {
          50: "#FBF7F1",
          100: "#F5EBDA",
          200: "#E9D5B4",
          300: "#D9B884",
          400: "#C89E60",
          500: "#B8894A", // acento base
          600: "#9A6F3A",
          700: "#7B5730",
          800: "#5F432A",
          900: "#4A3524",
        },
        // Fondos: hueso (app) y papel (superficies de documento).
        hueso: "#FAF8F5",
        papel: "#FFFDFA",

        // Semáforo de riesgo. Cada tono está pensado para leerse sobre hueso.
        riesgo: {
          critico: "#B3261E",
          criticoSuave: "#FBEDEC",
          advertencia: "#A8730A",
          advertenciaSuave: "#FDF4E3",
          sugerencia: "#1C5D99",
          sugerenciaSuave: "#EDF4FA",
          ok: "#2E6B4F",
          okSuave: "#EDF5F1",
        },
      },
      fontFamily: {
        // Serif para títulos y citas de cláusulas: da peso documental.
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
        // Sans para interfaz, formularios y datos.
        sans: ["var(--font-sans)", "system-ui", "Segoe UI", "sans-serif"],
      },
      letterSpacing: {
        versalita: "0.12em",
      },
      boxShadow: {
        // Sombras muy suaves: la jerarquía la dan los bordes, no la elevación.
        sutil: "0 1px 2px 0 rgb(15 41 66 / 0.04)",
        panel: "0 2px 8px -2px rgb(15 41 66 / 0.08)",
      },
      borderRadius: {
        // Esquinas contenidas: nada demasiado redondeado.
        DEFAULT: "4px",
        md: "5px",
        lg: "6px",
        xl: "8px",
      },
      maxWidth: {
        lectura: "68ch", // ancho cómodo para leer texto legal
      },
    },
  },
  plugins: [],
};

export default config;
