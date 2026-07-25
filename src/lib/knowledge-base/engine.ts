import { z } from "zod";
import { formatClp, formatDate, formatUf, formatNumber } from "@/lib/format";
import { formatRut, isValidRut } from "@/lib/rut";
import type {
  AssemblableContract,
  ClauseBlock,
  Condition,
  ContractType,
  FieldType,
  QuestionField,
} from "./types";
import { allFields } from "./types";

// ─────────────────────────────────────────────────────────────────────────
// MOTOR de la base de conocimiento.
//
// Contiene lógica genérica (independiente del tipo de contrato) para:
//   1. Evaluar condiciones declarativas contra las respuestas.
//   2. Renderizar el texto de las cláusulas reemplazando placeholders.
//   3. Ensamblar el documento completo (solo las cláusulas aplicables).
//   4. Construir un validador zod a partir del cuestionario.
// ─────────────────────────────────────────────────────────────────────────

export type Answers = Record<string, unknown>;

// ── 1. Evaluación de condiciones ──────────────────────────────────────────

/** Evalúa una condición declarativa contra las respuestas. Sin `eval`. */
export function evalCondition(cond: Condition, answers: Answers): boolean {
  if ("all" in cond) return cond.all.every((c) => evalCondition(c, answers));
  if ("any" in cond) return cond.any.some((c) => evalCondition(c, answers));
  if ("not" in cond) return !evalCondition(cond.not, answers);

  const raw = answers[cond.field];

  switch (cond.op) {
    case "truthy":
      return Boolean(raw);
    case "falsy":
      return !raw;
    case "eq":
      return raw === cond.value;
    case "neq":
      return raw !== cond.value;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = Number(raw);
      const b = Number(cond.value);
      if (Number.isNaN(a) || Number.isNaN(b)) return false;
      if (cond.op === "gt") return a > b;
      if (cond.op === "gte") return a >= b;
      if (cond.op === "lt") return a < b;
      return a <= b;
    }
    default:
      return false;
  }
}

// ── 2. Renderizado de placeholders ────────────────────────────────────────

/**
 * Formatea un valor según un tipo de campo, para insertarlo en una cláusula.
 * Si el valor está vacío, devuelve un marcador visible para que no pase
 * desapercibido en la vista previa.
 */
function formatValue(value: unknown, type?: FieldType): string {
  if (value === undefined || value === null || value === "") {
    return "__________";
  }

  switch (type) {
    case "money_clp":
      return formatClp(Number(value));
    case "money_uf":
      return formatUf(Number(value));
    case "number":
      return formatNumber(Number(value));
    case "date":
      return formatDate(String(value), "long");
    case "rut":
      return formatRut(String(value));
    case "boolean":
      return value ? "Sí" : "No";
    default:
      return String(value);
  }
}

/**
 * Reemplaza los placeholders de un texto. Sintaxis soportada:
 *   {{campo}}            → valor tal cual (o formateado según el tipo del campo)
 *   {{campo:money_clp}}  → fuerza un formato específico
 *
 * Si el placeholder trae tipo explícito, se usa ese; si no, se toma el tipo
 * declarado del campo en el cuestionario.
 */
export function renderTemplate(
  text: string,
  answers: Answers,
  fieldTypes: Record<string, FieldType>,
): string {
  return text.replace(/\{\{\s*([\w.]+)\s*(?::\s*(\w+)\s*)?\}\}/g, (_m, name, explicitType) => {
    const type = (explicitType as FieldType) ?? fieldTypes[name];
    return formatValue(answers[name], type);
  });
}

// ── 3. Ensamblado del documento ───────────────────────────────────────────

export interface RenderedClause {
  id: string;
  heading: string;
  text: string;
}

/** Índice nombre→tipo de todos los campos, para el renderizado. */
export function fieldTypeMap(
  contract: Pick<ContractType, "steps">,
): Record<string, FieldType> {
  const map: Record<string, FieldType> = {};
  for (const f of allFields(contract)) map[f.name] = f.type;
  return map;
}

/**
 * Devuelve las cláusulas que corresponden según las respuestas (aplicando
 * condiciones) con sus placeholders ya reemplazados. Este es el documento
 * que ve tanto la vista previa como la exportación a .docx/.pdf.
 */
export function assembleContract(
  contract: AssemblableContract,
  answers: Answers,
): RenderedClause[] {
  const types = fieldTypeMap(contract);

  return contract.clauses
    .filter((clause: ClauseBlock) =>
      clause.condition ? evalCondition(clause.condition, answers) : true,
    )
    .map((clause) => ({
      id: clause.id,
      heading: renderTemplate(clause.heading, answers, types),
      text: renderTemplate(clause.text, answers, types),
    }));
}

// ── 4. Validación del cuestionario con zod ────────────────────────────────

/** Construye el validador zod de un solo campo según su tipo y reglas. */
function fieldSchema(field: QuestionField): z.ZodTypeAny {
  const v = field.validation ?? {};

  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "rut":
      schema = z
        .string()
        .refine((val) => isValidRut(val), { message: "RUT inválido" });
      break;

    case "money_clp":
    case "number": {
      let n = z.coerce.number({ invalid_type_error: "Debe ser un número" }).int(
        field.type === "money_clp" ? "Debe ser un monto entero en pesos" : "Debe ser un número entero",
      );
      if (v.min !== undefined) n = n.min(v.min, `Mínimo ${v.min}`);
      if (v.max !== undefined) n = n.max(v.max, `Máximo ${v.max}`);
      schema = n;
      break;
    }

    case "money_uf": {
      let n = z.coerce.number({ invalid_type_error: "Debe ser un número" });
      if (v.min !== undefined) n = n.min(v.min, `Mínimo ${v.min}`);
      if (v.max !== undefined) n = n.max(v.max, `Máximo ${v.max}`);
      schema = n;
      break;
    }

    case "date":
      schema = z
        .string()
        .refine((val) => !Number.isNaN(new Date(val).getTime()), {
          message: "Fecha inválida",
        });
      break;

    case "boolean":
      schema = z.coerce.boolean();
      break;

    case "select":
      schema = z.string();
      if (field.options && field.options.length > 0) {
        const values = field.options.map((o) => o.value) as [string, ...string[]];
        schema = z.enum(values);
      }
      break;

    case "text":
    case "textarea":
    default: {
      let s = z.string();
      if (v.min !== undefined) s = s.min(v.min, `Mínimo ${v.min} caracteres`);
      if (v.max !== undefined) s = s.max(v.max, `Máximo ${v.max} caracteres`);
      if (v.pattern) {
        s = s.regex(new RegExp(v.pattern), v.patternMessage ?? "Formato inválido");
      }
      schema = s;
      break;
    }
  }

  // Campos no requeridos: se acepta vacío/omisión.
  if (!field.required) {
    schema = schema.optional().or(z.literal(""));
  }

  return schema;
}

/**
 * Construye un objeto zod para validar TODAS las respuestas de un contrato.
 * Se usa en el servidor antes de generar el documento (y podría usarse en el
 * cliente para validación en vivo del wizard).
 */
export function buildAnswersSchema(
  contract: Pick<ContractType, "steps">,
): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of allFields(contract)) {
    shape[field.name] = fieldSchema(field);
  }
  return z.object(shape);
}

/**
 * Valida UN campo y devuelve el mensaje de error, o null si está correcto.
 * Es una función pura, por lo que sirve tanto en el wizard (cliente, para
 * feedback en vivo) como en el servidor.
 */
export function validateField(
  field: QuestionField,
  value: unknown,
): string | null {
  const isEmpty = value === undefined || value === null || value === "";

  if (field.required && isEmpty) return "Este campo es obligatorio";
  // Un campo opcional vacío es válido; no seguimos validando.
  if (isEmpty) return null;

  const result = fieldSchema(field).safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Valor inválido";
}

/** Valida todos los campos de un paso del wizard. Devuelve errores por campo. */
export function validateStep(
  fields: QuestionField[],
  answers: Answers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = validateField(field, answers[field.name]);
    if (error) errors[field.name] = error;
  }
  return errors;
}
