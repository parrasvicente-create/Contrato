import type { ContractType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// TIPO DE CONTRATO: Arriendo de vivienda (inmueble urbano)
//
// Fases 1+2 del rediseño del generador (spec de arrendamiento):
//   • Cláusulas con redacción legal cuidada (variante NEUTRA/equilibrada).
//   • Cuestionario ampliado: título del arrendador, aval, copropiedad, UF/CLP,
//     modalidad de plazo, matriz de gastos, firma. Con visibilidad condicional.
//   • Reglas duras (R1–R7): las que dependen de la configuración BLOQUEAN
//     (R4, tope de la cláusula penal); las demás se cumplen POR DISEÑO — el
//     motor nunca genera el texto contrario — y se listan en designGuarantees.
//
// Las variantes por perfil (A/B) y los anexos llegan en fases posteriores.
//
// Marco: Ley N° 18.101 (arrendamiento de predios urbanos), Ley N° 21.461
// ("Devuélveme mi casa"), Código Civil (arts. 1915 y ss.).
// ─────────────────────────────────────────────────────────────────────────

export const arriendoVivienda: ContractType = {
  id: "arriendo-vivienda",
  name: "Arriendo de vivienda",
  description:
    "Contrato de arrendamiento de un inmueble urbano, con redacción equilibrada y ajustada a la Ley N° 18.101.",
  generationPriceClp: 9990,
  reviewPriceClp: 7990,
  legalBasis: [
    "Ley N° 18.101",
    "Ley N° 21.461",
    "Código Civil, arts. 1915 y siguientes",
  ],
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
    // 1. Arrendador ────────────────────────────────────────────────────────
    {
      id: "arrendador",
      title: "Arrendador",
      description: "Quien es dueño del inmueble y lo da en arriendo.",
      fields: [
        {
          name: "contrato_ciudad",
          label: "Ciudad donde se firma",
          type: "text",
          required: true,
          defaultValue: "Santiago",
        },
        {
          name: "contrato_fecha",
          label: "Fecha del contrato",
          type: "date",
          required: true,
        },
        {
          name: "arrendador_naturaleza",
          label: "¿El arrendador es persona o empresa?",
          type: "select",
          required: true,
          defaultValue: "natural",
          options: [
            { value: "natural", label: "Persona natural" },
            { value: "juridica", label: "Empresa (persona jurídica)" },
          ],
        },
        {
          name: "arrendador_nombre",
          label: "Nombre completo",
          type: "text",
          required: true,
          placeholder: "Ej: María Elena Soto Fuentes",
          validation: { min: 3, max: 120 },
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendador_nacionalidad",
          label: "Nacionalidad",
          type: "text",
          defaultValue: "chilena",
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendador_estado_civil",
          label: "Estado civil",
          type: "text",
          required: false,
          placeholder: "Ej: soltero(a), casado(a)",
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendador_profesion",
          label: "Profesión u oficio",
          type: "text",
          required: false,
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendador_razon_social",
          label: "Razón social",
          type: "text",
          required: true,
          placeholder: "Ej: Inversiones Andes SpA",
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendador_tipo_societario",
          label: "Tipo de sociedad",
          type: "text",
          required: true,
          placeholder: "Ej: sociedad por acciones",
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendador_rep_nombre",
          label: "Nombre del representante legal",
          type: "text",
          required: true,
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendador_rep_rut",
          label: "RUT del representante",
          type: "rut",
          required: true,
          visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendador_rut",
          label: "RUT (del arrendador o la empresa)",
          type: "rut",
          required: true,
          placeholder: "12.345.678-5",
        },
        {
          name: "arrendador_domicilio",
          label: "Domicilio",
          type: "text",
          required: true,
          placeholder: "Ej: Av. Providencia 1234, depto 56",
        },
        {
          name: "arrendador_comuna",
          label: "Comuna del domicilio",
          type: "text",
          required: true,
          placeholder: "Ej: Providencia",
        },
        {
          name: "arrendador_email",
          label: "Correo electrónico",
          type: "text",
          required: true,
          help: "Se usa como medio de notificación válido en el contrato.",
          placeholder: "arrendador@correo.cl",
        },
      ],
    },

    // 2. Arrendatario ───────────────────────────────────────────────────────
    {
      id: "arrendatario",
      title: "Arrendatario",
      description: "Quien tomará el inmueble en arriendo.",
      fields: [
        {
          name: "arrendatario_naturaleza",
          label: "¿El arrendatario es persona o empresa?",
          type: "select",
          required: true,
          defaultValue: "natural",
          options: [
            { value: "natural", label: "Persona natural" },
            { value: "juridica", label: "Empresa (persona jurídica)" },
          ],
        },
        {
          name: "arrendatario_nombre",
          label: "Nombre completo",
          type: "text",
          required: true,
          placeholder: "Ej: Juan Andrés Pérez Rojas",
          validation: { min: 3, max: 120 },
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendatario_nacionalidad",
          label: "Nacionalidad",
          type: "text",
          defaultValue: "chilena",
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendatario_estado_civil",
          label: "Estado civil",
          type: "text",
          required: false,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendatario_profesion",
          label: "Profesión u oficio",
          type: "text",
          required: false,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "arrendatario_razon_social",
          label: "Razón social",
          type: "text",
          required: true,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendatario_tipo_societario",
          label: "Tipo de sociedad",
          type: "text",
          required: true,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendatario_rep_nombre",
          label: "Nombre del representante legal",
          type: "text",
          required: true,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendatario_rep_rut",
          label: "RUT del representante",
          type: "rut",
          required: true,
          visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "arrendatario_rut",
          label: "RUT (del arrendatario o la empresa)",
          type: "rut",
          required: true,
          placeholder: "9.876.543-3",
        },
        {
          name: "arrendatario_domicilio",
          label: "Domicilio actual",
          type: "text",
          required: true,
        },
        {
          name: "arrendatario_comuna",
          label: "Comuna del domicilio",
          type: "text",
          required: true,
        },
        {
          name: "arrendatario_email",
          label: "Correo electrónico",
          type: "text",
          required: true,
          help: "Se usa como medio de notificación válido en el contrato.",
        },
      ],
    },

    // 3. Título del arrendador ──────────────────────────────────────────────
    {
      id: "titulo",
      title: "Título del arrendador",
      description:
        "Qué derecho tiene el arrendador sobre el inmueble. La Ley N° 21.461 exige acreditarlo para el cobro rápido.",
      fields: [
        {
          name: "titulo_calidad",
          label: "¿En qué calidad arrienda?",
          type: "select",
          required: true,
          defaultValue: "dueno",
          options: [
            { value: "dueno", label: "Dueño" },
            { value: "usufructuario", label: "Usufructuario" },
            { value: "mandatario", label: "Mandatario / administrador" },
            { value: "comunero", label: "Comunero" },
          ],
        },
        {
          name: "titulo_modo_adquisicion",
          label: "¿Cómo adquirió el inmueble?",
          type: "select",
          defaultValue: "compraventa",
          options: [
            { value: "compraventa", label: "Compraventa" },
            { value: "herencia", label: "Herencia" },
            { value: "donación", label: "Donación" },
            { value: "adjudicación", label: "Adjudicación" },
          ],
          visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" },
        },
        {
          name: "titulo_fojas",
          label: "Inscripción — fojas",
          type: "text",
          required: true,
          placeholder: "Ej: 12345",
          visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" },
        },
        {
          name: "titulo_numero",
          label: "Inscripción — número",
          type: "text",
          required: true,
          placeholder: "Ej: 6789",
          visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" },
        },
        {
          name: "titulo_anio",
          label: "Inscripción — año",
          type: "text",
          required: true,
          placeholder: "Ej: 2019",
          visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" },
        },
        {
          name: "titulo_conservador",
          label: "Conservador de Bienes Raíces",
          type: "text",
          required: true,
          placeholder: "Ej: Santiago",
          visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" },
        },
        {
          name: "titulo_descripcion",
          label: "Documento que lo faculta para arrendar",
          type: "textarea",
          required: true,
          help: "Describe el usufructo, mandato o título que te habilita (se acompañará como anexo).",
          visibleIf: { field: "titulo_calidad", op: "neq", value: "dueno" },
        },
      ],
    },

    // 4. Codeudor solidario (aval) ──────────────────────────────────────────
    {
      id: "aval",
      title: "Codeudor",
      description: "Opcional. Un codeudor solidario refuerza el pago de la renta.",
      fields: [
        {
          name: "aval_existe",
          label: "¿Habrá un codeudor solidario?",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "aval_nombre",
          label: "Nombre completo del codeudor",
          type: "text",
          required: true,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_rut",
          label: "RUT del codeudor",
          type: "rut",
          required: true,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_nacionalidad",
          label: "Nacionalidad",
          type: "text",
          defaultValue: "chilena",
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_estado_civil",
          label: "Estado civil",
          type: "text",
          required: false,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_profesion",
          label: "Profesión u oficio",
          type: "text",
          required: false,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_domicilio",
          label: "Domicilio del codeudor",
          type: "text",
          required: true,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
        {
          name: "aval_email",
          label: "Correo electrónico del codeudor",
          type: "text",
          required: false,
          visibleIf: { field: "aval_existe", op: "truthy" },
        },
      ],
    },

    // 5. El inmueble y su destino ────────────────────────────────────────────
    {
      id: "inmueble",
      title: "El inmueble",
      description: "Identificación de la propiedad y el uso que se le dará.",
      fields: [
        {
          name: "inmueble_tipo",
          label: "Tipo de inmueble",
          type: "select",
          required: true,
          defaultValue: "departamento",
          options: [
            { value: "casa", label: "Casa" },
            { value: "departamento", label: "Departamento" },
            { value: "oficina", label: "Oficina" },
            { value: "local_comercial", label: "Local comercial" },
            { value: "bodega", label: "Bodega" },
            { value: "estacionamiento", label: "Estacionamiento" },
          ],
        },
        {
          name: "inmueble_direccion",
          label: "Dirección (calle y número)",
          type: "text",
          required: true,
          placeholder: "Ej: Av. Irarrázaval 4560",
        },
        {
          name: "inmueble_numero_unidad",
          label: "N° de depto / oficina / local (si corresponde)",
          type: "text",
          required: false,
          placeholder: "Ej: 302",
        },
        {
          name: "inmueble_comuna",
          label: "Comuna",
          type: "text",
          required: true,
          placeholder: "Ej: Ñuñoa",
        },
        {
          name: "inmueble_region",
          label: "Región",
          type: "text",
          required: true,
          defaultValue: "Región Metropolitana",
        },
        {
          name: "inmueble_rol_sii",
          label: "Rol de avalúo (SII)",
          type: "text",
          required: false,
          help: "Opcional. Aparece en la contribución de bienes raíces.",
          placeholder: "Ej: 1234-56",
        },
        {
          name: "inmueble_superficie",
          label: "Superficie aproximada (m²)",
          type: "number",
          required: false,
          validation: { min: 1, max: 100000 },
        },
        {
          name: "inmueble_deslindes",
          label: "Deslindes",
          type: "textarea",
          required: false,
          help: "Norte, sur, oriente y poniente (típico en casas).",
          visibleIf: { field: "inmueble_tipo", op: "eq", value: "casa" },
        },
        {
          name: "inmueble_estacionamiento",
          label: "Incluye estacionamiento",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "inmueble_estacionamiento_num",
          label: "N° de estacionamiento",
          type: "text",
          required: false,
          visibleIf: { field: "inmueble_estacionamiento", op: "truthy" },
        },
        {
          name: "inmueble_bodega",
          label: "Incluye bodega",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "inmueble_bodega_num",
          label: "N° de bodega",
          type: "text",
          required: false,
          visibleIf: { field: "inmueble_bodega", op: "truthy" },
        },
        {
          name: "inmueble_en_copropiedad",
          label: "Está en edificio o condominio (copropiedad)",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "inmueble_amoblado",
          label: "Se entrega amoblado",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "destino_uso",
          label: "Destino del inmueble",
          type: "select",
          required: true,
          defaultValue: "habitacional",
          options: [
            { value: "habitacional", label: "Habitacional (vivienda)" },
            { value: "comercial", label: "Comercial" },
            { value: "oficina", label: "Oficina" },
            { value: "mixto", label: "Mixto" },
          ],
        },
        {
          name: "destino_limita_ocupantes",
          label: "Limitar el número máximo de ocupantes",
          type: "boolean",
          defaultValue: false,
        },
        {
          name: "destino_max_ocupantes",
          label: "Número máximo de ocupantes",
          type: "number",
          required: false,
          validation: { min: 1, max: 50 },
          visibleIf: { field: "destino_limita_ocupantes", op: "truthy" },
        },
      ],
    },

    // 6. Plazo ───────────────────────────────────────────────────────────────
    {
      id: "plazo",
      title: "Plazo",
      description: "Duración del contrato y cómo termina o se renueva.",
      fields: [
        {
          name: "plazo_modalidad",
          label: "Modalidad del plazo",
          type: "select",
          required: true,
          defaultValue: "fijo_renovable",
          options: [
            { value: "fijo", label: "Plazo fijo (termina en una fecha)" },
            { value: "fijo_renovable", label: "Plazo fijo renovable automáticamente" },
            { value: "mes_a_mes", label: "Mes a mes (indefinido)" },
          ],
        },
        {
          name: "plazo_fecha_inicio",
          label: "Fecha de inicio",
          type: "date",
          required: true,
        },
        {
          name: "plazo_duracion_meses",
          label: "Duración (meses)",
          type: "number",
          defaultValue: 12,
          validation: { min: 1, max: 120 },
          visibleIf: { field: "plazo_modalidad", op: "neq", value: "mes_a_mes" },
        },
        {
          name: "plazo_fecha_termino",
          label: "Fecha de término",
          type: "date",
          required: true,
          visibleIf: { field: "plazo_modalidad", op: "neq", value: "mes_a_mes" },
        },
        {
          name: "plazo_periodo_renovacion_meses",
          label: "Cada renovación dura (meses)",
          type: "number",
          defaultValue: 12,
          validation: { min: 1, max: 120 },
          visibleIf: { field: "plazo_modalidad", op: "eq", value: "fijo_renovable" },
        },
        {
          name: "plazo_aviso_no_renovacion_dias",
          label: "Aviso para no renovar (días)",
          type: "number",
          defaultValue: 60,
          validation: { min: 1, max: 365 },
          visibleIf: { field: "plazo_modalidad", op: "eq", value: "fijo_renovable" },
        },
      ],
    },

    // 7. Renta y reajuste ────────────────────────────────────────────────────
    {
      id: "renta",
      title: "Renta y reajuste",
      description: "Monto, forma de pago, reajuste e intereses por mora.",
      fields: [
        {
          name: "renta_moneda",
          label: "Moneda de la renta",
          type: "select",
          required: true,
          defaultValue: "CLP",
          options: [
            { value: "CLP", label: "Pesos (CLP)" },
            { value: "UF", label: "Unidades de Fomento (UF)" },
          ],
        },
        {
          name: "renta_monto_clp",
          label: "Renta mensual (CLP)",
          type: "money_clp",
          required: true,
          placeholder: "450000",
          validation: { min: 1 },
          visibleIf: { field: "renta_moneda", op: "eq", value: "CLP" },
        },
        {
          name: "renta_monto_uf",
          label: "Renta mensual (UF)",
          type: "money_uf",
          required: true,
          placeholder: "12.5",
          validation: { min: 0.1 },
          visibleIf: { field: "renta_moneda", op: "eq", value: "UF" },
        },
        {
          name: "renta_dia_pago",
          label: "Día de pago de cada mes",
          type: "number",
          required: true,
          defaultValue: 5,
          validation: { min: 1, max: 31 },
        },
        {
          name: "renta_medio_pago",
          label: "Medio de pago",
          type: "select",
          defaultValue: "transferencia electrónica",
          options: [
            { value: "transferencia electrónica", label: "Transferencia electrónica" },
            { value: "depósito bancario", label: "Depósito bancario" },
            { value: "otro medio", label: "Otro" },
          ],
        },
        {
          name: "renta_cuenta_banco",
          label: "Banco",
          type: "text",
          required: true,
          placeholder: "Ej: Banco de Chile",
        },
        {
          name: "renta_cuenta_tipo",
          label: "Tipo de cuenta",
          type: "text",
          defaultValue: "corriente",
        },
        {
          name: "renta_cuenta_numero",
          label: "Número de cuenta",
          type: "text",
          required: true,
        },
        {
          name: "renta_cuenta_titular",
          label: "Titular de la cuenta",
          type: "text",
          required: true,
        },
        {
          name: "renta_cuenta_rut",
          label: "RUT del titular",
          type: "rut",
          required: true,
        },
        {
          name: "renta_cuenta_email",
          label: "Correo para enviar el comprobante",
          type: "text",
          required: false,
        },
        {
          name: "renta_reajuste_aplica",
          label: "Reajustar la renta periódicamente",
          type: "boolean",
          defaultValue: true,
          help: "Recomendado en pesos: mantiene el valor real de la renta (IPC).",
          visibleIf: { field: "renta_moneda", op: "eq", value: "CLP" },
        },
        {
          name: "renta_reajuste_frecuencia",
          label: "Frecuencia del reajuste",
          type: "select",
          defaultValue: "anual",
          options: [
            { value: "anual", label: "Anual" },
            { value: "semestral", label: "Semestral" },
          ],
          visibleIf: {
            all: [
              { field: "renta_moneda", op: "eq", value: "CLP" },
              { field: "renta_reajuste_aplica", op: "truthy" },
            ],
          },
        },
        {
          name: "renta_mora_interes",
          label: "Interés por atraso",
          type: "select",
          required: true,
          defaultValue: "corriente",
          help: "La ley no permite pactar un interés superior al máximo convencional.",
          options: [
            { value: "corriente", label: "Interés corriente" },
            { value: "maximo_convencional", label: "Interés máximo convencional" },
          ],
        },
      ],
    },

    // 8. Garantía ─────────────────────────────────────────────────────────────
    {
      id: "garantia",
      title: "Garantía",
      description: "El depósito en garantía y cuándo se devuelve.",
      fields: [
        {
          name: "garantia_aplica",
          label: "¿Habrá garantía?",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "garantia_rentas",
          label: "Garantía equivalente a (meses de renta)",
          type: "number",
          defaultValue: 1,
          help: "Lo usual en Chile es 1 mes. Más de 1 puede ser una condición gravosa.",
          validation: { min: 0, max: 3 },
          visibleIf: { field: "garantia_aplica", op: "truthy" },
        },
        {
          name: "garantia_plazo_restitucion_dias",
          label: "Plazo para devolverla (días)",
          type: "number",
          defaultValue: 30,
          validation: { min: 1, max: 120 },
          visibleIf: { field: "garantia_aplica", op: "truthy" },
        },
      ],
    },

    // 9. Gastos ───────────────────────────────────────────────────────────────
    {
      id: "gastos",
      title: "Quién paga qué",
      description: "Asignación de gastos comunes, contribuciones y consumos.",
      fields: [
        {
          name: "gastos_comunes",
          label: "Gastos comunes",
          type: "select",
          defaultValue: "arrendatario",
          options: [
            { value: "Arrendatario", label: "Los paga el arrendatario" },
            { value: "Arrendador", label: "Los paga el arrendador" },
          ],
        },
        {
          name: "gastos_contribuciones",
          label: "Contribuciones (impuesto territorial)",
          type: "select",
          defaultValue: "arrendador",
          options: [
            { value: "Arrendador", label: "Las paga el arrendador" },
            { value: "Arrendatario", label: "Las paga el arrendatario" },
          ],
        },
      ],
    },

    // 10. Reglas de la casa ──────────────────────────────────────────────────
    {
      id: "reglas",
      title: "Reglas de la casa",
      description: "Subarriendo, mascotas, fumar e inspecciones.",
      fields: [
        {
          name: "uso_subarriendo",
          label: "Subarriendo y cesión",
          type: "select",
          defaultValue: "prohibido",
          options: [
            { value: "prohibido", label: "Prohibidos" },
            { value: "permitido_con_autorizacion", label: "Permitidos con autorización" },
          ],
        },
        {
          name: "uso_mascotas",
          label: "Mascotas",
          type: "select",
          defaultValue: "prohibidas",
          options: [
            { value: "prohibidas", label: "No se permiten" },
            { value: "permitidas", label: "Se permiten" },
            { value: "permitidas_con_condiciones", label: "Se permiten con condiciones" },
          ],
        },
        {
          name: "uso_mascotas_condiciones",
          label: "Mascotas autorizadas y condiciones",
          type: "text",
          required: true,
          placeholder: "Ej: un perro de raza pequeña",
          visibleIf: {
            field: "uso_mascotas",
            op: "eq",
            value: "permitidas_con_condiciones",
          },
        },
        {
          name: "uso_fumar",
          label: "Fumar al interior",
          type: "select",
          defaultValue: "prohibido",
          options: [
            { value: "prohibido", label: "Prohibido" },
            { value: "permitido", label: "Permitido" },
          ],
        },
        {
          name: "inspeccion_aviso_horas",
          label: "Aviso mínimo para inspeccionar (horas)",
          type: "number",
          defaultValue: 48,
          validation: { min: 12, max: 168 },
        },
      ],
    },

    // 11. Término y restitución ───────────────────────────────────────────────
    {
      id: "termino",
      title: "Término y restitución",
      description: "Salida anticipada y consecuencias de no devolver el inmueble.",
      fields: [
        {
          name: "terminacion_aviso_previo_dias",
          label: "Aviso para terminar antes (días)",
          type: "number",
          required: true,
          defaultValue: 60,
          validation: { min: 1, max: 365 },
        },
        {
          name: "terminacion_multa_rentas",
          label: "Multa por término anticipado (meses de renta)",
          type: "number",
          defaultValue: 1,
          help: "Tope legal: no puede exceder 2 rentas (art. 1544 CC).",
          validation: { min: 0, max: 2 },
        },
        {
          name: "restitucion_recargo_pct",
          label: "Recargo por día de atraso en restituir (%)",
          type: "number",
          defaultValue: 50,
          help: "Porcentaje que se suma a la renta diaria por cada día de atraso.",
          validation: { min: 0, max: 100 },
        },
      ],
    },

    // 12. Equilibrio de las cláusulas clave ──────────────────────────────────
    // Estas 4 cláusulas concentran la mayoría de los conflictos. Por defecto
    // van equilibradas; el usuario puede inclinarlas si lo desea.
    {
      id: "equilibrio",
      title: "Tono del contrato",
      description:
        "Estas cuatro cláusulas son las que más se negocian. Por defecto van equilibradas; ajústalas solo si quieres.",
      fields: [
        {
          name: "garantia_variante",
          label: "Devolución de la garantía",
          type: "select",
          defaultValue: "neutra",
          help: "Quién decide los descuentos y con qué respaldo.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
          visibleIf: { field: "garantia_aplica", op: "truthy" },
        },
        {
          name: "reparaciones_variante",
          label: "Reparaciones",
          type: "select",
          defaultValue: "neutra",
          help: "Qué tan amplio es lo que paga el arrendatario.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
        {
          name: "terminacion_variante",
          label: "Término anticipado",
          type: "select",
          defaultValue: "neutra",
          help: "Multa por salir antes vs. solo preaviso.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
        {
          name: "restitucion_variante",
          label: "Atraso en la restitución",
          type: "select",
          defaultValue: "neutra",
          help: "Recargo por cada día que se atrase en devolver el inmueble.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
      ],
    },

    // 13. Entrega ─────────────────────────────────────────────────────────────
    {
      id: "entrega",
      title: "Entrega",
      description: "El acta de entrega deja constancia del estado del inmueble.",
      fields: [
        {
          name: "entrega_hay_acta",
          label: "Se firmará un acta de entrega (recomendado)",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "entrega_fecha",
          label: "Fecha de entrega",
          type: "date",
          required: false,
          visibleIf: { field: "entrega_hay_acta", op: "truthy" },
        },
        {
          name: "entrega_llaves",
          label: "Juegos de llaves entregados",
          type: "number",
          defaultValue: 1,
          validation: { min: 1, max: 20 },
          visibleIf: { field: "entrega_hay_acta", op: "truthy" },
        },
      ],
    },

    // 14. Firma ───────────────────────────────────────────────────────────────
    {
      id: "firma",
      title: "Firma",
      description:
        "Cómo se firmará. La autorización notarial habilita el cobro rápido de la Ley N° 21.461.",
      fields: [
        {
          name: "firma_modalidad",
          label: "Modalidad de firma",
          type: "select",
          required: true,
          defaultValue: "notarial",
          options: [
            { value: "notarial", label: "Firmas autorizadas ante notario (recomendado)" },
            { value: "fea", label: "Firma electrónica avanzada" },
            { value: "simple", label: "Firma simple" },
          ],
        },
        {
          name: "firma_notaria",
          label: "Notaría (si ya la tienes)",
          type: "text",
          required: false,
          visibleIf: { field: "firma_modalidad", op: "eq", value: "notarial" },
        },
        {
          name: "firma_ejemplares",
          label: "Número de ejemplares",
          type: "number",
          defaultValue: 3,
          validation: { min: 2, max: 6 },
        },
      ],
    },
  ],

  // ── CLÁUSULAS ────────────────────────────────────────────────────────────
  // Redacción NEUTRA (equilibrada). {{ORD}} numera automáticamente; los
  // condicionales inline ({{#if}}, {{#eq}}, {{else}}) adaptan el texto.
  clauses: [
    {
      id: "comparecencia",
      heading: "CONTRATO DE ARRENDAMIENTO DE INMUEBLE",
      text: "En {{contrato_ciudad}}, a {{contrato_fecha}}, entre {{#eq arrendador_naturaleza \"juridica\"}}{{arrendador_razon_social}}, {{arrendador_tipo_societario}}, rol único tributario N° {{arrendador_rut}}, representada por don(ña) {{arrendador_rep_nombre}}, cédula nacional de identidad N° {{arrendador_rep_rut}}{{else}}don(ña) {{arrendador_nombre}}, {{arrendador_nacionalidad}}{{#if arrendador_estado_civil}}, {{arrendador_estado_civil}}{{/if}}{{#if arrendador_profesion}}, {{arrendador_profesion}}{{/if}}, cédula nacional de identidad N° {{arrendador_rut}}{{/eq}}, domiciliado en {{arrendador_domicilio}}, comuna de {{arrendador_comuna}}, en adelante e indistintamente el \"Arrendador\"; y {{#eq arrendatario_naturaleza \"juridica\"}}{{arrendatario_razon_social}}, {{arrendatario_tipo_societario}}, rol único tributario N° {{arrendatario_rut}}, representada por don(ña) {{arrendatario_rep_nombre}}, cédula nacional de identidad N° {{arrendatario_rep_rut}}{{else}}don(ña) {{arrendatario_nombre}}, {{arrendatario_nacionalidad}}{{#if arrendatario_estado_civil}}, {{arrendatario_estado_civil}}{{/if}}{{#if arrendatario_profesion}}, {{arrendatario_profesion}}{{/if}}, cédula nacional de identidad N° {{arrendatario_rut}}{{/eq}}, domiciliado en {{arrendatario_domicilio}}, comuna de {{arrendatario_comuna}}, en adelante e indistintamente el \"Arrendatario\"{{#if aval_existe}}; y don(ña) {{aval_nombre}}, {{aval_nacionalidad}}{{#if aval_estado_civil}}, {{aval_estado_civil}}{{/if}}, cédula nacional de identidad N° {{aval_rut}}, domiciliado en {{aval_domicilio}}, en adelante el \"Codeudor Solidario\"{{/if}}, quienes se denominarán conjuntamente \"las Partes\", se ha convenido el siguiente contrato de arrendamiento:",
    },
    {
      id: "titulo",
      heading: "{{ORD}}: TÍTULO DEL ARRENDADOR",
      text: "{{#eq titulo_calidad \"dueno\"}}El Arrendador declara ser dueño del inmueble que más adelante se individualiza, adquirido por {{titulo_modo_adquisicion}}, cuyo dominio se encuentra inscrito a su nombre a fojas {{titulo_fojas}} número {{titulo_numero}} del Registro de Propiedad del Conservador de Bienes Raíces de {{titulo_conservador}}, correspondiente al año {{titulo_anio}}.{{else}}El Arrendador declara detentar la calidad de {{titulo_calidad}} respecto del inmueble que más adelante se individualiza, y encontrarse facultado para ceder su uso y goce en virtud de {{titulo_descripcion}}, documento que se acompaña como anexo y forma parte integrante de este contrato.{{/eq}} El Arrendador declara que sobre el inmueble no pesan prohibiciones, embargos ni litigios que impidan la celebración de este contrato.",
    },
    {
      id: "inmueble",
      heading: "{{ORD}}: INDIVIDUALIZACIÓN DEL INMUEBLE",
      text: "El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble consistente en {{inmueble_tipo}} ubicado en {{inmueble_direccion}}{{#if inmueble_numero_unidad}}, unidad N° {{inmueble_numero_unidad}}{{/if}}, comuna de {{inmueble_comuna}}, {{inmueble_region}}{{#if inmueble_rol_sii}}, rol de avalúo N° {{inmueble_rol_sii}}{{/if}}{{#if inmueble_superficie}}, de una superficie aproximada de {{inmueble_superficie}} metros cuadrados{{/if}}{{#eq inmueble_tipo \"casa\"}}{{#if inmueble_deslindes}}, cuyos deslindes son: {{inmueble_deslindes}}{{/if}}{{/eq}}. {{#if inmueble_estacionamiento}}El arrendamiento comprende además el estacionamiento N° {{inmueble_estacionamiento_num}}. {{/if}}{{#if inmueble_bodega}}El arrendamiento comprende además la bodega N° {{inmueble_bodega_num}}. {{/if}}{{#if inmueble_amoblado}}El inmueble se entrega amoblado, con los bienes que se detallan en el inventario que se acompaña como anexo, suscrito por ambas Partes. {{/if}}{{#if inmueble_en_copropiedad}}El Arrendatario declara recibir copia del Reglamento de Copropiedad y se obliga a darle cumplimiento, así como a los acuerdos de la asamblea y a las instrucciones de la administración.{{/if}}",
    },
    {
      id: "destino",
      heading: "{{ORD}}: DESTINO",
      text: "El inmueble se destinará exclusivamente a uso {{destino_uso}}{{#eq destino_uso \"habitacional\"}}, quedando prohibido destinarlo, total o parcialmente, a fines comerciales, industriales o distintos del señalado sin autorización previa y escrita del Arrendador{{/eq}}. {{#if destino_limita_ocupantes}}El inmueble será habitado por un máximo de {{destino_max_ocupantes}} personas. {{/if}}El Arrendatario se obliga a no destinar el inmueble a actividad alguna que contravenga la ley, la moral o el orden público; su infracción se considerará incumplimiento grave.",
    },
    {
      id: "plazo",
      heading: "{{ORD}}: PLAZO",
      text: "{{#eq plazo_modalidad \"fijo\"}}El presente contrato tendrá una vigencia de {{plazo_duracion_meses}} meses, a contar del {{plazo_fecha_inicio}} y hasta el {{plazo_fecha_termino}}, fecha en que el Arrendatario deberá restituir el inmueble sin necesidad de desahucio ni notificación previa.{{/eq}}{{#eq plazo_modalidad \"fijo_renovable\"}}El presente contrato tendrá una vigencia inicial de {{plazo_duracion_meses}} meses, a contar del {{plazo_fecha_inicio}} y hasta el {{plazo_fecha_termino}}. Vencido dicho plazo, se entenderá renovado automática y sucesivamente por períodos iguales de {{plazo_periodo_renovacion_meses}} meses, salvo que cualquiera de las Partes comunique a la otra su voluntad de no perseverar, mediante carta certificada o correo electrónico, con a lo menos {{plazo_aviso_no_renovacion_dias}} días de anticipación al término del período respectivo.{{/eq}}{{#eq plazo_modalidad \"mes_a_mes\"}}El presente contrato regirá a contar del {{plazo_fecha_inicio}} y tendrá una duración indefinida, de mes a mes. Cualquiera de las Partes podrá ponerle término mediante desahucio efectuado en los términos y plazos del artículo 3° de la Ley N° 18.101.{{/eq}}",
    },
    {
      id: "renta",
      heading: "{{ORD}}: RENTA",
      text: "{{#eq renta_moneda \"UF\"}}La renta mensual de arrendamiento será la suma equivalente a {{renta_monto_uf:money_uf}} Unidades de Fomento, pagadera en pesos, moneda nacional, según el valor que dicha unidad tenga al día efectivo del pago.{{else}}La renta mensual de arrendamiento será la suma de {{renta_monto_clp:money_clp}}.{{/eq}} La renta se pagará por mensualidades anticipadas, dentro de los primeros {{renta_dia_pago}} días de cada mes, mediante {{renta_medio_pago}} en la cuenta {{renta_cuenta_tipo}} N° {{renta_cuenta_numero}} del {{renta_cuenta_banco}}, de titularidad de {{renta_cuenta_titular}}, RUT {{renta_cuenta_rut}}{{#if renta_cuenta_email}}, debiendo el Arrendatario remitir el comprobante a {{renta_cuenta_email}}{{/if}}.\n{{#if renta_reajuste_aplica}}Reajuste. La renta se reajustará en forma {{renta_reajuste_frecuencia}}, en el mismo porcentaje de variación que experimente el Índice de Precios al Consumidor determinado por el Instituto Nacional de Estadísticas durante el período anterior, operando de pleno derecho.\n{{/if}}Mora. El simple retardo en el pago constituirá en mora al Arrendatario, sin necesidad de requerimiento, devengándose desde el primer día de atraso el {{#eq renta_mora_interes \"maximo_convencional\"}}interés máximo convencional{{else}}interés corriente{{/eq}} sobre las sumas adeudadas.",
    },
    {
      id: "garantia",
      heading: "{{ORD}}: GARANTÍA",
      condition: { field: "garantia_aplica", op: "truthy" },
      text: "El Arrendatario entrega en este acto al Arrendador, quien declara recibirla conforme, una garantía equivalente a {{garantia_rentas}} mes(es) de renta, en garantía del fiel cumplimiento de las obligaciones de este contrato. Esta garantía no constituye renta anticipada y no podrá imputarse al pago de la renta de ningún período, incluido el último. {{#eq garantia_variante \"pro_arrendador\"}}Será restituida al Arrendatario dentro de los {{garantia_plazo_restitucion_dias}} días siguientes a la restitución material del inmueble, una vez que el Arrendador verifique el estado de conservación y se acredite el pago íntegro de rentas, gastos comunes y consumos devengados. El Arrendador queda facultado para imputar a la garantía el valor de las reparaciones, deterioros y sumas impagas, sin perjuicio de perseguir el saldo insoluto.{{else}}{{#eq garantia_variante \"pro_arrendatario\"}}Será restituida al Arrendatario, debidamente reajustada, dentro de los {{garantia_plazo_restitucion_dias}} días siguientes a la restitución material. Solo podrán deducirse sumas efectivamente adeudadas o el costo de reparaciones que consten en presupuesto o boleta de un tercero, previamente comunicados al Arrendatario, quien podrá objetarlos dentro de quinto día. Transcurrido el plazo sin restitución ni objeción fundada, el Arrendador deberá restituirla íntegramente.{{else}}Será restituida al Arrendatario, debidamente reajustada, dentro de los {{garantia_plazo_restitucion_dias}} días siguientes a la restitución material del inmueble, previa deducción de las sumas que el Arrendatario adeudare por rentas, gastos comunes, consumos o reparación de deterioros que no provengan del uso legítimo. Toda deducción deberá comunicarse por escrito, acompañando los documentos que la justifiquen.{{/eq}}{{/eq}}",
    },
    {
      id: "gastos",
      heading: "{{ORD}}: GASTOS COMUNES, CONSUMOS Y CONTRIBUCIONES",
      text: "Los gastos comunes serán de cargo del {{gastos_comunes}}. Las contribuciones de bienes raíces serán de cargo del {{gastos_contribuciones}}. Los consumos domiciliarios de electricidad, agua, gas e internet serán de cargo del Arrendatario, quien se obliga a mantenerlos al día y a acreditar su pago al momento de la restitución. El no pago de gastos comunes o consumos por dos o más períodos consecutivos se considerará incumplimiento grave.",
    },
    {
      id: "entrega",
      heading: "{{ORD}}: ESTADO DEL INMUEBLE Y ENTREGA",
      text: "El inmueble se entrega en buen estado de conservación y funcionamiento, con sus instalaciones eléctricas, sanitarias y de gas operativas, lo que el Arrendatario declara verificar y aceptar. {{#if entrega_hay_acta}}Las Partes suscriben un Acta de Entrega, que se acompaña como anexo, en la que consta el estado del inmueble, el registro fotográfico, la lectura de los medidores y la entrega de {{entrega_llaves}} juego(s) de llaves. {{/if}}El Arrendatario deberá restituir el inmueble en el mismo estado en que lo recibe, habida consideración del deterioro proveniente del uso y goce legítimos, conforme al artículo 1947 del Código Civil.",
    },
    {
      id: "reparaciones",
      heading: "{{ORD}}: CONSERVACIÓN Y REPARACIONES",
      text: "{{#eq reparaciones_variante \"pro_arrendador\"}}Serán de cargo del Arrendatario todas las reparaciones locativas, entendiéndose por tales las que subsanen los deterioros que ordinariamente se producen por culpa del arrendatario o de sus dependientes, así como el mantenimiento periódico de artefactos, grifería, calefont, sistemas de calefacción, cerraduras y persianas. Las reparaciones estructurales serán de cargo del Arrendador.{{else}}{{#eq reparaciones_variante \"pro_arrendatario\"}}Serán de cargo del Arrendatario únicamente las reparaciones locativas derivadas de su culpa o la de sus dependientes, excluyéndose el desgaste natural por el uso legítimo y el deterioro por caso fortuito o fuerza mayor. Todas las demás reparaciones serán de cargo del Arrendador, quien deberá ejecutarlas dentro de un plazo razonable desde el aviso del Arrendatario; transcurrido este sin ejecutarse, el Arrendatario podrá realizarlas por cuenta del Arrendador, imputando su valor documentado a las rentas siguientes.{{else}}Serán de cargo del Arrendatario las reparaciones locativas, en los términos del artículo 1940 del Código Civil, y de cargo del Arrendador las reparaciones necesarias no locativas, conforme al artículo 1927 del mismo Código, incluyendo las que afecten la estructura, techumbre y matrices de agua, gas y electricidad. El Arrendatario deberá informar al Arrendador, dentro de los cinco días siguientes, de todo desperfecto que requiera reparación de cargo de este último; la omisión del aviso lo hará responsable de los mayores daños que ello ocasione.{{/eq}}{{/eq}}",
    },
    {
      id: "mejoras",
      heading: "{{ORD}}: MEJORAS",
      text: "El Arrendatario no podrá efectuar mejoras, alteraciones ni transformaciones en el inmueble sin autorización previa y escrita del Arrendador. Las que se ejecuten quedarán en beneficio del inmueble, sin derecho a indemnización ni reembolso, salvo pacto escrito en contrario.",
    },
    {
      id: "prohibiciones",
      heading: "{{ORD}}: PROHIBICIONES",
      text: "Queda prohibido al Arrendatario: a) {{#eq uso_subarriendo \"prohibido\"}}subarrendar el inmueble, total o parcialmente, y ceder o transferir a cualquier título este contrato o los derechos que de él emanan{{else}}subarrendar o ceder el contrato sin autorización previa y escrita del Arrendador{{/eq}}; b) destinar el inmueble a un fin distinto del pactado; c) ejecutar obras que afecten la estructura o modificar las instalaciones sin autorización escrita; d) almacenar materiales inflamables, explosivos o peligrosos; e) causar molestias a los vecinos o infringir el reglamento de copropiedad{{#eq uso_mascotas \"prohibidas\"}}; f) mantener animales o mascotas de cualquier especie{{/eq}}{{#eq uso_mascotas \"permitidas_con_condiciones\"}}; f) mantener mascotas distintas de las autorizadas ({{uso_mascotas_condiciones}}), debiendo responder por los daños que ocasionen y dar cumplimiento a la Ley N° 21.020{{/eq}}{{#eq uso_fumar \"prohibido\"}}; g) fumar al interior del inmueble{{/eq}}. La infracción de cualquiera de estas prohibiciones se considerará incumplimiento grave y facultará al Arrendador para solicitar la terminación del contrato.",
    },
    {
      id: "inspeccion",
      heading: "{{ORD}}: INSPECCIÓN",
      text: "El Arrendador, o quien este designe, podrá inspeccionar el inmueble previo aviso al Arrendatario con a lo menos {{inspeccion_aviso_horas}} horas de anticipación, en días hábiles y horario razonable. El Arrendatario se obliga a facilitar el acceso, sin que ello importe perturbación de su goce pacífico del inmueble.",
    },
    {
      id: "codeudor",
      heading: "{{ORD}}: CODEUDOR SOLIDARIO",
      condition: { field: "aval_existe", op: "truthy" },
      text: "Don(ña) {{aval_nombre}}, ya individualizado, se constituye en este acto en fiador y codeudor solidario del Arrendatario, obligándose a pagar al Arrendador todas las obligaciones que para aquel emanan de este contrato —rentas, reajustes, intereses, gastos comunes, consumos, indemnizaciones y costas—, renunciando a los beneficios de excusión y división. Esta obligación se mantendrá vigente durante toda la vigencia del contrato y sus renovaciones, hasta la restitución material del inmueble y el pago íntegro de lo adeudado, sin que las prórrogas o modificaciones la extingan.",
    },
    {
      id: "terminacion",
      heading: "{{ORD}}: TERMINACIÓN ANTICIPADA",
      text: "{{#eq terminacion_variante \"pro_arrendador\"}}El Arrendatario no podrá poner término anticipado al contrato. Si lo hiciere, deberá pagar al Arrendador, a título de cláusula penal, una suma equivalente a {{terminacion_multa_rentas}} renta(s) de arrendamiento, sin perjuicio de las rentas devengadas e impagas hasta la restitución material del inmueble.{{else}}{{#eq terminacion_variante \"pro_arrendatario\"}}El Arrendatario podrá poner término anticipado al contrato en cualquier momento, dando aviso al Arrendador con a lo menos {{terminacion_aviso_previo_dias}} días de anticipación, sin obligación de pagar indemnización ni multa alguna, con la sola obligación de pagar las rentas y gastos devengados hasta la restitución material del inmueble.{{else}}El Arrendatario podrá poner término anticipado al contrato dando aviso al Arrendador con a lo menos {{terminacion_aviso_previo_dias}} días de anticipación, mediante carta certificada o correo electrónico, y pagando a título de cláusula penal una suma equivalente a {{terminacion_multa_rentas}} renta(s) de arrendamiento. Lo anterior es sin perjuicio de las rentas y gastos devengados e impagos hasta la restitución material del inmueble.{{/eq}}{{/eq}}",
    },
    {
      id: "restitucion",
      heading: "{{ORD}}: RESTITUCIÓN",
      text: "Llegado el término del contrato por cualquier causa, el Arrendatario deberá restituir el inmueble desocupado, libre de todo ocupante y de sus bienes, con todas sus llaves y acreditando el pago íntegro de las rentas, gastos comunes y consumos de su cargo. {{#eq restitucion_variante \"pro_arrendador\"}}Si no lo restituyere oportunamente, deberá pagar al Arrendador, por cada día de atraso, una suma equivalente a la renta diaria vigente aumentada en un {{restitucion_recargo_pct}}%, a título de cláusula penal, sin perjuicio del derecho del Arrendador a exigir la restitución judicial y a ser indemnizado de todo otro perjuicio.{{else}}{{#eq restitucion_variante \"pro_arrendatario\"}}Si no lo restituyere oportunamente, continuará devengándose la renta diaria vigente hasta la restitución material, sin recargo adicional, sin perjuicio del derecho del Arrendador a exigir judicialmente la restitución.{{else}}Si no lo restituyere oportunamente, deberá pagar al Arrendador, por cada día de atraso, una suma equivalente a la renta diaria vigente aumentada en un {{restitucion_recargo_pct}}%, a título de cláusula penal, sin perjuicio de las acciones legales que correspondan.{{/eq}}{{/eq}} La restitución se obtendrá siempre por la vía judicial; el Arrendador no podrá recurrir a medios de autotutela.",
    },
    {
      id: "notificaciones",
      heading: "{{ORD}}: NOTIFICACIONES Y DOMICILIO ELECTRÓNICO",
      text: "Las Partes fijan como domicilio los indicados en la comparecencia y reconocen como medio idóneo y suficiente de comunicación entre ellas los siguientes correos electrónicos: Arrendador, {{arrendador_email}}; Arrendatario, {{arrendatario_email}}{{#if aval_existe}}; Codeudor Solidario, {{aval_email}}{{/if}}. Todo cambio de domicilio o correo deberá comunicarse por escrito a la otra Parte dentro de quinto día.",
    },
    {
      id: "datos",
      heading: "{{ORD}}: TRATAMIENTO DE DATOS PERSONALES",
      text: "Las Partes se autorizan recíprocamente a tratar los datos personales entregados con la exclusiva finalidad de la celebración, ejecución, cobro y término de este contrato, conforme a la Ley N° 19.628 y a la Ley N° 21.719 sobre protección de datos personales. Los titulares podrán ejercer sus derechos de acceso, rectificación, cancelación y oposición mediante comunicación escrita a las direcciones señaladas.",
    },
    {
      id: "competencia",
      heading: "{{ORD}}: DOMICILIO Y COMPETENCIA",
      text: "Para todos los efectos legales, las Partes fijan su domicilio en la comuna de {{inmueble_comuna}} y se someten a la jurisdicción de sus tribunales de justicia, en conformidad al artículo 17 de la Ley N° 18.101.",
    },
    {
      id: "firmas",
      heading: "{{ORD}}: EJEMPLARES Y FIRMAS",
      text: "El presente contrato se firma en {{firma_ejemplares}} ejemplares de igual tenor y fecha, quedando uno en poder de cada Parte. {{#eq firma_modalidad \"notarial\"}}Las firmas de los comparecientes se autorizan ante notario público, conforme al artículo 20 de la Ley N° 18.101, para constituir antecedente suficiente en los términos del procedimiento monitorio de la Ley N° 21.461.{{/eq}}{{#eq firma_modalidad \"fea\"}}El presente contrato se suscribe mediante firma electrónica avanzada, conforme a la Ley N° 19.799, produciendo los mismos efectos que la firma manuscrita.{{/eq}}{{#eq firma_modalidad \"simple\"}}El presente contrato se suscribe mediante firma simple de las Partes.{{/eq}}",
    },
  ],

  // ── REGLAS DURAS que dependen de la configuración (BLOQUEAN) ──────────────
  hardRules: [
    {
      id: "R4",
      title: "Cláusula penal excesiva",
      legalBasis: "Art. 1544 del Código Civil",
      violatedWhen: { field: "terminacion_multa_rentas", op: "gt", value: 2 },
      message:
        "La multa por término anticipado no puede exceder el doble de la obligación (2 rentas). Baja la multa a 2 meses o menos.",
    },
  ],

  // ── GARANTÍAS POR DISEÑO (límites legales que el motor respeta siempre) ────
  designGuarantees: [
    "R1 · No se pacta renuncia del arrendatario a los plazos ni derechos de la Ley N° 18.101 (son irrenunciables, art. 19).",
    "R2 · No se incluye ninguna facultad de autotutela (lanzamiento, cambio de chapas o corte de servicios): la restitución es siempre judicial.",
    "R3 · El interés por mora se limita al corriente o al máximo convencional; no se permite un interés superior (Ley N° 18.010).",
    "R5 · La garantía no es renta anticipada ni se imputa automáticamente: su devolución exige rendición documentada.",
    "R6 · En destino habitacional no se excluye la Ley N° 18.101 (norma de orden público).",
    "R7 · La competencia se radica en el tribunal del lugar del inmueble; no se ofrece arbitraje (art. 17 Ley N° 18.101).",
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
    {
      id: "autotutela-arrendador",
      name: "Facultades de autotutela del arrendador",
      severity: "CRITICO",
      explanation:
        "El contrato permitiría al arrendador recuperar el inmueble por mano propia (cambiar chapas, cortar servicios, sacar tus cosas). Eso está prohibido y puede ser delito.",
      usualInChile:
        "La restitución solo puede obtenerse por vía judicial. Ninguna cláusula puede autorizar el lanzamiento extrajudicial ni el corte de servicios básicos.",
      normativeReference: "Ley N° 18.101; prohibición de autotutela",
      detectionGuidance:
        "Detecta cláusulas que autoricen al arrendador a ingresar al inmueble, cambiar cerraduras, retirar especies o suspender servicios básicos ante el no pago. Cítalas textualmente si aparecen.",
    },
  ],
};
