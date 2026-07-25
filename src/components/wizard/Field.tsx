"use client";

import type { QuestionField } from "@/lib/knowledge-base";
import { formatRut } from "@/lib/rut";
import { formatClp } from "@/lib/format";

// Renderiza un campo del cuestionario según su tipo. Es genérico: no conoce
// ningún tipo de contrato en particular, solo la definición del campo.

interface FieldProps {
  field: QuestionField;
  value: unknown;
  error?: string;
  onChange: (name: string, value: unknown) => void;
  onBlur: (name: string) => void;
}

const BASE_INPUT =
  "w-full rounded border bg-white px-3 py-2.5 text-sm text-tinta-800 shadow-sutil outline-none transition placeholder:text-tinta-300";

export function Field({ field, value, error, onChange, onBlur }: FieldProps) {
  const inputClass = `${BASE_INPUT} ${
    error
      ? "border-riesgo-critico focus:ring-2 focus:ring-riesgo-critico/20"
      : "border-tinta-200 focus:border-tinta-500 focus:ring-2 focus:ring-tinta-500/15"
  }`;

  const str = value === undefined || value === null ? "" : String(value);

  // Booleanos: casilla con la etiqueta al costado.
  if (field.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded border border-tinta-100 bg-papel p-3.5 transition hover:border-tinta-200">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.name, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-tinta-300 text-tinta-800 focus:ring-tinta-500"
        />
        <span>
          <span className="text-sm font-medium text-tinta-800">
            {field.label}
          </span>
          {field.help && (
            <span className="mt-0.5 block text-xs leading-relaxed text-tinta-500">
              {field.help}
            </span>
          )}
        </span>
      </label>
    );
  }

  return (
    <div>
      <label
        htmlFor={field.name}
        className="mb-1.5 block text-sm font-medium text-tinta-800"
      >
        {field.label}
        {field.required && (
          <span className="ml-1 text-dorado-600" aria-label="obligatorio">
            *
          </span>
        )}
      </label>

      {field.type === "textarea" ? (
        <textarea
          id={field.name}
          value={str}
          rows={4}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          onBlur={() => onBlur(field.name)}
          className={`${inputClass} leading-relaxed`}
        />
      ) : field.type === "select" ? (
        <select
          id={field.name}
          value={str}
          onChange={(e) => onChange(field.name, e.target.value)}
          onBlur={() => onBlur(field.name)}
          className={inputClass}
        >
          <option value="">Selecciona una opción…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={field.name}
          type={
            field.type === "date"
              ? "date"
              : field.type === "money_clp" ||
                  field.type === "money_uf" ||
                  field.type === "number"
                ? "number"
                : "text"
          }
          inputMode={
            field.type === "money_clp" || field.type === "number"
              ? "numeric"
              : undefined
          }
          step={field.type === "money_uf" ? "0.01" : undefined}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.name, e.target.value)}
          // Al salir del campo damos formato chileno al RUT, para que el
          // usuario vea de inmediato cómo quedará en el contrato.
          onBlur={() => {
            if (field.type === "rut" && str.trim() !== "") {
              onChange(field.name, formatRut(str));
            }
            onBlur(field.name);
          }}
          className={inputClass}
        />
      )}

      {/* Eco del monto en formato chileno mientras se escribe. */}
      {field.type === "money_clp" && str !== "" && !Number.isNaN(Number(str)) && (
        <p className="mt-1.5 font-serif text-sm text-dorado-700">
          {formatClp(Number(str))}
        </p>
      )}

      {field.help && !error && (
        <p className="mt-1.5 text-xs leading-relaxed text-tinta-500">
          {field.help}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs font-medium text-riesgo-critico">{error}</p>
      )}
    </div>
  );
}
