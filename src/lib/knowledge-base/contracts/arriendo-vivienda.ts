import type { ContractType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// TIPO DE CONTRATO: Arriendo de vivienda
//
// ⚠️ El texto de las cláusulas es CONTENIDO DE EJEMPLO razonable. Debe ser
// reemplazado por la redacción legal definitiva antes de producción.
//
// Marco general: Ley N° 18.101 sobre arrendamiento de predios urbanos y
// normas del Código Civil sobre el contrato de arrendamiento.
// ─────────────────────────────────────────────────────────────────────────

export const arriendoVivienda: ContractType = {
  id: "arriendo-vivienda",
  name: "Arriendo de vivienda",
  description:
    "Contrato de arrendamiento de un inmueble destinado a habitación, entre arrendador y arrendatario.",
  generationPriceClp: 9990,
  reviewPriceClp: 7990,
  legalBasis: ["Ley N° 18.101", "Código Civil, arts. 1915 y siguientes"],
  detectionKeywords: [
    "arrendador",
    "arrendatario",
    "arrendamiento",
    "renta mensual",
    "canon de arriendo",
    "inmueble",
    "restitución del inmueble",
    "subarrendar",
    "ley 18.101",
  ],

  // ── CUESTIONARIO (pasos del wizard) ─────────────────────────────────────
  steps: [
    {
      id: "partes",
      title: "Partes",
      description: "Datos del arrendador (dueño) y del arrendatario (quien arrienda).",
      fields: [
        {
          name: "arrendador_nombre",
          label: "Nombre completo del arrendador",
          type: "text",
          required: true,
          placeholder: "Ej: María Elena Soto Fuentes",
          validation: { min: 3, max: 120 },
        },
        {
          name: "arrendador_rut",
          label: "RUT del arrendador",
          type: "rut",
          required: true,
          placeholder: "12.345.678-5",
        },
        {
          name: "arrendador_domicilio",
          label: "Domicilio del arrendador",
          type: "text",
          required: true,
          placeholder: "Ej: Av. Providencia 1234, depto 56, Providencia, Santiago",
        },
        {
          name: "arrendatario_nombre",
          label: "Nombre completo del arrendatario",
          type: "text",
          required: true,
          placeholder: "Ej: Juan Andrés Pérez Rojas",
          validation: { min: 3, max: 120 },
        },
        {
          name: "arrendatario_rut",
          label: "RUT del arrendatario",
          type: "rut",
          required: true,
          placeholder: "9.876.543-3",
        },
        {
          name: "arrendatario_domicilio",
          label: "Domicilio actual del arrendatario",
          type: "text",
          required: true,
          placeholder: "Ej: Calle Los Olmos 789, Ñuñoa, Santiago",
        },
      ],
    },
    {
      id: "inmueble",
      title: "El inmueble",
      description: "Identificación de la propiedad que se arrienda.",
      fields: [
        {
          name: "inmueble_direccion",
          label: "Dirección del inmueble arrendado",
          type: "text",
          required: true,
          placeholder: "Ej: Av. Irarrázaval 4560, depto 302, Ñuñoa, Santiago",
        },
        {
          name: "inmueble_rol",
          label: "Rol de avalúo (SII)",
          type: "text",
          required: false,
          help: "Opcional. Aparece en la contribución de bienes raíces.",
          placeholder: "Ej: 1234-56",
        },
        {
          name: "inmueble_amoblado",
          label: "¿El inmueble se entrega amoblado?",
          type: "boolean",
          defaultValue: false,
        },
      ],
    },
    {
      id: "condiciones",
      title: "Renta y garantía",
      description: "Monto de la renta, forma de pago y garantía.",
      fields: [
        {
          name: "renta_mensual",
          label: "Renta mensual (CLP)",
          type: "money_clp",
          required: true,
          placeholder: "450000",
          validation: { min: 1 },
        },
        {
          name: "dia_pago",
          label: "Día de pago de cada mes",
          type: "number",
          required: true,
          defaultValue: 5,
          validation: { min: 1, max: 31 },
        },
        {
          name: "garantia_meses",
          label: "Garantía (en meses de renta)",
          type: "number",
          required: true,
          defaultValue: 1,
          help: "Lo usual en Chile es 1 mes. Más de 1 mes puede ser una condición gravosa.",
          validation: { min: 0, max: 6 },
        },
      ],
    },
    {
      id: "plazos",
      title: "Plazos",
      description: "Duración del contrato y su fecha de inicio.",
      fields: [
        {
          name: "fecha_inicio",
          label: "Fecha de inicio del arriendo",
          type: "date",
          required: true,
        },
        {
          name: "plazo_meses",
          label: "Plazo del contrato (meses)",
          type: "number",
          required: true,
          defaultValue: 12,
          validation: { min: 1, max: 120 },
        },
        {
          name: "renovacion_automatica",
          label: "¿Renovación automática al vencer?",
          type: "boolean",
          defaultValue: true,
          help: "Si es sí, el contrato se prorroga por períodos iguales salvo aviso.",
        },
      ],
    },
    {
      id: "opcionales",
      title: "Cláusulas opcionales",
      description: "Activa las cláusulas adicionales que quieras incluir.",
      fields: [
        {
          name: "incluye_reajuste",
          label: "Incluir cláusula de reajuste de la renta",
          type: "boolean",
          defaultValue: true,
          help: "Recomendado: reajusta la renta periódicamente según IPC o UF.",
        },
        {
          name: "reajuste_indice",
          label: "Índice de reajuste",
          type: "select",
          defaultValue: "IPC",
          options: [
            { value: "IPC", label: "IPC (variación semestral)" },
            { value: "UF", label: "UF" },
          ],
        },
        {
          name: "prohibe_subarriendo",
          label: "Prohibir el subarriendo",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "permite_mascotas",
          label: "Permitir mascotas",
          type: "boolean",
          defaultValue: false,
        },
      ],
    },
  ],

  // ── CLÁUSULAS (texto de ejemplo con placeholders y condiciones) ──────────
  clauses: [
    {
      id: "comparecencia",
      heading: "COMPARECENCIA",
      text: "En Santiago de Chile, a {{fecha_inicio}}, entre don(ña) {{arrendador_nombre}}, cédula nacional de identidad N° {{arrendador_rut}}, con domicilio en {{arrendador_domicilio}}, en adelante el \"Arrendador\"; y don(ña) {{arrendatario_nombre}}, cédula nacional de identidad N° {{arrendatario_rut}}, con domicilio en {{arrendatario_domicilio}}, en adelante el \"Arrendatario\"; se ha convenido el siguiente contrato de arrendamiento.",
    },
    {
      id: "inmueble",
      heading: "PRIMERO: Del inmueble",
      text: "El Arrendador da en arrendamiento al Arrendatario el inmueble ubicado en {{inmueble_direccion}}, rol de avalúo N° {{inmueble_rol}}, el que el Arrendatario declara conocer y recibir a su entera satisfacción.",
    },
    {
      id: "inmueble-amoblado",
      heading: "PRIMERO BIS: Del mobiliario",
      condition: { field: "inmueble_amoblado", op: "truthy" },
      text: "El inmueble se entrega amoblado. Un inventario del mobiliario, firmado por ambas partes, formará parte integrante de este contrato como anexo. El Arrendatario responderá por el deterioro de los bienes, salvo el desgaste natural por su uso legítimo.",
    },
    {
      id: "destino",
      heading: "SEGUNDO: Del destino",
      text: "El inmueble se destinará única y exclusivamente a la habitación del Arrendatario y su grupo familiar. Queda prohibido darle un destino comercial o distinto al habitacional.",
    },
    {
      id: "renta",
      heading: "TERCERO: De la renta",
      text: "La renta mensual de arrendamiento será la suma de {{renta_mensual}}, que el Arrendatario pagará por mes anticipado, dentro de los primeros {{dia_pago}} días de cada mes, mediante transferencia electrónica a la cuenta que indique el Arrendador.",
    },
    {
      id: "reajuste",
      heading: "CUARTO: Del reajuste",
      condition: { field: "incluye_reajuste", op: "truthy" },
      text: "La renta se reajustará conforme a la variación del índice {{reajuste_indice}}. El reajuste operará de pleno derecho, sin necesidad de requerimiento previo del Arrendador.",
    },
    {
      id: "garantia",
      heading: "QUINTO: De la garantía",
      text: "Para caucionar el cumplimiento de las obligaciones de este contrato, el Arrendatario entrega en este acto al Arrendador una garantía equivalente a {{garantia_meses}} mes(es) de renta. Esta garantía será restituida dentro de los 60 días siguientes a la restitución del inmueble, deducido lo necesario para reparar deterioros o cubrir cuentas pendientes.",
    },
    {
      id: "plazo",
      heading: "SEXTO: Del plazo",
      text: "El presente contrato tendrá una duración de {{plazo_meses}} meses, contados desde el {{fecha_inicio}}.",
    },
    {
      id: "renovacion",
      heading: "SÉPTIMO: De la renovación",
      condition: { field: "renovacion_automatica", op: "truthy" },
      text: "Al vencimiento del plazo, el contrato se entenderá renovado automáticamente por períodos iguales y sucesivos, salvo que cualquiera de las partes comunique a la otra su voluntad de no renovar, mediante aviso escrito con a lo menos 60 días de anticipación.",
    },
    {
      id: "subarriendo",
      heading: "OCTAVO: Prohibición de subarrendar",
      condition: { field: "prohibe_subarriendo", op: "truthy" },
      text: "Queda expresamente prohibido al Arrendatario subarrendar, ceder o transferir a cualquier título el presente contrato o el uso del inmueble, sin autorización previa y por escrito del Arrendador.",
    },
    {
      id: "mascotas",
      heading: "NOVENO: De las mascotas",
      condition: { field: "permite_mascotas", op: "truthy" },
      text: "Se autoriza al Arrendatario a mantener animales domésticos en el inmueble, siendo de su exclusiva responsabilidad los daños que éstos pudieren ocasionar.",
    },
    {
      id: "domicilio",
      heading: "DÉCIMO: Domicilio y competencia",
      text: "Para todos los efectos legales derivados del presente contrato, las partes fijan su domicilio en la comuna de Santiago y se someten a la jurisdicción de sus tribunales de justicia.",
    },
  ],

  // ── REGLAS DE RIESGO (para el módulo revisor) ────────────────────────────
  riskRules: [
    {
      id: "garantia-excesiva",
      name: "Garantía superior a un mes de renta",
      severity: "ADVERTENCIA",
      explanation:
        "Te están pidiendo una garantía de más de un mes de arriendo. Eso inmoviliza una cantidad importante de tu dinero durante todo el contrato.",
      usualInChile:
        "Lo habitual es una garantía equivalente a un mes de renta, que se devuelve al final descontando daños o cuentas impagas.",
      normativeReference: "Ley N° 18.101",
      detectionGuidance:
        "Busca la cláusula de garantía o depósito. Si la garantía equivale a 2 o más meses de renta, o a un monto claramente superior a una renta mensual, reporta el hallazgo citando esa cláusula.",
    },
    {
      id: "sin-reajuste",
      name: "Ausencia de cláusula de reajuste",
      severity: "SUGERENCIA",
      explanation:
        "El contrato no dice cómo se reajustará la renta en el tiempo. Esto puede favorecer a una u otra parte según cómo evolucione la inflación.",
      usualInChile:
        "Es común incluir un reajuste periódico de la renta según IPC o UF, para mantener su valor real.",
      detectionGuidance:
        "Revisa si existe alguna cláusula que hable de reajuste, IPC, UF o actualización de la renta. Si no existe ninguna, reporta la ausencia (en este caso, cita la cláusula de renta como referencia del vacío).",
    },
    {
      id: "restitucion-garantia-plazo",
      name: "Plazo de devolución de la garantía indefinido o excesivo",
      severity: "ADVERTENCIA",
      explanation:
        "El contrato no fija un plazo claro para devolverte la garantía, o fija uno muy largo. Eso puede retrasar la recuperación de tu dinero.",
      usualInChile:
        "Se suele pactar la devolución dentro de un plazo razonable (por ejemplo 30 a 60 días) tras entregar el inmueble.",
      detectionGuidance:
        "Ubica la cláusula de garantía y verifica si menciona un plazo de restitución. Si no lo menciona o el plazo supera los 60 días, reporta el hallazgo citando la cláusula.",
    },
    {
      id: "terminacion-anticipada-arrendatario",
      name: "Sin salida anticipada para el arrendatario",
      severity: "SUGERENCIA",
      explanation:
        "El contrato no te permite terminar antes de tiempo, o te castiga fuertemente si lo haces. Podrías quedar obligado a pagar todos los meses restantes.",
      usualInChile:
        "Suele pactarse la posibilidad de terminar anticipadamente avisando con 30 a 60 días, a veces con una multa acotada.",
      detectionGuidance:
        "Busca cláusulas de terminación anticipada o desistimiento del arrendatario. Si no existen, o imponen pagar la totalidad del plazo restante, reporta el hallazgo.",
    },
    {
      id: "gastos-reparaciones-al-arrendatario",
      name: "Reparaciones mayores a cargo del arrendatario",
      severity: "CRITICO",
      explanation:
        "El contrato te obliga a pagar reparaciones importantes de la estructura o instalaciones, que normalmente le corresponden al dueño.",
      usualInChile:
        "Las reparaciones necesarias y estructurales son de cargo del arrendador; el arrendatario solo asume las reparaciones locativas (menores, por el uso).",
      normativeReference: "Código Civil, arts. 1927 y 1940",
      detectionGuidance:
        "Detecta cláusulas que trasladen al arrendatario reparaciones mayores, estructurales o del inmueble en general (no solo las locativas). Cítalas textualmente si aparecen.",
    },
  ],
};
