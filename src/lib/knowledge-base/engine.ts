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

/** Sustituye solo los placeholders `{{campo}}` / `{{campo:tipo}}` de un texto. */
function substitutePlaceholders(
  text: string,
  answers: Answers,
  fieldTypes: Record<string, FieldType>,
): string {
  return text.replace(/\{\{\s*([\w.]+)\s*(?::\s*(\w+)\s*)?\}\}/g, (_m, name, explicitType) => {
    const type = (explicitType as FieldType) ?? fieldTypes[name];
    return formatValue(answers[name], type);
  });
}

// ── Condicionales inline dentro de una cláusula ───────────────────────────
// Un mini-motor de plantillas (sin `eval`) para que el texto de una cláusula
// se adapte solo. Sintaxis soportada:
//   {{#if campo}} … {{/if}}                     (verdadero si el campo es truthy)
//   {{#unless campo}} … {{/unless}}             (verdadero si es falsy)
//   {{#eq campo "valor"}} … {{/eq}}             (verdadero si campo === "valor")
//   … {{else}} …                                (rama alternativa, en los tres)
// Se pueden anidar. Todo lo demás es texto con placeholders normales.

type TplNode =
  | { t: "text"; text: string }
  | {
      t: "block";
      kind: "if" | "unless" | "eq";
      field: string;
      value?: string;
      cons: TplNode[];
      alt: TplNode[];
    };

const CONTROL_RE =
  /\{\{\s*(#if|#unless|#eq|else|\/if|\/unless|\/eq)\b\s*([\w.]+)?\s*(?:"([^"]*)")?\s*\}\}/g;

/** Convierte un texto con controles en un árbol de nodos. */
function parseTemplate(text: string): TplNode[] {
  const root: TplNode[] = [];
  const stack: Array<{ node: Extract<TplNode, { t: "block" }>; inElse: boolean }> = [];
  const current = () => {
    if (stack.length === 0) return root;
    const top = stack[stack.length - 1];
    return top.inElse ? top.node.alt : top.node.cons;
  };

  let last = 0;
  for (let m = CONTROL_RE.exec(text); m; m = CONTROL_RE.exec(text)) {
    if (m.index > last) current().push({ t: "text", text: text.slice(last, m.index) });
    last = m.index + m[0].length;

    const [, tag, field, value] = m;
    if (tag === "#if" || tag === "#unless" || tag === "#eq") {
      const node: Extract<TplNode, { t: "block" }> = {
        t: "block",
        kind: tag === "#if" ? "if" : tag === "#unless" ? "unless" : "eq",
        field: field ?? "",
        value,
        cons: [],
        alt: [],
      };
      current().push(node);
      stack.push({ node, inElse: false });
    } else if (tag === "else") {
      if (stack.length > 0) stack[stack.length - 1].inElse = true;
    } else {
      // cierre: /if, /unless, /eq
      if (stack.length > 0) stack.pop();
    }
  }
  CONTROL_RE.lastIndex = 0;
  if (last < text.length) current().push({ t: "text", text: text.slice(last) });
  return root;
}

function evalInline(node: Extract<TplNode, { t: "block" }>, answers: Answers): boolean {
  const raw = answers[node.field];
  if (node.kind === "if") return Boolean(raw);
  if (node.kind === "unless") return !raw;
  return String(raw ?? "") === (node.value ?? "");
}

function renderNodes(
  nodes: TplNode[],
  answers: Answers,
  fieldTypes: Record<string, FieldType>,
): string {
  let out = "";
  for (const node of nodes) {
    if (node.t === "text") {
      out += substitutePlaceholders(node.text, answers, fieldTypes);
    } else {
      const branch = evalInline(node, answers) ? node.cons : node.alt;
      out += renderNodes(branch, answers, fieldTypes);
    }
  }
  return out;
}

/**
 * Renderiza el texto de una cláusula: primero resuelve los condicionales inline
 * ({{#if}}, {{#eq}}, {{else}}…) y luego sustituye los placeholders {{campo}}.
 */
export function renderTemplate(
  text: string,
  answers: Answers,
  fieldTypes: Record<string, FieldType>,
): string {
  // Atajo: si no hay controles, evita el parser.
  if (!text.includes("{{#")) return substitutePlaceholders(text, answers, fieldTypes);
  return renderNodes(parseTemplate(text), answers, fieldTypes);
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
 * Ordinales en palabras para la numeración automática de cláusulas. El token
 * `{{ORD}}` en un encabezado se reemplaza por el ordinal correlativo de las
 * cláusulas efectivamente incluidas, para que no queden saltos aunque se
 * omitan cláusulas condicionales.
 */
const ORDINALES = [
  "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO", "SEXTO", "SÉPTIMO",
  "OCTAVO", "NOVENO", "DÉCIMO", "UNDÉCIMO", "DUODÉCIMO", "DECIMOTERCERO",
  "DECIMOCUARTO", "DECIMOQUINTO", "DECIMOSEXTO", "DECIMOSÉPTIMO", "DECIMOCTAVO",
  "DECIMONOVENO", "VIGÉSIMO", "VIGÉSIMO PRIMERO", "VIGÉSIMO SEGUNDO",
  "VIGÉSIMO TERCERO", "VIGÉSIMO CUARTO", "VIGÉSIMO QUINTO", "VIGÉSIMO SEXTO",
  "VIGÉSIMO SÉPTIMO", "VIGÉSIMO OCTAVO", "VIGÉSIMO NOVENO", "TRIGÉSIMO",
];

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
  // Los parámetros del contrato (tasas, valores) se exponen como placeholders
  // {{param_...}}; las respuestas del usuario tienen prioridad ante colisiones.
  const merged: Answers = { ...(contract.params ?? {}), ...answers };
  let ord = 0;

  return contract.clauses
    .filter((clause: ClauseBlock) =>
      clause.condition ? evalCondition(clause.condition, merged) : true,
    )
    .map((clause) => {
      let heading = clause.heading;
      if (heading.includes("{{ORD}}")) {
        const word = ORDINALES[ord] ?? `CLÁUSULA ${ord + 1}`;
        ord += 1;
        heading = heading.replace("{{ORD}}", word);
      }
      return {
        id: clause.id,
        heading: renderTemplate(heading, merged, types),
        text: renderTemplate(clause.text, merged, types),
      };
    });
}

// ── 3-bis. Visibilidad condicional de campos y reglas duras ───────────────

/** ¿Debe mostrarse (y validarse) este campo según las respuestas actuales? */
export function isFieldVisible(field: QuestionField, answers: Answers): boolean {
  return field.visibleIf ? evalCondition(field.visibleIf, answers) : true;
}

/** Filtra los campos visibles de un paso según las respuestas. */
export function visibleFields(
  fields: QuestionField[],
  answers: Answers,
): QuestionField[] {
  return fields.filter((f) => isFieldVisible(f, answers));
}

export interface HardRuleViolation {
  id: string;
  title: string;
  message: string;
  legalBasis: string;
}

/** Devuelve las reglas duras que la configuración actual infringe (bloquean). */
export function checkHardRules(
  contract: Pick<ContractType, "hardRules">,
  answers: Answers,
): HardRuleViolation[] {
  return (contract.hardRules ?? [])
    .filter((r) => evalCondition(r.violatedWhen, answers))
    .map((r) => ({
      id: r.id,
      title: r.title,
      message: r.message,
      legalBasis: r.legalBasis,
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

/**
 * Valida los campos de un paso del wizard. Ignora los campos ocultos por
 * `visibleIf` (no se exigen datos que no aplican). Devuelve errores por campo.
 */
export function validateStep(
  fields: QuestionField[],
  answers: Answers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (!isFieldVisible(field, answers)) continue;
    const error = validateField(field, answers[field.name]);
    if (error) errors[field.name] = error;
  }
  return errors;
}

/**
 * Valida TODAS las respuestas de un contrato respetando la visibilidad
 * condicional. Se usa en el servidor antes de generar el documento.
 */
export function validateAnswers(
  contract: Pick<ContractType, "steps">,
  answers: Answers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of allFields(contract)) {
    if (!isFieldVisible(field, answers)) continue;
    const error = validateField(field, answers[field.name]);
    if (error) errors[field.name] = error;
  }
  return errors;
}
