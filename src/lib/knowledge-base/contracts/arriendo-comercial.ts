import type { ContractType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// TIPO DE CONTRATO: Arriendo de inmueble no habitacional (oficina / bodega /
// local comercial) — spec Plantilla 01b.
//
// Hermana del arriendo de vivienda: comparte estructura y hereda las garantías
// de la Ley N° 18.101 (que también rige el comercial urbano). Añade lo propio:
//   • IVA derivado de si el inmueble se entrega con instalaciones/amoblado (C1).
//   • Giro autorizado y factibilidad de permisos/patente (C5).
//   • Habilitación con período de gracia; renta fija o variable sobre ventas.
//   • Caución: depósito / boleta bancaria / fianza de la matriz.
//   • Operación continua y exclusividad de giro (solo retail); fondo del centro.
//
// Personalización selectiva (eje arrendador/arrendatario) en las cláusulas que
// concentran la negociación: factibilidad, habilitación, cesión y terminación.
// ─────────────────────────────────────────────────────────────────────────

export const arriendoComercial: ContractType = {
  id: "arriendo-comercial",
  name: "Arriendo comercial (oficina, bodega o local)",
  description:
    "Arrendamiento de inmueble no habitacional urbano, con giro autorizado, IVA según instalaciones, caución comercial y cláusulas de retail.",
  generationPriceClp: 12990,
  reviewPriceClp: 9990,
  legalBasis: [
    "Ley N° 18.101 (predios urbanos)",
    "Ley sobre Impuesto a las Ventas y Servicios, arts. 8 g) y 17",
    "Código Civil, arts. 1915 y siguientes",
  ],
  detectionKeywords: [
    "arrendamiento",
    "local comercial",
    "oficina",
    "bodega",
    "giro",
    "patente municipal",
    "ventas netas",
    "boleta de garantía",
    "uso de suelo",
    "recepción final",
  ],

  // ── CUESTIONARIO ─────────────────────────────────────────────────────────
  steps: [
    // 1. Tipo de inmueble comercial ─────────────────────────────────────────
    {
      id: "tipo",
      title: "Tipo de local",
      description: "Qué se arrienda define varias cláusulas propias del comercial.",
      fields: [
        { name: "contrato_ciudad", label: "Ciudad donde se firma", type: "text", required: true, defaultValue: "Santiago" },
        { name: "contrato_fecha", label: "Fecha del contrato", type: "date", required: true },
        {
          name: "inmueble_subtipo",
          label: "Tipo de inmueble",
          type: "select",
          required: true,
          defaultValue: "local_comercial",
          options: [
            { value: "oficina", label: "Oficina" },
            { value: "bodega", label: "Bodega" },
            { value: "local_comercial", label: "Local comercial (retail)" },
          ],
        },
        {
          name: "en_centro_comercial",
          label: "Está dentro de un centro comercial / mall",
          type: "boolean",
          defaultValue: false,
          help: "Activa el reglamento del centro y el fondo promocional.",
        },
      ],
    },

    // 2. Arrendador ──────────────────────────────────────────────────────────
    {
      id: "arrendador",
      title: "Arrendador",
      description: "Dueño del inmueble que lo da en arriendo.",
      fields: [
        {
          name: "arrendador_naturaleza",
          label: "¿El arrendador es persona o empresa?",
          type: "select",
          required: true,
          defaultValue: "juridica",
          options: [
            { value: "natural", label: "Persona natural" },
            { value: "juridica", label: "Empresa (persona jurídica)" },
          ],
        },
        { name: "arrendador_nombre", label: "Nombre completo", type: "text", required: true, validation: { min: 3, max: 120 }, visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" } },
        { name: "arrendador_nacionalidad", label: "Nacionalidad", type: "text", defaultValue: "chilena", visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "natural" } },
        { name: "arrendador_razon_social", label: "Razón social", type: "text", required: true, visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendador_tipo_societario", label: "Tipo de sociedad", type: "text", required: true, placeholder: "Ej: sociedad por acciones", visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendador_rep_nombre", label: "Representante legal", type: "text", required: true, visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendador_rep_rut", label: "RUT del representante", type: "rut", required: true, visibleIf: { field: "arrendador_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendador_rut", label: "RUT (del arrendador o la empresa)", type: "rut", required: true },
        { name: "arrendador_domicilio", label: "Domicilio", type: "text", required: true },
        { name: "arrendador_comuna", label: "Comuna", type: "text", required: true },
        { name: "arrendador_email", label: "Correo electrónico", type: "text", required: true },
      ],
    },

    // 3. Título del arrendador ───────────────────────────────────────────────
    {
      id: "titulo",
      title: "Título del arrendador",
      description: "Qué derecho tiene el arrendador sobre el inmueble.",
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
        { name: "titulo_fojas", label: "Inscripción — fojas", type: "text", required: true, visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" } },
        { name: "titulo_numero", label: "Inscripción — número", type: "text", required: true, visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" } },
        { name: "titulo_anio", label: "Inscripción — año", type: "text", required: true, visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" } },
        { name: "titulo_conservador", label: "Conservador de Bienes Raíces", type: "text", required: true, visibleIf: { field: "titulo_calidad", op: "eq", value: "dueno" } },
        { name: "titulo_descripcion", label: "Documento que lo faculta para arrendar", type: "textarea", required: true, visibleIf: { field: "titulo_calidad", op: "neq", value: "dueno" } },
      ],
    },

    // 4. Arrendatario ────────────────────────────────────────────────────────
    {
      id: "arrendatario",
      title: "Arrendatario",
      description: "Quien tomará el local en arriendo (habitualmente una empresa).",
      fields: [
        {
          name: "arrendatario_naturaleza",
          label: "¿El arrendatario es empresa o persona?",
          type: "select",
          required: true,
          defaultValue: "juridica",
          options: [
            { value: "juridica", label: "Empresa (persona jurídica)" },
            { value: "natural", label: "Persona natural" },
          ],
        },
        { name: "arrendatario_razon_social", label: "Razón social", type: "text", required: true, visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendatario_tipo_societario", label: "Tipo de sociedad", type: "text", required: true, visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendatario_rep_nombre", label: "Representante legal", type: "text", required: true, visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendatario_rep_rut", label: "RUT del representante", type: "rut", required: true, visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "juridica" } },
        { name: "arrendatario_nombre", label: "Nombre completo", type: "text", required: true, visibleIf: { field: "arrendatario_naturaleza", op: "eq", value: "natural" } },
        { name: "arrendatario_rut", label: "RUT (del arrendatario o la empresa)", type: "rut", required: true },
        { name: "arrendatario_domicilio", label: "Domicilio", type: "text", required: true },
        { name: "arrendatario_comuna", label: "Comuna", type: "text", required: true },
        { name: "arrendatario_email", label: "Correo electrónico", type: "text", required: true },
      ],
    },

    // 5. El inmueble ─────────────────────────────────────────────────────────
    {
      id: "inmueble",
      title: "El inmueble",
      description: "Identificación del local y cómo se entrega (esto define el IVA).",
      fields: [
        { name: "inmueble_direccion", label: "Dirección (calle y número)", type: "text", required: true },
        { name: "inmueble_numero_unidad", label: "N° de oficina / local (si corresponde)", type: "text", required: false },
        { name: "inmueble_comuna", label: "Comuna", type: "text", required: true },
        { name: "inmueble_region", label: "Región", type: "text", required: true, defaultValue: "Región Metropolitana" },
        { name: "inmueble_rol_sii", label: "Rol de avalúo (SII)", type: "text", required: false },
        { name: "inmueble_superficie", label: "Superficie aproximada (m²)", type: "number", required: false, validation: { min: 1, max: 1000000 } },
        {
          name: "inmueble_tiene_instalaciones",
          label: "Se entrega con instalaciones para operar (climatización, mesones, cortinas, etc.)",
          type: "boolean",
          defaultValue: false,
          help: "Si es sí, por ley la renta queda afecta a IVA (art. 8 g LIVS).",
        },
        {
          name: "inmueble_amoblado",
          label: "Se entrega amoblado",
          type: "boolean",
          defaultValue: false,
          help: "También hace que la renta quede afecta a IVA.",
        },
      ],
    },

    // 6. Giro y permisos ─────────────────────────────────────────────────────
    {
      id: "giro",
      title: "Giro y permisos",
      description: "Para qué se usará y quién asume el riesgo de la patente.",
      fields: [
        { name: "giro_descripcion", label: "Giro / actividad", type: "text", required: true, placeholder: "Ej: cafetería y venta de pastelería" },
        { name: "giro_codigo_sii", label: "Código de giro SII (si lo sabes)", type: "text", required: false },
        { name: "giro_sustancias_peligrosas", label: "El giro maneja sustancias peligrosas/inflamables", type: "boolean", defaultValue: false },
        {
          name: "permisos_variante",
          label: "Riesgo de factibilidad y patente",
          type: "select",
          defaultValue: "neutra",
          help: "Quién responde si el local no puede obtener la patente o el uso de suelo.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
        { name: "permisos_plazo_condicion", label: "Plazo para obtener la patente (días desde la entrega)", type: "number", defaultValue: 60, validation: { min: 1, max: 365 } },
      ],
    },

    // 7. Plazo y renovación ──────────────────────────────────────────────────
    {
      id: "plazo",
      title: "Plazo",
      description: "Duración y opción de renovación.",
      fields: [
        {
          name: "plazo_modalidad",
          label: "Modalidad del plazo",
          type: "select",
          required: true,
          defaultValue: "renovable",
          options: [
            { value: "fijo", label: "Plazo fijo" },
            { value: "renovable", label: "Plazo fijo renovable" },
            { value: "mes_a_mes", label: "Mes a mes" },
          ],
        },
        { name: "plazo_inicio", label: "Fecha de inicio", type: "date", required: true },
        { name: "plazo_meses", label: "Duración (meses)", type: "number", defaultValue: 36, validation: { min: 1, max: 240 }, visibleIf: { field: "plazo_modalidad", op: "neq", value: "mes_a_mes" } },
        { name: "plazo_termino", label: "Fecha de término", type: "date", required: true, visibleIf: { field: "plazo_modalidad", op: "neq", value: "mes_a_mes" } },
        { name: "plazo_aviso", label: "Aviso para no renovar (días)", type: "number", defaultValue: 60, validation: { min: 1, max: 365 }, visibleIf: { field: "plazo_modalidad", op: "eq", value: "renovable" } },
        { name: "plazo_opcion_renovacion", label: "Dar al arrendatario una opción de renovación", type: "boolean", defaultValue: false, help: "Útil si el arrendatario invierte en habilitar el local y necesita horizonte para amortizar." },
        { name: "plazo_periodos_opcion", label: "N° de períodos de la opción", type: "number", defaultValue: 1, validation: { min: 1, max: 10 }, visibleIf: { field: "plazo_opcion_renovacion", op: "truthy" } },
        { name: "plazo_meses_opcion", label: "Cada período de la opción dura (meses)", type: "number", defaultValue: 36, validation: { min: 1, max: 240 }, visibleIf: { field: "plazo_opcion_renovacion", op: "truthy" } },
        { name: "plazo_aviso_opcion", label: "Aviso para ejercer la opción (días)", type: "number", defaultValue: 90, validation: { min: 1, max: 365 }, visibleIf: { field: "plazo_opcion_renovacion", op: "truthy" } },
      ],
    },

    // 8. Habilitación ────────────────────────────────────────────────────────
    {
      id: "habilitacion",
      title: "Habilitación",
      description: "Obras que el arrendatario hace para operar, y el período de gracia.",
      fields: [
        { name: "habilitacion_aplica", label: "El arrendatario hará obras de habilitación", type: "boolean", defaultValue: false },
        {
          name: "habilitacion_variante",
          label: "Período de gracia e instalaciones",
          type: "select",
          defaultValue: "neutra",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
          visibleIf: { field: "habilitacion_aplica", op: "truthy" },
        },
        { name: "habilitacion_plazo_dias", label: "Plazo para las obras (días)", type: "number", defaultValue: 45, validation: { min: 1, max: 365 }, visibleIf: { field: "habilitacion_aplica", op: "truthy" } },
        { name: "habilitacion_gracia_dias", label: "Días de gracia sin renta", type: "number", defaultValue: 30, validation: { min: 0, max: 365 }, visibleIf: { field: "habilitacion_aplica", op: "truthy" } },
        { name: "habilitacion_meses_amortizacion", label: "Meses para amortizar la inversión (variante pro-arrendatario)", type: "number", defaultValue: 24, validation: { min: 1, max: 120 }, visibleIf: { field: "habilitacion_aplica", op: "truthy" } },
      ],
    },

    // 9. Renta e IVA ─────────────────────────────────────────────────────────
    {
      id: "renta",
      title: "Renta e IVA",
      description: "Renta fija o variable sobre ventas. El IVA se determina solo.",
      fields: [
        {
          name: "renta_modalidad",
          label: "Tipo de renta",
          type: "select",
          required: true,
          defaultValue: "fija",
          options: [
            { value: "fija", label: "Fija" },
            { value: "variable", label: "Variable sobre ventas (mínimo garantizado + %)" },
          ],
        },
        {
          name: "renta_moneda",
          label: "Moneda",
          type: "select",
          required: true,
          defaultValue: "CLP",
          options: [
            { value: "CLP", label: "Pesos (CLP)" },
            { value: "UF", label: "Unidades de Fomento (UF)" },
          ],
        },
        { name: "renta_monto_clp", label: "Renta / mínimo garantizado (CLP)", type: "money_clp", required: true, help: "Si la renta es variable, este es el mínimo garantizado.", validation: { min: 1 }, visibleIf: { field: "renta_moneda", op: "eq", value: "CLP" } },
        { name: "renta_monto_uf", label: "Renta / mínimo garantizado (UF)", type: "money_uf", required: true, validation: { min: 0.1 }, visibleIf: { field: "renta_moneda", op: "eq", value: "UF" } },
        { name: "renta_variable_pct", label: "Porcentaje sobre las ventas netas (%)", type: "number", required: true, validation: { min: 0, max: 100 }, visibleIf: { field: "renta_modalidad", op: "eq", value: "variable" } },
        { name: "renta_dias_reporte", label: "Días para reportar ventas cada mes", type: "number", defaultValue: 5, validation: { min: 1, max: 28 }, visibleIf: { field: "renta_modalidad", op: "eq", value: "variable" } },
        {
          name: "renta_frecuencia_auditoria",
          label: "Frecuencia de auditoría de ventas",
          type: "select",
          defaultValue: "semestral",
          options: [
            { value: "trimestralmente", label: "Trimestral" },
            { value: "semestralmente", label: "Semestral" },
            { value: "anualmente", label: "Anual" },
          ],
          visibleIf: { field: "renta_modalidad", op: "eq", value: "variable" },
        },
        { name: "renta_umbral_auditoria", label: "Umbral de diferencia que traslada el costo de auditoría (%)", type: "number", defaultValue: 5, validation: { min: 1, max: 50 }, visibleIf: { field: "renta_modalidad", op: "eq", value: "variable" } },
        { name: "renta_dia_pago", label: "Día de pago de cada mes", type: "number", defaultValue: 5, validation: { min: 1, max: 31 } },
        {
          name: "renta_reajuste_frecuencia",
          label: "Reajuste (solo si la renta está en pesos)",
          type: "select",
          defaultValue: "anualmente",
          options: [
            { value: "anualmente", label: "Anual (IPC)" },
            { value: "semestralmente", label: "Semestral (IPC)" },
          ],
          visibleIf: { field: "renta_moneda", op: "eq", value: "CLP" },
        },
      ],
    },

    // 10. Caución ─────────────────────────────────────────────────────────────
    {
      id: "caucion",
      title: "Caución",
      description: "La garantía. En comercial suele ser boleta bancaria o fianza de la matriz.",
      fields: [
        {
          name: "caucion_tipo",
          label: "Tipo de garantía",
          type: "select",
          required: true,
          defaultValue: "deposito",
          options: [
            { value: "deposito", label: "Depósito en garantía" },
            { value: "boleta_bancaria", label: "Boleta de garantía bancaria" },
          ],
        },
        { name: "caucion_rentas", label: "Equivalente a (rentas)", type: "number", defaultValue: 2, validation: { min: 1, max: 12 } },
        { name: "caucion_dias_vencimiento", label: "Vencimiento posterior al término (días)", type: "number", defaultValue: 90, validation: { min: 1, max: 365 }, visibleIf: { field: "caucion_tipo", op: "eq", value: "boleta_bancaria" } },
        { name: "caucion_dias_renovacion", label: "Aviso para renovar la boleta (días)", type: "number", defaultValue: 30, validation: { min: 1, max: 180 }, visibleIf: { field: "caucion_tipo", op: "eq", value: "boleta_bancaria" } },
        { name: "caucion_dias_rendicion", label: "Días para rendir lo cobrado", type: "number", defaultValue: 15, validation: { min: 1, max: 90 }, visibleIf: { field: "caucion_tipo", op: "eq", value: "boleta_bancaria" } },
        { name: "caucion_dias_restitucion", label: "Días para devolver el depósito", type: "number", defaultValue: 30, validation: { min: 1, max: 180 }, visibleIf: { field: "caucion_tipo", op: "eq", value: "deposito" } },
        { name: "fianza_matriz_aplica", label: "Agregar fianza solidaria de la sociedad matriz", type: "boolean", defaultValue: false },
        { name: "fianza_razon_social", label: "Razón social de la matriz", type: "text", required: true, visibleIf: { field: "fianza_matriz_aplica", op: "truthy" } },
        { name: "fianza_rut", label: "RUT de la matriz", type: "rut", required: true, visibleIf: { field: "fianza_matriz_aplica", op: "truthy" } },
      ],
    },

    // 11. Seguros ─────────────────────────────────────────────────────────────
    {
      id: "seguros",
      title: "Seguros",
      description: "Coberturas que toma el arrendatario.",
      fields: [
        { name: "seguros_rc_uf", label: "Capital de responsabilidad civil (UF)", type: "number", defaultValue: 2000, validation: { min: 1, max: 1000000 } },
        { name: "seguros_exige_endoso", label: "Exigir endoso de la póliza a favor del arrendador", type: "boolean", defaultValue: true },
        { name: "seguros_dias_acreditacion", label: "Días para acreditar las pólizas", type: "number", defaultValue: 15, validation: { min: 1, max: 90 } },
      ],
    },

    // 12. Operación (retail / centro comercial) ───────────────────────────────
    {
      id: "operacion",
      title: "Operación",
      description: "Aplica a locales comerciales: horario, exclusividad y centro comercial.",
      fields: [
        { name: "operacion_horario", label: "Horario de funcionamiento", type: "text", defaultValue: "de funcionamiento del centro o del sector", visibleIf: { field: "inmueble_subtipo", op: "eq", value: "local_comercial" } },
        { name: "operacion_dias_cierre_max", label: "Máximo de días de cierre continuo permitido", type: "number", defaultValue: 3, validation: { min: 1, max: 60 }, visibleIf: { field: "inmueble_subtipo", op: "eq", value: "local_comercial" } },
        { name: "operacion_pena_diaria", label: "Multa por día de cierre injustificado (veces la renta diaria)", type: "number", defaultValue: 2, validation: { min: 1, max: 10 }, visibleIf: { field: "inmueble_subtipo", op: "eq", value: "local_comercial" } },
        { name: "exclusividad_aplica", label: "Pactar exclusividad de giro (el arrendador no arrienda a competidores)", type: "boolean", defaultValue: false, visibleIf: { field: "inmueble_subtipo", op: "eq", value: "local_comercial" } },
        { name: "exclusividad_ambito", label: "Ámbito geográfico de la exclusividad", type: "text", required: true, placeholder: "Ej: el mismo edificio", visibleIf: { field: "exclusividad_aplica", op: "truthy" } },
        { name: "exclusividad_giro_protegido", label: "Giro protegido", type: "text", required: true, visibleIf: { field: "exclusividad_aplica", op: "truthy" } },
        { name: "exclusividad_radio_metros", label: "Radio de no competencia del arrendatario (metros)", type: "number", defaultValue: 500, validation: { min: 1, max: 100000 }, visibleIf: { field: "exclusividad_aplica", op: "truthy" } },
        { name: "centro_nombre", label: "Nombre del centro comercial", type: "text", required: true, visibleIf: { field: "en_centro_comercial", op: "truthy" } },
        { name: "centro_fondo_promocional", label: "Aporte mensual al fondo promocional (CLP)", type: "money_clp", required: true, visibleIf: { field: "en_centro_comercial", op: "truthy" } },
        {
          name: "centro_frecuencia_rendicion",
          label: "Frecuencia de rendición del fondo",
          type: "select",
          defaultValue: "anualmente",
          options: [
            { value: "semestralmente", label: "Semestral" },
            { value: "anualmente", label: "Anual" },
          ],
          visibleIf: { field: "en_centro_comercial", op: "truthy" },
        },
      ],
    },

    // 13. Cesión, reparaciones y término (tono) ───────────────────────────────
    {
      id: "equilibrio",
      title: "Cesión y término",
      description: "Las cláusulas que más se negocian en comercial.",
      fields: [
        {
          name: "cesion_variante",
          label: "Cesión, subarriendo y cambio de control",
          type: "select",
          defaultValue: "neutra",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
        { name: "cesion_dias_aviso", label: "Aviso de cambio de control (días)", type: "number", defaultValue: 15, validation: { min: 1, max: 180 } },
        { name: "cesion_dias_termino", label: "Aviso de término si el nuevo controlador no es apto (días)", type: "number", defaultValue: 90, validation: { min: 1, max: 365 } },
        {
          name: "terminacion_variante",
          label: "Terminación anticipada",
          type: "select",
          defaultValue: "neutra",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_arrendador", label: "Más favorable al arrendador" },
            { value: "pro_arrendatario", label: "Más favorable al arrendatario" },
          ],
        },
        { name: "terminacion_aviso_dias", label: "Aviso para terminar (días)", type: "number", defaultValue: 90, validation: { min: 1, max: 365 } },
        { name: "terminacion_multa_rentas", label: "Multa por término anticipado (rentas)", type: "number", defaultValue: 3, validation: { min: 0, max: 12 } },
        { name: "terminacion_plazo_subsanacion", label: "Plazo para subsanar incumplimiento (días)", type: "number", defaultValue: 30, validation: { min: 1, max: 90 } },
        { name: "terminacion_tope_rentas", label: "Tope de rentas si el arrendatario incumple (variante pro-arrendador)", type: "number", defaultValue: 6, validation: { min: 1, max: 24 }, visibleIf: { field: "terminacion_variante", op: "eq", value: "pro_arrendador" } },
        { name: "terminacion_meses_minimos", label: "Meses mínimos antes de poder salir sin multa (variante pro-arrendatario)", type: "number", defaultValue: 12, validation: { min: 1, max: 60 }, visibleIf: { field: "terminacion_variante", op: "eq", value: "pro_arrendatario" } },
        { name: "terminacion_dias_inhabilidad", label: "Días de inhabilidad del local que permiten salir (variante pro-arrendatario)", type: "number", defaultValue: 30, validation: { min: 1, max: 180 }, visibleIf: { field: "terminacion_variante", op: "eq", value: "pro_arrendatario" } },
        { name: "restitucion_dias_retiro", label: "Días para retirar instalaciones antes del término", type: "number", defaultValue: 10, validation: { min: 1, max: 60 } },
        { name: "restitucion_recargo_pct", label: "Recargo por día de atraso en restituir (%)", type: "number", defaultValue: 50, validation: { min: 0, max: 100 } },
      ],
    },

    // 14. Jurisdicción y firma ────────────────────────────────────────────────
    {
      id: "cierre",
      title: "Jurisdicción y firma",
      description: "Dónde se resuelven las disputas y cómo se firma.",
      fields: [
        {
          name: "jurisdiccion_es_arbitraje",
          label: "Resolver disputas por arbitraje (en vez de tribunales)",
          type: "boolean",
          defaultValue: false,
          help: "Ojo: este contrato se rige por la Ley 18.101, que da competencia al tribunal del inmueble; el arbitraje puede ser objetado.",
        },
        {
          name: "jurisdiccion_tipo_arbitro",
          label: "Tipo de árbitro",
          type: "select",
          defaultValue: "mixto",
          options: [
            { value: "arbitrador", label: "Arbitrador" },
            { value: "mixto", label: "Mixto" },
            { value: "de derecho", label: "De derecho" },
          ],
          visibleIf: { field: "jurisdiccion_es_arbitraje", op: "truthy" },
        },
        {
          name: "firma_modalidad",
          label: "Modalidad de firma",
          type: "select",
          required: true,
          defaultValue: "notarial",
          options: [
            { value: "notarial", label: "Firmas ante notario (recomendado)" },
            { value: "fea", label: "Firma electrónica avanzada" },
            { value: "simple", label: "Firma simple" },
          ],
        },
        { name: "firma_ejemplares", label: "Número de ejemplares", type: "number", defaultValue: 3, validation: { min: 2, max: 6 } },
      ],
    },
  ],

  // ── CLÁUSULAS ────────────────────────────────────────────────────────────
  clauses: [
    {
      id: "comparecencia",
      heading: "CONTRATO DE ARRENDAMIENTO DE INMUEBLE COMERCIAL",
      text: "En {{contrato_ciudad}}, a {{contrato_fecha}}, entre {{#eq arrendador_naturaleza \"juridica\"}}{{arrendador_razon_social}}, {{arrendador_tipo_societario}}, rol único tributario N° {{arrendador_rut}}, representada por don(ña) {{arrendador_rep_nombre}}, cédula nacional de identidad N° {{arrendador_rep_rut}}{{else}}don(ña) {{arrendador_nombre}}, {{arrendador_nacionalidad}}, cédula nacional de identidad N° {{arrendador_rut}}{{/eq}}, domiciliado en {{arrendador_domicilio}}, comuna de {{arrendador_comuna}}, en adelante el \"Arrendador\"; y {{#eq arrendatario_naturaleza \"juridica\"}}{{arrendatario_razon_social}}, {{arrendatario_tipo_societario}}, rol único tributario N° {{arrendatario_rut}}, representada por don(ña) {{arrendatario_rep_nombre}}, cédula nacional de identidad N° {{arrendatario_rep_rut}}{{else}}don(ña) {{arrendatario_nombre}}, cédula nacional de identidad N° {{arrendatario_rut}}{{/eq}}, domiciliado en {{arrendatario_domicilio}}, comuna de {{arrendatario_comuna}}, en adelante el \"Arrendatario\"; quienes se denominarán conjuntamente \"las Partes\", han convenido el siguiente contrato de arrendamiento:",
    },
    {
      id: "titulo",
      heading: "{{ORD}}: TÍTULO DEL ARRENDADOR",
      text: "{{#eq titulo_calidad \"dueno\"}}El Arrendador declara ser dueño del inmueble que más adelante se individualiza, cuyo dominio se encuentra inscrito a su nombre a fojas {{titulo_fojas}} número {{titulo_numero}} del Registro de Propiedad del Conservador de Bienes Raíces de {{titulo_conservador}}, correspondiente al año {{titulo_anio}}.{{else}}El Arrendador declara detentar la calidad de {{titulo_calidad}} respecto del inmueble, y encontrarse facultado para ceder su uso y goce en virtud de {{titulo_descripcion}}, documento que se acompaña como anexo.{{/eq}} El Arrendador declara que sobre el inmueble no pesan prohibiciones, embargos ni litigios que impidan la celebración de este contrato.",
    },
    {
      id: "inmueble",
      heading: "{{ORD}}: INDIVIDUALIZACIÓN DEL INMUEBLE",
      text: "El Arrendador da en arrendamiento al Arrendatario, quien acepta para sí, el inmueble consistente en {{inmueble_subtipo}} ubicado en {{inmueble_direccion}}{{#if inmueble_numero_unidad}}, unidad N° {{inmueble_numero_unidad}}{{/if}}, comuna de {{inmueble_comuna}}, {{inmueble_region}}{{#if inmueble_rol_sii}}, rol de avalúo N° {{inmueble_rol_sii}}{{/if}}{{#if inmueble_superficie}}, de una superficie aproximada de {{inmueble_superficie}} metros cuadrados{{/if}}. {{#if inmueble_amoblado}}El inmueble se entrega amoblado, según el inventario que se acompaña como anexo. {{/if}}{{#if inmueble_tiene_instalaciones}}El inmueble se entrega dotado de instalaciones que permiten el ejercicio de la actividad del Arrendatario.{{/if}}",
    },
    {
      id: "destino-giro",
      heading: "{{ORD}}: DESTINO Y GIRO AUTORIZADO",
      text: "El inmueble se destinará exclusivamente al funcionamiento de {{giro_descripcion}}{{#if giro_codigo_sii}}, correspondiente al giro {{giro_codigo_sii}} del Arrendatario{{/if}}, quedando prohibido destinarlo, total o parcialmente, a un fin o giro distinto sin autorización previa y escrita del Arrendador. {{#eq inmueble_subtipo \"local_comercial\"}}El Arrendatario se obliga a mantener el giro autorizado durante toda la vigencia del contrato; su modificación requerirá autorización escrita, la que no podrá denegarse sin causa justificada. {{/eq}}El Arrendatario declara que el giro {{#if giro_sustancias_peligrosas}}contempla el manejo de sustancias reguladas, las que mantendrá debidamente autorizadas por la autoridad competente{{else}}no importa el almacenamiento ni manipulación de sustancias peligrosas, inflamables o explosivas{{/if}}.",
    },
    {
      id: "factibilidad",
      heading: "{{ORD}}: FACTIBILIDAD, PERMISOS Y PATENTE",
      text: "{{#eq permisos_variante \"pro_arrendador\"}}El Arrendatario declara haber verificado, previamente y bajo su exclusiva responsabilidad, que el inmueble es apto para su giro, habiendo revisado el certificado de informaciones previas, el uso de suelo, la recepción final y las condiciones sanitarias y de seguridad exigibles. Serán de su exclusivo cargo la obtención y mantención de la patente municipal, permisos y autorizaciones sanitarias. El rechazo o revocación de cualquiera de ellos no afectará la vigencia del contrato ni liberará al Arrendatario del pago de la renta.{{else}}{{#eq permisos_variante \"pro_arrendatario\"}}El Arrendador declara y garantiza que el inmueble cuenta con recepción final municipal, uso de suelo compatible con el giro señalado y las condiciones estructurales, sanitarias y de seguridad necesarias para su funcionamiento, obligándose a subsanar a su costo cualquier deficiencia que impida o retarde la obtención de los permisos. El contrato queda sujeto a la condición suspensiva de que el Arrendatario obtenga la patente municipal definitiva dentro de los {{permisos_plazo_condicion}} días siguientes a la entrega; de no obtenerla por causa no imputable a él, el contrato se tendrá por no celebrado y el Arrendador restituirá íntegramente cuanto hubiere recibido.{{else}}El Arrendador declara que el inmueble cuenta con recepción final municipal y que su uso de suelo admite el destino señalado, acompañando el certificado de informaciones previas como anexo. Serán de cargo del Arrendatario la obtención y mantención de la patente municipal, permisos y autorizaciones sanitarias propias de su actividad. Si dentro de los {{permisos_plazo_condicion}} días siguientes a la entrega el Arrendatario no obtuviere la patente por causa imputable a la condición del inmueble o a su uso de suelo, podrá poner término al contrato sin indemnización alguna, restituyéndosele la caución y las rentas pagadas por el período no utilizado.{{/eq}}{{/eq}}",
    },
    {
      id: "plazo",
      heading: "{{ORD}}: PLAZO Y RENOVACIÓN",
      text: "{{#eq plazo_modalidad \"fijo\"}}El presente contrato tendrá una vigencia de {{plazo_meses}} meses, a contar del {{plazo_inicio}} y hasta el {{plazo_termino}}, fecha en que el Arrendatario deberá restituir el inmueble.{{/eq}}{{#eq plazo_modalidad \"renovable\"}}El presente contrato tendrá una vigencia de {{plazo_meses}} meses, a contar del {{plazo_inicio}} y hasta el {{plazo_termino}}, renovable automática y sucesivamente por períodos iguales, salvo aviso escrito en contrario de cualquiera de las Partes con a lo menos {{plazo_aviso}} días de anticipación al vencimiento del período respectivo.{{/eq}}{{#eq plazo_modalidad \"mes_a_mes\"}}El presente contrato regirá a contar del {{plazo_inicio}} y tendrá una duración indefinida, de mes a mes, pudiendo terminarse mediante desahucio en los términos del artículo 3° de la Ley N° 18.101.{{/eq}}{{#if plazo_opcion_renovacion}} El Arrendatario tendrá el derecho, y no la obligación, de renovar el contrato por {{plazo_periodos_opcion}} período(s) adicional(es) de {{plazo_meses_opcion}} meses, ejerciendo dicha opción mediante aviso escrito con {{plazo_aviso_opcion}} días de anticipación, y siempre que se encuentre al día en el cumplimiento de sus obligaciones.{{/if}}",
    },
    {
      id: "habilitacion",
      heading: "{{ORD}}: HABILITACIÓN Y PERÍODO DE GRACIA",
      condition: { field: "habilitacion_aplica", op: "truthy" },
      text: "El Arrendatario ejecutará en el inmueble las obras de habilitación necesarias para su giro, conforme al proyecto que se acompaña como anexo, previamente aprobado por el Arrendador. {{#eq habilitacion_variante \"pro_arrendador\"}}Las obras se ejecutarán dentro de los {{habilitacion_plazo_dias}} días siguientes a la entrega, a exclusivo costo del Arrendatario y con permisos de su cargo. La renta se devengará desde la entrega, sin período de gracia. Toda obra, instalación o mejora quedará en beneficio del inmueble al término del contrato, sin derecho a indemnización ni reembolso.{{else}}{{#eq habilitacion_variante \"pro_arrendatario\"}}El Arrendatario dispondrá de {{habilitacion_plazo_dias}} días de gracia contados desde la entrega, durante los cuales no se devengará renta ni gastos comunes. El Arrendador otorgará los mandatos y autorizaciones necesarios para tramitar los permisos y no obstaculizará las obras. Al término del contrato el Arrendatario podrá retirar sus instalaciones y elementos de marca; si el contrato terminare por causa imputable al Arrendador antes de {{habilitacion_meses_amortizacion}} meses, este deberá indemnizar la parte no amortizada de la inversión acreditada.{{else}}Las obras se ejecutarán dentro de los {{habilitacion_plazo_dias}} días siguientes a la entrega, a costo del Arrendatario y con permisos de su cargo. Durante dicho plazo, y con un máximo de {{habilitacion_gracia_dias}} días, el Arrendatario estará exento del pago de renta, debiendo asumir los gastos comunes y consumos. Las instalaciones adheridas permanentemente quedarán en beneficio del inmueble; las removibles sin detrimento podrán ser retiradas por el Arrendatario, reparando los daños que el retiro ocasione.{{/eq}}{{/eq}}",
    },
    {
      id: "renta",
      heading: "{{ORD}}: RENTA E IMPUESTO AL VALOR AGREGADO",
      text: "{{#eq renta_modalidad \"variable\"}}La renta mensual será la mayor de: a) un mínimo garantizado de {{#eq renta_moneda \"UF\"}}{{renta_monto_uf:money_uf}} Unidades de Fomento{{else}}{{renta_monto_clp:money_clp}}{{/eq}}; o b) el {{renta_variable_pct}}% de las ventas netas del Arrendatario en el inmueble durante el mes respectivo. Se entenderá por ventas netas el total de ingresos percibidos, deducidos el Impuesto al Valor Agregado, las devoluciones y las anulaciones documentadas. El Arrendatario informará las ventas dentro de los {{renta_dias_reporte}} primeros días de cada mes, y el Arrendador podrá auditarlas {{renta_frecuencia_auditoria}}, a su costo, salvo que se detecte una diferencia superior al {{renta_umbral_auditoria}}%, caso en el cual el costo será de cargo del Arrendatario.{{else}}La renta mensual de arrendamiento será la suma de {{#eq renta_moneda \"UF\"}}{{renta_monto_uf:money_uf}} Unidades de Fomento{{else}}{{renta_monto_clp:money_clp}}{{/eq}}.{{/eq}} La renta se pagará por mensualidades anticipadas, dentro de los primeros {{renta_dia_pago}} días de cada mes, mediante transferencia electrónica a la cuenta que el Arrendador indique.\n{{#if inmueble_tiene_instalaciones}}Por entregarse el inmueble dotado de instalaciones que permiten el ejercicio de una actividad comercial o industrial, la renta se encuentra afecta al Impuesto al Valor Agregado conforme al artículo 8° letra g) de la Ley sobre Impuesto a las Ventas y Servicios, el que se recargará y documentará mediante factura. Para la determinación de la base imponible se deducirá el 11% anual del avalúo fiscal del inmueble, en la proporción que corresponda al período, conforme al artículo 17 del mismo cuerpo legal.{{else}}{{#if inmueble_amoblado}}Por entregarse el inmueble amoblado, la renta se encuentra afecta al Impuesto al Valor Agregado conforme al artículo 8° letra g) de la Ley sobre Impuesto a las Ventas y Servicios, el que se recargará y documentará mediante factura, deduciéndose de la base imponible el 11% anual del avalúo fiscal en la proporción del período (artículo 17).{{else}}El arrendamiento del inmueble, en las condiciones en que se entrega, no se encuentra afecto al Impuesto al Valor Agregado.{{/if}}{{/if}} El simple retardo constituirá en mora al Arrendatario, devengándose el interés máximo convencional desde el primer día de atraso.",
    },
    {
      id: "reajuste",
      heading: "{{ORD}}: REAJUSTE",
      text: "{{#eq renta_moneda \"UF\"}}Encontrándose la renta expresada en Unidades de Fomento, no procede reajuste adicional.{{else}}La renta se reajustará {{renta_reajuste_frecuencia}} conforme a la variación que experimente el Índice de Precios al Consumidor, operando el reajuste de pleno derecho.{{/eq}}",
    },
    {
      id: "caucion",
      heading: "{{ORD}}: CAUCIÓN",
      text: "{{#eq caucion_tipo \"boleta_bancaria\"}}Para garantizar el íntegro y oportuno cumplimiento de sus obligaciones, el Arrendatario entrega en este acto al Arrendador una boleta de garantía bancaria, a la vista, irrevocable y pagadera al solo requerimiento, tomada a nombre del Arrendador por un monto equivalente a {{caucion_rentas}} rentas de arrendamiento, con vencimiento no inferior a {{caucion_dias_vencimiento}} días posteriores al término del contrato. El Arrendatario se obliga a renovarla con a lo menos {{caucion_dias_renovacion}} días de anticipación a su vencimiento; su falta de renovación constituirá incumplimiento grave. El Arrendador podrá hacerla efectiva para cubrir rentas, gastos comunes, consumos, reparaciones o indemnizaciones adeudadas, comunicando el detalle de lo imputado dentro de los {{caucion_dias_rendicion}} días siguientes.{{else}}El Arrendatario entrega en este acto, en garantía del fiel cumplimiento de sus obligaciones, una suma equivalente a {{caucion_rentas}} rentas de arrendamiento, que no constituye renta anticipada. Será restituida, reajustada conforme a la variación del Índice de Precios al Consumidor, dentro de los {{caucion_dias_restitucion}} días siguientes a la restitución material del inmueble, previa deducción documentada de las sumas adeudadas.{{/eq}}{{#if fianza_matriz_aplica}} Adicionalmente, {{fianza_razon_social}}, rol único tributario N° {{fianza_rut}}, sociedad matriz del Arrendatario, comparece constituyéndose en fiadora y codeudora solidaria de todas las obligaciones que este asume por el presente contrato, renunciando a los beneficios de excusión y división, obligación que subsistirá hasta la restitución material del inmueble y el pago íntegro de lo adeudado.{{/if}}",
    },
    {
      id: "gastos",
      heading: "{{ORD}}: GASTOS COMUNES, SERVICIOS Y CONTRIBUCIONES",
      text: "Serán de cargo del Arrendatario los gastos comunes, los consumos de electricidad, agua, gas e internet, y toda patente o permiso propio de su actividad. Las contribuciones de bienes raíces serán de cargo del Arrendador, salvo el recargo que corresponda por el destino comercial. El Arrendatario se obliga a mantener al día dichos pagos y a acreditarlos al momento de la restitución.",
    },
    {
      id: "entrega",
      heading: "{{ORD}}: ENTREGA Y ESTADO DEL INMUEBLE",
      text: "El inmueble se entrega en el estado que consta en el acta de entrega e inventario que se acompaña como anexo, con la lectura de los medidores de los servicios domiciliarios. El Arrendatario declara recibirlo a su satisfacción y se obliga a restituirlo en el mismo estado, habida consideración del deterioro proveniente del uso legítimo.",
    },
    {
      id: "reparaciones",
      heading: "{{ORD}}: CONSERVACIÓN Y REPARACIONES",
      text: "Serán de cargo del Arrendatario la mantención y las reparaciones locativas del inmueble, así como la mantención de las instalaciones que hubiere incorporado, incluyendo climatización, instalaciones eléctricas interiores, sistemas de extracción, vitrinas y cortinas metálicas. Serán de cargo del Arrendador las reparaciones que afecten la estructura, techumbre, fachada y matrices generales de agua, gas y electricidad, las que deberá ejecutar dentro de un plazo razonable contado desde el aviso escrito del Arrendatario. Si tales reparaciones impidieren el funcionamiento del giro por más de quince días continuos, la renta se rebajará proporcionalmente al período y superficie afectados.",
    },
    {
      id: "mejoras",
      heading: "{{ORD}}: MEJORAS E INSTALACIONES DEL ARRENDATARIO",
      text: "Las instalaciones adheridas permanentemente al inmueble quedarán en beneficio de este al término del contrato, sin derecho a indemnización, salvo pacto escrito en contrario. Las instalaciones y elementos removibles sin detrimento del inmueble podrán ser retirados por el Arrendatario al término, quien deberá reparar los daños que el retiro ocasione.",
    },
    {
      id: "seguros",
      heading: "{{ORD}}: SEGUROS",
      text: "El Arrendatario contratará y mantendrá vigentes, a su costo: a) un seguro de responsabilidad civil por daños a terceros, con un capital asegurado no inferior a {{seguros_rc_uf}} Unidades de Fomento; y b) un seguro de incendio y sismo sobre las instalaciones y contenidos de su propiedad.{{#if seguros_exige_endoso}} Además, endosará la póliza en favor del Arrendador en cuanto a las instalaciones adheridas al inmueble.{{/if}} El Arrendatario acompañará copia de las pólizas y sus renovaciones dentro de los {{seguros_dias_acreditacion}} días siguientes a su contratación. El Arrendador mantendrá asegurado el inmueble por su valor de reconstrucción.",
    },
    {
      id: "cesion",
      heading: "{{ORD}}: CESIÓN, SUBARRIENDO Y CAMBIO DE CONTROL",
      text: "{{#eq cesion_variante \"pro_arrendador\"}}Queda prohibido al Arrendatario ceder o transferir el presente contrato, subarrendar el inmueble total o parcialmente, y constituir sobre él derecho alguno en favor de terceros. Se entenderá cesión, para todos los efectos de este contrato, cualquier acto que importe el cambio del controlador del Arrendatario, sea por transferencia de acciones o derechos, fusión, división o transformación. La infracción facultará al Arrendador para poner término inmediato al contrato y cobrar la caución.{{else}}{{#eq cesion_variante \"pro_arrendatario\"}}El Arrendatario podrá ceder el contrato o subarrendar el inmueble, total o parcialmente, a sociedades de su mismo grupo empresarial, bastando el aviso previo al Arrendador. Respecto de terceros, requerirá autorización escrita, la que no podrá denegarse sin causa justificada. Las reorganizaciones societarias internas, fusiones, divisiones y transformaciones no se considerarán cesión ni requerirán autorización.{{else}}El Arrendatario no podrá ceder el contrato ni subarrendar el inmueble sin autorización previa y escrita del Arrendador, la que no podrá denegarse sin causa justificada cuando el cesionario acredite solvencia equivalente o superior y mantenga el giro autorizado. El cambio de controlador del Arrendatario deberá comunicarse al Arrendador dentro de los {{cesion_dias_aviso}} días siguientes; si el nuevo controlador desarrollare un giro incompatible o careciere de solvencia suficiente, el Arrendador podrá exigir caución adicional o poner término al contrato con {{cesion_dias_termino}} días de aviso.{{/eq}}{{/eq}}",
    },
    {
      id: "operacion",
      heading: "{{ORD}}: OPERACIÓN CONTINUA Y HORARIO",
      condition: { field: "inmueble_subtipo", op: "eq", value: "local_comercial" },
      text: "El Arrendatario se obliga a mantener el local abierto y en funcionamiento efectivo durante todo el horario {{operacion_horario}}, con personal, mercadería y atención al público suficientes, y a no cerrarlo por más de {{operacion_dias_cierre_max}} días continuos salvo caso fortuito, fuerza mayor, obras autorizadas o feriados legales. El incumplimiento de esta obligación facultará al Arrendador para cobrar, a título de cláusula penal, una suma equivalente a {{operacion_pena_diaria}} veces la renta diaria por cada día de cierre injustificado, sin perjuicio de su derecho a poner término al contrato.",
    },
    {
      id: "exclusividad",
      heading: "{{ORD}}: EXCLUSIVIDAD DE GIRO Y RADIO",
      condition: {
        all: [
          { field: "inmueble_subtipo", op: "eq", value: "local_comercial" },
          { field: "exclusividad_aplica", op: "truthy" },
        ],
      },
      text: "El Arrendador se obliga a no arrendar ni ceder el uso de otras unidades de su propiedad ubicadas en {{exclusividad_ambito}} a terceros que desarrollen el giro de {{exclusividad_giro_protegido}}, mientras el Arrendatario se mantenga al día en sus obligaciones y opere efectivamente el local. Correlativamente, el Arrendatario se obliga a no operar, directamente ni a través de personas relacionadas, otro establecimiento del mismo giro dentro de un radio de {{exclusividad_radio_metros}} metros del inmueble, durante la vigencia del contrato.",
    },
    {
      id: "fondo",
      heading: "{{ORD}}: FONDO PROMOCIONAL Y REGLAMENTO DEL CENTRO",
      condition: { field: "en_centro_comercial", op: "truthy" },
      text: "El Arrendatario declara conocer y aceptar el Reglamento de Operación del {{centro_nombre}}, que se acompaña como anexo y forma parte integrante de este contrato, obligándose a darle íntegro cumplimiento y a acatar las instrucciones de la administración en materia de horarios, accesos, carga y descarga, publicidad, ruido y aseo. El Arrendatario aportará mensualmente al fondo promocional del centro la suma de {{centro_fondo_promocional:money_clp}}, destinada a las campañas de promoción y publicidad conjunta, cuyo destino será rendido por la administración {{centro_frecuencia_rendicion}}.",
    },
    {
      id: "inspeccion",
      heading: "{{ORD}}: INSPECCIÓN",
      text: "El Arrendador, o quien este designe, podrá inspeccionar el inmueble previo aviso al Arrendatario con a lo menos 48 horas de anticipación, en días y horario razonables, sin perturbar el desarrollo normal del giro.",
    },
    {
      id: "terminacion",
      heading: "{{ORD}}: TERMINACIÓN ANTICIPADA",
      text: "{{#eq terminacion_variante \"pro_arrendador\"}}El Arrendatario no podrá poner término anticipado al contrato. Si lo hiciere, o si el contrato terminare por causa que le sea imputable, deberá pagar al Arrendador, a título de cláusula penal, las rentas correspondientes al período que restare hasta el vencimiento, con un máximo de {{terminacion_tope_rentas}} rentas.{{else}}{{#eq terminacion_variante \"pro_arrendatario\"}}El Arrendatario podrá poner término anticipado al contrato dando aviso escrito con {{terminacion_aviso_dias}} días de anticipación, sin multa, transcurridos que sean {{terminacion_meses_minimos}} meses desde el inicio. Podrá además terminarlo de inmediato, sin indemnización, si por causa no imputable a él la autoridad ordenare la clausura del local, revocare la patente por razones atribuibles a la condición del inmueble, o si el inmueble resultare inhábil para el giro por más de {{terminacion_dias_inhabilidad}} días.{{else}}El Arrendatario podrá poner término anticipado al contrato dando aviso escrito con {{terminacion_aviso_dias}} días de anticipación y pagando, a título de cláusula penal, una suma equivalente a {{terminacion_multa_rentas}} rentas de arrendamiento. Cualquiera de las Partes podrá terminarlo de inmediato en caso de incumplimiento grave de la otra no subsanado dentro de los {{terminacion_plazo_subsanacion}} días siguientes al requerimiento escrito, o en caso de que la contraparte fuere sometida a un procedimiento concursal de liquidación.{{/eq}}{{/eq}}",
    },
    {
      id: "restitucion",
      heading: "{{ORD}}: RESTITUCIÓN Y RETIRO DE INSTALACIONES",
      text: "Al término del contrato el Arrendatario restituirá el inmueble desocupado, libre de mercaderías, equipos y personal, en el estado en que lo recibió según el acta de entrega, habida consideración del deterioro por el uso legítimo, y acreditando el pago íntegro de rentas, gastos comunes, consumos y patente. El Arrendatario deberá retirar sus elementos de marca, rotulación y señalética, y reparar los daños que el retiro ocasione, dentro de los {{restitucion_dias_retiro}} días anteriores al término. Si no restituyere oportunamente, pagará por cada día de atraso una suma equivalente a la renta diaria vigente aumentada en un {{restitucion_recargo_pct}}%, a título de cláusula penal, sin perjuicio de las acciones legales que correspondan. La restitución se obtendrá siempre por la vía judicial; el Arrendador no podrá recurrir a medios de autotutela.",
    },
    {
      id: "notificaciones",
      heading: "{{ORD}}: NOTIFICACIONES Y DOMICILIO ELECTRÓNICO",
      text: "Las Partes fijan como domicilio los indicados en la comparecencia y reconocen como medio idóneo y suficiente de comunicación los correos electrónicos: Arrendador, {{arrendador_email}}; Arrendatario, {{arrendatario_email}}. Todo cambio deberá comunicarse por escrito a la otra Parte dentro de quinto día.",
    },
    {
      id: "datos",
      heading: "{{ORD}}: TRATAMIENTO DE DATOS PERSONALES",
      text: "Las Partes se autorizan recíprocamente a tratar los datos personales entregados con la exclusiva finalidad de la celebración, ejecución, cobro y término de este contrato, conforme a la Ley N° 19.628 y a la Ley N° 21.719 sobre protección de datos personales.",
    },
    {
      id: "competencia",
      heading: "{{ORD}}: DOMICILIO, COMPETENCIA Y ARBITRAJE",
      text: "{{#if jurisdiccion_es_arbitraje}}Toda dificultad o controversia que se produzca entre las Partes será sometida a arbitraje conforme al Reglamento del Centro de Arbitraje y Mediación de Santiago, confiriendo las Partes mandato a la Cámara de Comercio de Santiago A.G. para designar al árbitro {{jurisdiccion_tipo_arbitro}}. Las Partes dejan constancia de que este contrato se rige por la Ley N° 18.101, cuya competencia especial y derechos irrenunciables consideraron al pactar esta cláusula.{{else}}Para todos los efectos legales, las Partes fijan domicilio en la comuna de {{inmueble_comuna}} y se someten a la competencia de sus tribunales ordinarios de justicia, conforme al artículo 17 de la Ley N° 18.101.{{/if}}",
    },
    {
      id: "firmas",
      heading: "{{ORD}}: EJEMPLARES Y FIRMAS",
      text: "El presente contrato se firma en {{firma_ejemplares}} ejemplares de igual tenor y fecha, quedando uno en poder de cada Parte.{{#eq firma_modalidad \"notarial\"}} Las firmas de los comparecientes se autorizan ante notario público, conforme al artículo 20 de la Ley N° 18.101.{{/eq}}{{#eq firma_modalidad \"fea\"}} Las Partes lo suscriben mediante firma electrónica avanzada, conforme a la Ley N° 19.799.{{/eq}}",
    },
    {
      id: "anexos",
      heading: "{{ORD}}: ANEXOS",
      text: "Forman parte integrante de este contrato: Anexo A — Certificado de informaciones previas y recepción final; Anexo B — Acta de entrega, inventario y lectura de medidores.{{#if habilitacion_aplica}} Anexo C — Proyecto de habilitación aprobado.{{/if}}{{#if en_centro_comercial}} Anexo D — Reglamento de operación del centro comercial.{{/if}}{{#eq caucion_tipo \"boleta_bancaria\"}} Anexo E — Copia de la boleta de garantía bancaria.{{/eq}}",
    },
  ],

  // ── GARANTÍAS POR DISEÑO ─────────────────────────────────────────────────
  designGuarantees: [
    "R1 · Los derechos del arrendatario de la Ley N° 18.101 son irrenunciables también en el arriendo comercial urbano (art. 19).",
    "R2 · No se genera ninguna facultad de autotutela: la restitución es siempre judicial, sin lanzamiento, cambio de chapas ni retiro de mercadería.",
    "R3 · El interés por mora se limita al máximo convencional (Ley N° 18.010).",
    "C1 · Si el inmueble se entrega con instalaciones o amoblado, la renta se declara afecta a IVA; no se puede pactar 'renta exenta' en ese caso (art. 8 g LIVS).",
    "C3 · La exclusividad de giro solo se genera en locales comerciales y siempre con ámbito geográfico y radio determinados (libertad económica, art. 19 N° 21 CPR).",
    "C4 · El arbitraje se ofrece con advertencia: en un contrato regido por la Ley N° 18.101 su eficacia puede objetarse por la competencia especial del art. 17.",
    "C5 · El contrato define siempre quién asume el riesgo de la patente, el uso de suelo y la recepción final.",
  ],

  // ── REGLAS DE RIESGO (para el módulo revisor) ────────────────────────────
  riskRules: [
    {
      id: "iva-mal-declarado",
      name: "Renta con instalaciones declarada exenta de IVA",
      severity: "CRITICO",
      explanation:
        "El local se entrega con instalaciones o amoblado, pero el contrato dice que la renta es exenta de IVA. Eso es un error tributario: la renta debería ir afecta a IVA y emitirse con factura. Puede significar diferencias de impuestos y multas para ambas partes.",
      usualInChile:
        "El arriendo de un inmueble con instalaciones que permiten operar (o amoblado) está afecto a IVA (art. 8 letra g LIVS), con una rebaja de la base equivalente al 11% anual del avalúo fiscal.",
      normativeReference: "Ley sobre Impuesto a las Ventas y Servicios, arts. 8 g) y 17",
      detectionGuidance:
        "Si el contrato describe entrega con instalaciones, mobiliario o habilitación y a la vez declara la renta exenta de IVA o pactada sin factura, repórtalo como crítico citando ambas cláusulas.",
    },
    {
      id: "sin-factibilidad",
      name: "Sin declaración de factibilidad ni permisos del local",
      severity: "ADVERTENCIA",
      explanation:
        "El contrato no dice quién responde si el local no puede obtener la patente, el uso de suelo o la recepción final. Podrías terminar pagando renta por un local donde no puedes operar.",
      usualInChile:
        "Se pacta quién asume el riesgo de la patente y el uso de suelo, y suele darse un plazo para obtener los permisos con opción de terminar sin costo si el problema es del inmueble.",
      detectionGuidance:
        "Busca cláusulas sobre patente municipal, uso de suelo, recepción final o certificado de informaciones previas. Si no existen, reporta la omisión.",
    },
    {
      id: "exclusividad-sin-limites",
      name: "Exclusividad de giro sin ámbito ni plazo",
      severity: "ADVERTENCIA",
      explanation:
        "Se pacta exclusividad o no competencia sin definir un radio ni un plazo. Una restricción así de amplia a la libertad económica es difícil de sostener y puede ser inejecutable.",
      usualInChile:
        "La exclusividad o el radio de no competencia se acota siempre a un ámbito geográfico determinado y a la vigencia del contrato.",
      normativeReference: "Constitución, art. 19 N° 21",
      detectionGuidance:
        "Detecta cláusulas de exclusividad de giro o radio de no competencia sin ámbito geográfico ni plazo definidos. Cítalas.",
    },
    {
      id: "cambio-control-libre",
      name: "Cambio de control sin aviso ni consecuencias",
      severity: "SUGERENCIA",
      explanation:
        "El contrato no regula qué pasa si la empresa arrendataria cambia de dueño. El arrendador podría quedar ligado a un controlador que no eligió, sin poder hacer nada.",
      usualInChile:
        "Se pacta que el cambio de controlador se avise al arrendador, quien puede exigir caución adicional o terminar si el nuevo controlador no es apto.",
      detectionGuidance:
        "Busca cláusulas de cesión, subarriendo o cambio de control. Si el cambio de controlador queda libre y sin aviso, reporta el hallazgo.",
    },
    {
      id: "caucion-insuficiente",
      name: "Caución en efectivo insuficiente para un arriendo comercial",
      severity: "SUGERENCIA",
      explanation:
        "La garantía es un depósito en efectivo de uno o dos meses. En comercial eso suele ser insuficiente frente a rentas altas y costos de recuperación; conviene una boleta bancaria o la fianza de la matriz.",
      usualInChile:
        "En arriendos comerciales se usa boleta de garantía bancaria por varias rentas, o la fianza solidaria de la sociedad matriz del arrendatario.",
      detectionGuidance:
        "Si la caución es un depósito en efectivo de 1-2 rentas y no hay boleta bancaria ni fianza de la matriz, y la renta es relevante, reporta la sugerencia.",
    },
  ],
};
