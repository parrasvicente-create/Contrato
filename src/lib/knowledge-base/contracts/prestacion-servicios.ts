import type { ContractType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// TIPO DE CONTRATO: Prestación de servicios profesionales (Chile)
//
// Rediseño (spec Plantilla 02). Mismo enfoque que el arriendo:
//   • Redacción legal cuidada (variante NEUTRA), condicionales inline, {{ORD}}.
//   • Cuestionario claro con visibilidad condicional.
//   • Personalización selectiva en las 4 cláusulas negociables (obligaciones,
//     propiedad intelectual, responsabilidad, término), eje Cliente/Prestador.
//
// RIESGO CENTRAL: la recalificación laboral. El motor está diseñado para NO
// producir indicios de subordinación (jornada, horario, jefatura, exclusividad
// forzada) bajo ninguna configuración → garantías por diseño.
//
// Parámetros tributarios (retención, IVA) viven en `params` (vigencia 2026),
// nunca escritos en el texto de las cláusulas.
//
// Marco: Código Civil (arts. 2006 y ss., 2118), Código del Trabajo (arts. 7-8,
// contraste), Ley 17.336 (propiedad intelectual), Ley 21.719 (datos).
// ─────────────────────────────────────────────────────────────────────────

export const prestacionServicios: ContractType = {
  id: "prestacion-servicios",
  name: "Prestación de servicios profesionales",
  description:
    "Contrato civil de servicios independientes (a honorarios o facturados), diseñado para no generar indicios de relación laboral.",
  generationPriceClp: 8990,
  reviewPriceClp: 7990,
  legalBasis: [
    "Código Civil, arts. 2006 y siguientes y 2118",
    "Código del Trabajo, arts. 7 y 8 (contraste con la relación laboral)",
    "Ley N° 17.336 sobre Propiedad Intelectual",
    "Ley N° 21.719 sobre protección de datos personales",
  ],
  detectionKeywords: [
    "prestador",
    "prestación de servicios",
    "honorarios",
    "boleta de honorarios",
    "factura afecta",
    "sin vínculo de subordinación",
    "autonomía técnica",
    "entregables",
    "propiedad intelectual",
    "confidencialidad",
  ],

  // Parámetros vigentes (actualizar aquí cuando cambie la ley, no en el texto).
  params: {
    param_retencion_pct: "15,25", // retención 2ª categoría 2026
    param_iva_pct: "19",
  },

  // ── CUESTIONARIO (pasos del wizard) ─────────────────────────────────────
  steps: [
    // 1. El prestador (la bifurcación mayor) ─────────────────────────────────
    {
      id: "prestador",
      title: "El prestador",
      description:
        "Quién presta el servicio. Esta primera decisión define la tributación y el riesgo laboral.",
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
          name: "prestador_naturaleza",
          label: "¿Cómo presta el servicio?",
          type: "select",
          required: true,
          defaultValue: "persona_natural",
          help: "Persona natural: boleta de honorarios con retención. Sociedad de profesionales: boleta sin retención. Empresa: factura con IVA.",
          options: [
            { value: "persona_natural", label: "Persona natural (boleta de honorarios)" },
            { value: "sociedad_profesionales", label: "Sociedad de profesionales (boleta)" },
            { value: "empresa", label: "Empresa (factura afecta a IVA)" },
          ],
        },
        {
          name: "prestador_nombre",
          label: "Nombre completo",
          type: "text",
          required: true,
          placeholder: "Ej: Camila Rojas Vega",
          validation: { min: 3, max: 120 },
          visibleIf: { field: "prestador_naturaleza", op: "eq", value: "persona_natural" },
        },
        {
          name: "prestador_nacionalidad",
          label: "Nacionalidad",
          type: "text",
          defaultValue: "chilena",
          visibleIf: { field: "prestador_naturaleza", op: "eq", value: "persona_natural" },
        },
        {
          name: "prestador_profesion",
          label: "Profesión o actividad",
          type: "text",
          required: true,
          placeholder: "Ej: Diseñadora gráfica",
          visibleIf: { field: "prestador_naturaleza", op: "eq", value: "persona_natural" },
        },
        {
          name: "prestador_razon_social",
          label: "Razón social",
          type: "text",
          required: true,
          placeholder: "Ej: Estudio Rojas SpA",
          visibleIf: { field: "prestador_naturaleza", op: "neq", value: "persona_natural" },
        },
        {
          name: "prestador_giro",
          label: "Giro",
          type: "text",
          required: false,
          visibleIf: { field: "prestador_naturaleza", op: "neq", value: "persona_natural" },
        },
        {
          name: "prestador_rep_nombre",
          label: "Nombre del representante legal",
          type: "text",
          required: true,
          visibleIf: { field: "prestador_naturaleza", op: "neq", value: "persona_natural" },
        },
        {
          name: "prestador_rep_rut",
          label: "RUT del representante",
          type: "rut",
          required: true,
          visibleIf: { field: "prestador_naturaleza", op: "neq", value: "persona_natural" },
        },
        {
          name: "prestador_rut",
          label: "RUT (del prestador o la empresa)",
          type: "rut",
          required: true,
          placeholder: "15.678.901-1",
        },
        {
          name: "prestador_domicilio",
          label: "Domicilio",
          type: "text",
          required: true,
        },
        {
          name: "prestador_comuna",
          label: "Comuna",
          type: "text",
          required: true,
        },
        {
          name: "prestador_email",
          label: "Correo electrónico",
          type: "text",
          required: true,
        },
        {
          name: "prestador_no_exclusivo",
          label: "Conserva libertad para prestar servicios a otros clientes",
          type: "boolean",
          defaultValue: true,
          help: "Recomendado. La exclusividad forzada es un fuerte indicio de relación laboral.",
        },
      ],
    },

    // 2. El cliente ───────────────────────────────────────────────────────────
    {
      id: "cliente",
      title: "El cliente",
      description: "Quién contrata y paga los servicios.",
      fields: [
        {
          name: "cliente_naturaleza",
          label: "¿El cliente es empresa o persona?",
          type: "select",
          required: true,
          defaultValue: "juridica",
          options: [
            { value: "juridica", label: "Empresa (persona jurídica)" },
            { value: "natural", label: "Persona natural" },
          ],
        },
        {
          name: "cliente_razon_social",
          label: "Razón social",
          type: "text",
          required: true,
          placeholder: "Ej: Comercializadora Andes SpA",
          visibleIf: { field: "cliente_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "cliente_giro",
          label: "Giro",
          type: "text",
          required: false,
          visibleIf: { field: "cliente_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "cliente_rep_nombre",
          label: "Nombre del representante legal",
          type: "text",
          required: true,
          visibleIf: { field: "cliente_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "cliente_rep_rut",
          label: "RUT del representante",
          type: "rut",
          required: true,
          visibleIf: { field: "cliente_naturaleza", op: "eq", value: "juridica" },
        },
        {
          name: "cliente_nombre",
          label: "Nombre completo",
          type: "text",
          required: true,
          visibleIf: { field: "cliente_naturaleza", op: "eq", value: "natural" },
        },
        {
          name: "cliente_rut",
          label: "RUT (del cliente o la empresa)",
          type: "rut",
          required: true,
          placeholder: "76.123.456-0",
        },
        {
          name: "cliente_domicilio",
          label: "Domicilio",
          type: "text",
          required: true,
        },
        {
          name: "cliente_comuna",
          label: "Comuna",
          type: "text",
          required: true,
        },
        {
          name: "cliente_email",
          label: "Correo electrónico",
          type: "text",
          required: true,
        },
        {
          name: "cliente_contraparte_nombre",
          label: "Contraparte técnica (quién aprueba los entregables)",
          type: "text",
          required: false,
          help: "Opcional. La persona del cliente que revisa y aprueba el trabajo.",
        },
        {
          name: "cliente_contraparte_cargo",
          label: "Cargo de la contraparte técnica",
          type: "text",
          required: false,
        },
      ],
    },

    // 3. El servicio ──────────────────────────────────────────────────────────
    {
      id: "servicio",
      title: "El servicio",
      description: "Qué necesita el cliente y qué va a entregar el prestador.",
      fields: [
        {
          name: "proyecto_titulo",
          label: "Título del servicio",
          type: "text",
          required: true,
          placeholder: "Ej: Diseño de identidad de marca",
        },
        {
          name: "proyecto_necesidad",
          label: "¿Qué necesita el cliente?",
          type: "textarea",
          required: true,
          placeholder: "Ej: renovar su imagen corporativa para el relanzamiento de la marca.",
          validation: { min: 10, max: 1000 },
        },
        {
          name: "proyecto_descripcion",
          label: "¿En qué consisten los servicios?",
          type: "textarea",
          required: true,
          placeholder:
            "Ej: diseño de logotipo, paleta de colores y manual de marca, en dos rondas de revisión.",
          validation: { min: 10, max: 2000 },
        },
        {
          name: "proyecto_entregables",
          label: "Entregables concretos",
          type: "textarea",
          required: false,
          help: "Los productos que recibirá el cliente. Sin esto, el alcance queda indeterminado.",
          placeholder: "Ej: archivos .ai, .png y .pdf; manual de marca en PDF.",
        },
      ],
    },

    // 4. Plazo ────────────────────────────────────────────────────────────────
    {
      id: "plazo",
      title: "Plazo",
      description: "Cuánto dura el encargo.",
      fields: [
        {
          name: "plazo_modalidad",
          label: "Modalidad del plazo",
          type: "select",
          required: true,
          defaultValue: "definido",
          options: [
            { value: "definido", label: "Hasta una fecha determinada" },
            { value: "por_entregable", label: "Hasta terminar los entregables" },
            { value: "indefinido", label: "Indefinido" },
          ],
        },
        {
          name: "plazo_inicio",
          label: "Fecha de inicio",
          type: "date",
          required: true,
        },
        {
          name: "plazo_termino",
          label: "Fecha de término",
          type: "date",
          required: true,
          visibleIf: { field: "plazo_modalidad", op: "eq", value: "definido" },
        },
        {
          name: "plazo_renovable",
          label: "Renovación automática al vencer",
          type: "boolean",
          defaultValue: false,
          visibleIf: { field: "plazo_modalidad", op: "eq", value: "definido" },
        },
        {
          name: "plazo_periodo_renovacion",
          label: "Cada renovación dura (meses)",
          type: "number",
          defaultValue: 12,
          validation: { min: 1, max: 120 },
          visibleIf: { field: "plazo_renovable", op: "truthy" },
        },
        {
          name: "plazo_aviso_no_renovacion",
          label: "Aviso para no renovar (días)",
          type: "number",
          defaultValue: 30,
          validation: { min: 1, max: 365 },
          visibleIf: { field: "plazo_renovable", op: "truthy" },
        },
      ],
    },

    // 5. Honorarios ───────────────────────────────────────────────────────────
    {
      id: "honorarios",
      title: "Honorarios",
      description: "Cuánto y cómo se paga. La retención y el IVA se calculan solos.",
      fields: [
        {
          name: "honorarios_modalidad",
          label: "Forma de cobro",
          type: "select",
          required: true,
          defaultValue: "por_hito",
          options: [
            { value: "por_hito", label: "Suma total por hitos/entregables" },
            { value: "mensual", label: "Mensual, contra informe" },
            { value: "por_hora", label: "Por hora" },
          ],
        },
        {
          name: "honorarios_moneda",
          label: "Moneda",
          type: "select",
          required: true,
          defaultValue: "CLP",
          options: [
            { value: "CLP", label: "Pesos (CLP)" },
            { value: "UF", label: "Unidades de Fomento (UF)" },
          ],
        },
        {
          name: "honorarios_monto_clp",
          label: "Monto (CLP)",
          type: "money_clp",
          required: true,
          help: "El total del proyecto, el valor mensual o el valor por hora, según la forma de cobro.",
          placeholder: "1200000",
          validation: { min: 1 },
          visibleIf: { field: "honorarios_moneda", op: "eq", value: "CLP" },
        },
        {
          name: "honorarios_monto_uf",
          label: "Monto (UF)",
          type: "money_uf",
          required: true,
          help: "El total, el valor mensual o el valor por hora, según la forma de cobro.",
          validation: { min: 0.1 },
          visibleIf: { field: "honorarios_moneda", op: "eq", value: "UF" },
        },
        {
          name: "honorarios_tope_horas",
          label: "Tope de horas al mes",
          type: "number",
          required: false,
          validation: { min: 1, max: 400 },
          visibleIf: { field: "honorarios_modalidad", op: "eq", value: "por_hora" },
        },
        {
          name: "honorarios_hitos",
          label: "Distribución de los hitos y pagos",
          type: "textarea",
          required: false,
          help: "Describe cada hito y su porcentaje de pago (irá al Anexo A/B).",
          placeholder: "Ej: 40% al aprobar la propuesta; 60% contra la entrega final.",
          visibleIf: { field: "honorarios_modalidad", op: "eq", value: "por_hito" },
        },
        {
          name: "honorarios_plazo_pago_dias",
          label: "Plazo de pago (días desde el documento tributario)",
          type: "number",
          defaultValue: 30,
          validation: { min: 1, max: 120 },
        },
        {
          name: "honorarios_reajuste",
          label: "Reajustar los honorarios en el tiempo",
          type: "boolean",
          defaultValue: false,
          help: "Útil en contratos largos: mantiene el valor real (IPC).",
        },
        {
          name: "honorarios_reajuste_frecuencia",
          label: "Frecuencia del reajuste",
          type: "select",
          defaultValue: "anual",
          options: [
            { value: "anual", label: "Anual" },
            { value: "semestral", label: "Semestral" },
          ],
          visibleIf: { field: "honorarios_reajuste", op: "truthy" },
        },
      ],
    },

    // 6. Propiedad intelectual ────────────────────────────────────────────────
    {
      id: "propiedad-intelectual",
      title: "Propiedad intelectual",
      description: "De quién son los derechos sobre lo que se crea.",
      fields: [
        {
          name: "pi_genera_obra",
          label: "¿El servicio genera contenido, código, diseño u obra?",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "pi_variante",
          label: "Derechos sobre los resultados",
          type: "select",
          defaultValue: "cesion_encargo",
          help: "Si se ceden derechos (no licencia), se agrega un anexo de cesión para notario.",
          options: [
            { value: "cesion_encargo", label: "Cesión al encargo (equilibrada)" },
            { value: "cesion_total", label: "Cesión total al cliente" },
            { value: "licencia", label: "Licencia (el prestador conserva la titularidad)" },
          ],
          visibleIf: { field: "pi_genera_obra", op: "truthy" },
        },
        {
          name: "pi_ambito_licencia",
          label: "Ámbito de la licencia",
          type: "text",
          required: true,
          placeholder: "Ej: uso interno y difusión en canales propios del cliente",
          visibleIf: { field: "pi_variante", op: "eq", value: "licencia" },
        },
      ],
    },

    // 7. Confidencialidad, datos y equipo ─────────────────────────────────────
    {
      id: "reserva",
      title: "Confidencialidad y equipo",
      description: "Reserva, datos personales y quién ejecuta el trabajo.",
      fields: [
        {
          name: "confidencialidad_plazo_anios",
          label: "La confidencialidad dura (años tras el término)",
          type: "number",
          defaultValue: 3,
          validation: { min: 1, max: 20 },
        },
        {
          name: "datos_hay_tratamiento",
          label: "El prestador accede a datos personales o sistemas del cliente",
          type: "boolean",
          defaultValue: false,
          help: "Si es sí, se agrega la cláusula de encargo de tratamiento (Ley 21.719).",
        },
        {
          name: "subcontratacion_prohibida",
          label: "El prestador debe ejecutar personalmente (sin subcontratar)",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "no_solicitacion_aplica",
          label: "Incluir cláusula de no solicitación de personal",
          type: "boolean",
          defaultValue: true,
          help: "Las Partes no se contratan mutuamente el personal. (No es una cláusula de no competencia.)",
        },
        {
          name: "no_solicitacion_meses",
          label: "Duración de la no solicitación (meses)",
          type: "number",
          defaultValue: 12,
          validation: { min: 1, max: 36 },
          visibleIf: { field: "no_solicitacion_aplica", op: "truthy" },
        },
      ],
    },

    // 8. Tono de las cláusulas clave (personalización selectiva) ──────────────
    {
      id: "equilibrio",
      title: "Tono del contrato",
      description:
        "Estas tres cláusulas son las que más se negocian. Por defecto van equilibradas.",
      fields: [
        {
          name: "obligaciones_variante",
          label: "Obligaciones del prestador",
          type: "select",
          defaultValue: "neutra",
          help: "Obligación de medios (lex artis) vs. de resultado.",
          options: [
            { value: "neutra", label: "Equilibrada (recomendada)" },
            { value: "pro_cliente", label: "Más favorable al cliente" },
            { value: "pro_prestador", label: "Más favorable al prestador" },
          ],
        },
        {
          name: "obligaciones_plazo_observacion",
          label: "Plazo para observar entregables (días)",
          type: "number",
          defaultValue: 10,
          validation: { min: 1, max: 60 },
        },
        {
          name: "obligaciones_plazo_subsanacion",
          label: "Plazo para subsanar observaciones (días)",
          type: "number",
          defaultValue: 10,
          validation: { min: 1, max: 60 },
        },
        {
          name: "responsabilidad_variante",
          label: "Responsabilidad",
          type: "select",
          defaultValue: "neutra",
          help: "El dolo y la culpa grave nunca quedan cubiertos, elijas lo que elijas.",
          options: [
            { value: "neutra", label: "Equilibrada (tope = honorarios)" },
            { value: "pro_cliente", label: "Más favorable al cliente (sin tope)" },
            { value: "pro_prestador", label: "Más favorable al prestador (tope acotado)" },
          ],
        },
        {
          name: "responsabilidad_meses_tope",
          label: "Tope: honorarios de los últimos (meses)",
          type: "number",
          defaultValue: 6,
          validation: { min: 1, max: 24 },
          visibleIf: { field: "responsabilidad_variante", op: "eq", value: "pro_prestador" },
        },
        {
          name: "termino_variante",
          label: "Término del contrato",
          type: "select",
          defaultValue: "neutra",
          options: [
            { value: "neutra", label: "Equilibrada (cualquiera con aviso)" },
            { value: "pro_cliente", label: "Más favorable al cliente" },
            { value: "pro_prestador", label: "Más favorable al prestador" },
          ],
        },
        {
          name: "termino_aviso",
          label: "Aviso para terminar (días)",
          type: "number",
          defaultValue: 30,
          validation: { min: 1, max: 180 },
        },
        {
          name: "termino_plazo_subsanacion",
          label: "Plazo para subsanar incumplimiento (días)",
          type: "number",
          defaultValue: 15,
          validation: { min: 1, max: 60 },
        },
        {
          name: "termino_aviso_cliente",
          label: "Aviso del cliente para terminar sin causa (días)",
          type: "number",
          defaultValue: 15,
          validation: { min: 1, max: 180 },
          visibleIf: { field: "termino_variante", op: "eq", value: "pro_cliente" },
        },
        {
          name: "termino_pct_indemnizacion",
          label: "Indemnización si el cliente termina sin causa (% de honorarios pendientes)",
          type: "number",
          defaultValue: 50,
          validation: { min: 0, max: 100 },
          visibleIf: { field: "termino_variante", op: "eq", value: "pro_prestador" },
        },
      ],
    },

    // 9. Jurisdicción y firma ─────────────────────────────────────────────────
    {
      id: "cierre",
      title: "Jurisdicción y firma",
      description: "Cómo se resuelven las disputas y cómo se firma.",
      fields: [
        {
          name: "jurisdiccion_es_arbitraje",
          label: "Resolver disputas por arbitraje (en vez de tribunales)",
          type: "boolean",
          defaultValue: false,
          help: "Habitual en contratos de cierto monto. Usa el Centro de Arbitraje y Mediación de Santiago.",
        },
        {
          name: "jurisdiccion_comuna",
          label: "Comuna de los tribunales competentes",
          type: "text",
          required: true,
          placeholder: "Ej: Santiago",
          visibleIf: { field: "jurisdiccion_es_arbitraje", op: "falsy" },
        },
        {
          name: "jurisdiccion_tipo_arbitro",
          label: "Tipo de árbitro",
          type: "select",
          defaultValue: "mixto",
          options: [
            { value: "arbitrador", label: "Arbitrador (amigable componedor)" },
            { value: "mixto", label: "Mixto (árbitro de derecho en el fallo)" },
            { value: "de derecho", label: "De derecho" },
          ],
          visibleIf: { field: "jurisdiccion_es_arbitraje", op: "truthy" },
        },
        {
          name: "firma_modalidad",
          label: "Modalidad de firma",
          type: "select",
          required: true,
          defaultValue: "simple",
          options: [
            { value: "simple", label: "Firma simple" },
            { value: "fea", label: "Firma electrónica avanzada" },
            { value: "notarial", label: "Firmas ante notario" },
          ],
        },
        {
          name: "firma_ejemplares",
          label: "Número de ejemplares",
          type: "number",
          defaultValue: 2,
          validation: { min: 2, max: 6 },
        },
      ],
    },
  ],

  // ── CLÁUSULAS ────────────────────────────────────────────────────────────
  clauses: [
    {
      id: "comparecencia",
      heading: "CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES",
      text: "En {{contrato_ciudad}}, a {{contrato_fecha}}, entre {{#eq cliente_naturaleza \"natural\"}}don(ña) {{cliente_nombre}}, cédula nacional de identidad N° {{cliente_rut}}{{else}}{{cliente_razon_social}}, rol único tributario N° {{cliente_rut}}, representada por don(ña) {{cliente_rep_nombre}}, cédula nacional de identidad N° {{cliente_rep_rut}}{{/eq}}, domiciliado en {{cliente_domicilio}}, comuna de {{cliente_comuna}}, en adelante el \"Cliente\"; y {{#eq prestador_naturaleza \"persona_natural\"}}don(ña) {{prestador_nombre}}, {{prestador_nacionalidad}}, {{prestador_profesion}}, cédula nacional de identidad N° {{prestador_rut}}{{else}}{{prestador_razon_social}}, rol único tributario N° {{prestador_rut}}, representada por don(ña) {{prestador_rep_nombre}}, cédula nacional de identidad N° {{prestador_rep_rut}}{{/eq}}, domiciliado en {{prestador_domicilio}}, comuna de {{prestador_comuna}}, en adelante el \"Prestador\"; quienes se denominarán conjuntamente \"las Partes\", han convenido lo siguiente:",
    },
    {
      id: "objeto",
      heading: "{{ORD}}: ANTECEDENTES Y OBJETO",
      text: "El Cliente requiere {{proyecto_necesidad}} El Prestador declara contar con la formación, experiencia y medios necesarios para prestar dichos servicios de manera profesional e independiente. Por el presente instrumento, el Prestador se obliga a ejecutar para el Cliente los servicios profesionales de {{proyecto_titulo}}, en los términos que se detallan en la cláusula siguiente y en el Anexo A.",
    },
    {
      id: "alcance",
      heading: "{{ORD}}: ALCANCE DE LOS SERVICIOS",
      text: "Los servicios comprenden: {{proyecto_descripcion}}{{#if proyecto_entregables}} El Prestador entregará los siguientes productos: {{proyecto_entregables}}{{/if}} Todo servicio no comprendido en el Anexo A requerirá acuerdo escrito previo de las Partes sobre su alcance, plazo y honorario, el que se incorporará como anexo a este contrato.",
    },
    {
      id: "naturaleza",
      heading: "{{ORD}}: NATURALEZA JURÍDICA DE LA RELACIÓN",
      text: "Las Partes declaran expresamente que el presente contrato constituye una prestación de servicios profesionales independientes, regida por los artículos 2006 y siguientes y 2118 del Código Civil, y que no existe entre ellas vínculo de subordinación ni dependencia alguno, por lo que no le son aplicables las normas del Código del Trabajo. En consecuencia, el Prestador: a) determina libremente la forma, el tiempo y el lugar de ejecución de los servicios, sin sujeción a jornada, horario ni control de asistencia; b) ejecuta los servicios con sus propios medios, herramientas y organización; c) asume por su cuenta el pago de sus cotizaciones previsionales y de salud, y de todo tributo que le corresponda; d) {{#if prestador_no_exclusivo}}conserva plena libertad para prestar servicios a terceros, sin más limitación que las obligaciones de confidencialidad y de no conflicto de interés establecidas en este contrato{{else}}presta los servicios en régimen de dedicación preferente, sin que ello importe exclusividad ni le impida ejercer su profesión respecto de terceros que no compitan con el Cliente{{/if}}; e) no integra la estructura organizacional del Cliente ni ejerce ni recibe funciones de jefatura. Las instrucciones que el Cliente imparta se limitarán al resultado esperado de los servicios y no a la forma de ejecutarlos.",
    },
    {
      id: "plazo",
      heading: "{{ORD}}: PLAZO",
      text: "{{#eq plazo_modalidad \"por_entregable\"}}El presente contrato regirá desde el {{plazo_inicio}} y hasta la entrega y aprobación del último de los productos señalados en el Anexo A.{{/eq}}{{#eq plazo_modalidad \"definido\"}}El presente contrato regirá desde el {{plazo_inicio}} y hasta el {{plazo_termino}}{{#if plazo_renovable}}, renovándose automáticamente por períodos iguales de {{plazo_periodo_renovacion}} meses salvo aviso en contrario de cualquiera de las Partes con {{plazo_aviso_no_renovacion}} días de anticipación{{/if}}.{{/eq}}{{#eq plazo_modalidad \"indefinido\"}}El presente contrato regirá desde el {{plazo_inicio}} y tendrá duración indefinida, pudiendo cualquiera de las Partes ponerle término conforme a la cláusula de término del contrato.{{/eq}}",
    },
    {
      id: "honorarios",
      heading: "{{ORD}}: HONORARIOS Y FORMA DE PAGO",
      text: "{{#eq honorarios_modalidad \"por_hito\"}}El Cliente pagará al Prestador la suma total de {{#eq honorarios_moneda \"UF\"}}{{honorarios_monto_uf:money_uf}} Unidades de Fomento{{else}}{{honorarios_monto_clp:money_clp}}{{/eq}}, pagadera contra la entrega y aprobación de cada producto conforme a la distribución del Anexo A{{#if honorarios_hitos}}: {{honorarios_hitos}}{{/if}}.{{/eq}}{{#eq honorarios_modalidad \"mensual\"}}El Cliente pagará al Prestador la suma de {{#eq honorarios_moneda \"UF\"}}{{honorarios_monto_uf:money_uf}} Unidades de Fomento{{else}}{{honorarios_monto_clp:money_clp}}{{/eq}} por cada mes de servicios efectivamente prestados, contra la entrega del informe mensual de actividades.{{/eq}}{{#eq honorarios_modalidad \"por_hora\"}}El Cliente pagará al Prestador la suma de {{#eq honorarios_moneda \"UF\"}}{{honorarios_monto_uf:money_uf}} Unidades de Fomento{{else}}{{honorarios_monto_clp:money_clp}}{{/eq}} por hora efectivamente trabajada, con un tope mensual de {{honorarios_tope_horas}} horas salvo autorización escrita previa.{{/eq}} El pago se efectuará dentro de los {{honorarios_plazo_pago_dias}} días siguientes a la recepción conforme del documento tributario respectivo, mediante transferencia electrónica.{{#if honorarios_reajuste}} Los honorarios se reajustarán en forma {{honorarios_reajuste_frecuencia}} conforme a la variación del Índice de Precios al Consumidor.{{/if}} El retardo en el pago devengará el interés máximo convencional desde el día siguiente al vencimiento, sin necesidad de requerimiento.",
    },
    {
      id: "tributario",
      heading: "{{ORD}}: DOCUMENTO TRIBUTARIO E IMPUESTOS",
      text: "{{#eq prestador_naturaleza \"empresa\"}}El Prestador emitirá factura afecta por cada pago. A los honorarios pactados se agregará el Impuesto al Valor Agregado ({{param_iva_pct}}%) que corresponda conforme a la ley.{{else}}El Prestador emitirá boleta de honorarios electrónica por cada pago. Los servicios objeto de este contrato se encuentran exentos del Impuesto al Valor Agregado conforme al artículo 12 letra E N° 8 de la Ley sobre Impuesto a las Ventas y Servicios.{{#eq prestador_naturaleza \"persona_natural\"}} El Cliente practicará la retención del {{param_retencion_pct}}% establecida en el artículo 74 N° 2 de la Ley sobre Impuesto a la Renta, enterándola en arcas fiscales por cuenta del Prestador.{{/eq}}{{/eq}} Cada Parte será responsable exclusiva de los tributos, cotizaciones y obligaciones previsionales que le correspondan, sin que el Cliente asuma obligación alguna en tal sentido respecto del Prestador o de su personal.",
    },
    {
      id: "obligaciones-prestador",
      heading: "{{ORD}}: OBLIGACIONES DEL PRESTADOR",
      text: "{{#eq obligaciones_variante \"pro_cliente\"}}El Prestador se obliga a ejecutar los servicios con estricta sujeción al Anexo A y a los plazos allí establecidos, a informar periódicamente sobre el estado de avance, a subsanar a su costo cualquier observación fundada del Cliente dentro de los {{obligaciones_plazo_subsanacion}} días siguientes, y a garantizar que los entregables se encuentren libres de defectos y aptos para la finalidad convenida.{{else}}{{#eq obligaciones_variante \"pro_prestador\"}}El Prestador se obliga a ejecutar los servicios conforme a la lex artis de su profesión, tratándose de una obligación de medios y no de resultado. Las observaciones del Cliente deberán formularse por escrito y de manera fundada dentro de los {{obligaciones_plazo_observacion}} días siguientes a cada entrega; transcurrido dicho plazo sin observaciones, el entregable se tendrá por aprobado. Los cambios de alcance solicitados con posterioridad a la aprobación darán lugar a un honorario adicional.{{else}}El Prestador se obliga a ejecutar los servicios conforme a la lex artis de su profesión y a los estándares razonablemente exigibles a un profesional competente en la materia, dentro de los plazos del Anexo A, e informar oportunamente al Cliente de cualquier circunstancia que pueda afectar su cumplimiento. Las observaciones fundadas del Cliente deberán formularse por escrito dentro de los {{obligaciones_plazo_observacion}} días siguientes a cada entrega y serán subsanadas por el Prestador dentro de los {{obligaciones_plazo_subsanacion}} días siguientes.{{/eq}}{{/eq}}",
    },
    {
      id: "obligaciones-cliente",
      heading: "{{ORD}}: OBLIGACIONES DEL CLIENTE",
      text: "El Cliente se obliga a pagar oportunamente los honorarios pactados, a entregar al Prestador la información, accesos y documentación necesarios para la ejecución de los servicios, a designar una contraparte con facultades para aprobar entregables{{#if cliente_contraparte_nombre}} (para estos efectos, {{cliente_contraparte_nombre}}{{#if cliente_contraparte_cargo}}, {{cliente_contraparte_cargo}}{{/if}}){{/if}}, y a resolver dentro de plazo razonable las consultas que el Prestador formule. Los retrasos imputables al Cliente en la entrega de información prorrogarán de pleno derecho los plazos del Anexo A en igual número de días.",
    },
    {
      id: "subcontratacion",
      heading: "{{ORD}}: PERSONAL Y SUBCONTRATACIÓN",
      text: "{{#if subcontratacion_prohibida}}El Prestador ejecutará personalmente los servicios y no podrá subcontratarlos ni delegarlos, total ni parcialmente, sin autorización previa y escrita del Cliente.{{else}}El Prestador podrá ejecutar los servicios con personal propio o subcontratado, respondiendo íntegramente de su actuación como si fuera propia. El Prestador declara ser el único empleador de dicho personal y se obliga a mantener indemne al Cliente de toda reclamación laboral o previsional que aquel formule.{{/if}}",
    },
    {
      id: "confidencialidad",
      heading: "{{ORD}}: CONFIDENCIALIDAD",
      text: "El Prestador se obliga a mantener estricta reserva sobre toda información del Cliente a la que acceda con ocasión de este contrato, cualquiera sea su soporte, y a no utilizarla para fines distintos de su ejecución. Esta obligación subsistirá por {{confidencialidad_plazo_anios}} años contados desde el término del contrato, y de manera indefinida respecto de la información que constituya secreto empresarial. No se considerará confidencial la información que sea o llegue a ser de dominio público sin infracción de este contrato, la que el Prestador poseía legítimamente con anterioridad, la desarrollada de manera independiente, ni la que deba revelarse por orden de autoridad competente.",
    },
    {
      id: "propiedad-intelectual",
      heading: "{{ORD}}: PROPIEDAD INTELECTUAL",
      condition: { field: "pi_genera_obra", op: "truthy" },
      text: "{{#eq pi_variante \"cesion_total\"}}Todos los derechos patrimoniales sobre las obras, informes, diseños, códigos, bases de datos y demás resultados que el Prestador genere en ejecución de este contrato se entienden cedidos al Cliente, en forma total, exclusiva, indefinida y para todo territorio, comprendiendo los derechos de reproducción, distribución, comunicación pública, transformación y adaptación. El honorario pactado comprende y retribuye íntegramente esta cesión. El Prestador conserva los derechos morales que la ley le reconoce como irrenunciables.{{else}}{{#eq pi_variante \"licencia\"}}El Prestador conserva la titularidad de los derechos patrimoniales sobre los resultados de su trabajo y otorga al Cliente una licencia de uso no exclusiva, indefinida y limitada a {{pi_ambito_licencia}}. Cualquier uso distinto, así como la cesión a terceros, requerirá acuerdo escrito previo y el pago del honorario adicional que las Partes convengan. El Prestador podrá incluir los entregables en su portafolio profesional, resguardando la información confidencial.{{else}}Los derechos patrimoniales sobre los resultados generados específicamente para el Cliente en ejecución de este contrato se entienden cedidos a este, en forma exclusiva e indefinida, para los fines propios de su giro. El Prestador conserva la titularidad de sus conocimientos, metodologías, herramientas y componentes preexistentes o de uso general que incorpore a los entregables, respecto de los cuales otorga al Cliente una licencia no exclusiva, indefinida, gratuita e intransferible para usarlos en cuanto formen parte de los entregables. El Prestador conserva sus derechos morales.{{/eq}}{{/eq}}",
    },
    {
      id: "datos",
      heading: "{{ORD}}: PROTECCIÓN DE DATOS PERSONALES",
      condition: { field: "datos_hay_tratamiento", op: "truthy" },
      text: "En la medida que la ejecución de los servicios importe el tratamiento de datos personales de titularidad del Cliente, el Prestador actuará en calidad de encargado del tratamiento, obligándose a tratarlos únicamente conforme a las instrucciones documentadas del Cliente y para los fines de este contrato, a adoptar las medidas de seguridad técnicas y organizativas apropiadas, a guardar reserva, a no subcontratar el tratamiento sin autorización escrita, a asistir al Cliente en la atención de los derechos de los titulares y en la notificación de vulneraciones de seguridad, y a devolver o suprimir los datos al término del contrato. Todo ello conforme a la Ley N° 19.628 y a la Ley N° 21.719 sobre protección de datos personales.",
    },
    {
      id: "responsabilidad",
      heading: "{{ORD}}: RESPONSABILIDAD",
      text: "{{#eq responsabilidad_variante \"pro_cliente\"}}El Prestador responderá de todo perjuicio directo que ocasione al Cliente por incumplimiento de sus obligaciones, sin límite de monto, y se obliga a mantenerlo indemne frente a reclamaciones de terceros que tengan por causa su actuación. Esta responsabilidad no comprende el dolo ni la culpa grave del Cliente.{{else}}{{#eq responsabilidad_variante \"pro_prestador\"}}La responsabilidad del Prestador tendrá como límite el monto de los honorarios percibidos durante los {{responsabilidad_meses_tope}} meses anteriores al hecho que la origine, y se excluye toda responsabilidad por lucro cesante, pérdida de negocios o perjuicios indirectos. El Prestador no responderá por las decisiones que el Cliente adopte a partir de sus informes o recomendaciones, ni por la inexactitud de la información que el Cliente le proporcione. Este límite no se aplicará en caso de dolo ni culpa grave.{{else}}La responsabilidad del Prestador por los perjuicios directos derivados del incumplimiento de este contrato tendrá como límite el monto total de los honorarios efectivamente percibidos en virtud del mismo. Ninguna de las Partes responderá por lucro cesante ni perjuicios indirectos. Este límite no se aplicará en caso de dolo, culpa grave, infracción a las obligaciones de confidencialidad ni vulneración de derechos de propiedad intelectual de terceros.{{/eq}}{{/eq}}",
    },
    {
      id: "no-solicitacion",
      heading: "{{ORD}}: NO SOLICITACIÓN DE PERSONAL",
      condition: { field: "no_solicitacion_aplica", op: "truthy" },
      text: "Durante la vigencia del contrato y por {{no_solicitacion_meses}} meses contados desde su término, ninguna de las Partes podrá contratar ni solicitar activamente los servicios del personal de la otra que haya participado directamente en la ejecución de este contrato, sin su consentimiento escrito. Se exceptúan las postulaciones espontáneas a convocatorias públicas.",
    },
    {
      id: "termino",
      heading: "{{ORD}}: TÉRMINO DEL CONTRATO",
      text: "{{#eq termino_variante \"pro_cliente\"}}El Cliente podrá poner término al presente contrato en cualquier momento, sin expresión de causa, mediante aviso escrito con {{termino_aviso_cliente}} días de anticipación, pagando únicamente los servicios efectivamente prestados hasta la fecha de término. El Prestador solo podrá terminarlo anticipadamente por incumplimiento grave del Cliente, previo requerimiento escrito y transcurrido el plazo de subsanación de {{termino_plazo_subsanacion}} días.{{else}}{{#eq termino_variante \"pro_prestador\"}}El presente contrato solo podrá terminarse anticipadamente por mutuo acuerdo o por incumplimiento grave de una de las Partes no subsanado dentro de los {{termino_plazo_subsanacion}} días siguientes al requerimiento escrito. Si el Cliente pusiere término sin causa, deberá pagar los servicios prestados y, además, un {{termino_pct_indemnizacion}}% de los honorarios pendientes conforme al Anexo A, a título de indemnización compensatoria.{{else}}Cualquiera de las Partes podrá poner término al contrato mediante aviso escrito con {{termino_aviso}} días de anticipación; en tal caso, el Cliente pagará los servicios efectivamente prestados y los gastos comprometidos hasta la fecha de término. Adicionalmente, cualquiera de las Partes podrá terminarlo de inmediato en caso de incumplimiento grave de la otra que no sea subsanado dentro de los {{termino_plazo_subsanacion}} días siguientes al requerimiento escrito, o en caso de insolvencia o inicio de un procedimiento concursal de liquidación.{{/eq}}{{/eq}}",
    },
    {
      id: "efectos-termino",
      heading: "{{ORD}}: EFECTOS DEL TÉRMINO",
      text: "Al término del contrato, cualquiera sea su causa, el Prestador entregará al Cliente los productos terminados y el estado de avance de los que se encuentren en ejecución, restituirá o eliminará la información confidencial y los accesos que le hubieren sido conferidos, y emitirá el documento tributario correspondiente al saldo pendiente. Subsistirán las obligaciones de confidencialidad, propiedad intelectual, protección de datos, responsabilidad y no solicitación.",
    },
    {
      id: "cesion",
      heading: "{{ORD}}: CESIÓN DEL CONTRATO",
      text: "Ninguna de las Partes podrá ceder este contrato ni los derechos y obligaciones que de él emanan sin el consentimiento previo y escrito de la otra.",
    },
    {
      id: "notificaciones",
      heading: "{{ORD}}: NOTIFICACIONES",
      text: "Toda comunicación entre las Partes se efectuará por escrito a los domicilios indicados en la comparecencia o a las siguientes direcciones de correo electrónico, que las Partes reconocen como medio idóneo y suficiente: Cliente, {{cliente_email}}; Prestador, {{prestador_email}}. Todo cambio deberá comunicarse por escrito a la otra Parte dentro de quinto día.",
    },
    {
      id: "jurisdiccion",
      heading: "{{ORD}}: DOMICILIO, COMPETENCIA Y ARBITRAJE",
      text: "{{#if jurisdiccion_es_arbitraje}}Toda dificultad o controversia que se produzca entre las Partes respecto de la aplicación, interpretación, duración, validez o ejecución de este contrato será sometida a arbitraje, conforme al Reglamento Procesal de Arbitraje del Centro de Arbitraje y Mediación de Santiago. Las Partes confieren mandato especial irrevocable a la Cámara de Comercio de Santiago A.G. para que designe al árbitro {{jurisdiccion_tipo_arbitro}}. En contra de sus resoluciones no procederá recurso alguno, renunciando las Partes expresamente a ellos.{{else}}Para todos los efectos legales, las Partes fijan domicilio en la comuna de {{jurisdiccion_comuna}} y se someten a la competencia de sus tribunales ordinarios de justicia.{{/if}}",
    },
    {
      id: "ejemplares",
      heading: "{{ORD}}: EJEMPLARES Y FIRMAS",
      text: "El presente contrato se firma en {{firma_ejemplares}} ejemplares de igual tenor y fecha, quedando uno en poder de cada Parte.{{#eq firma_modalidad \"fea\"}} Las Partes lo suscriben mediante firma electrónica avanzada, conforme a la Ley N° 19.799, produciendo los mismos efectos que la firma manuscrita.{{/eq}}{{#eq firma_modalidad \"notarial\"}} Las firmas de los comparecientes se autorizan ante notario público.{{/eq}}",
    },
    {
      id: "anexos",
      heading: "{{ORD}}: ANEXOS",
      text: "Forman parte integrante de este contrato los siguientes anexos: Anexo A — Alcance de los servicios, entregables y cronograma.{{#eq honorarios_modalidad \"por_hito\"}} Anexo B — Calendario de hitos y pagos.{{/eq}}{{#if datos_hay_tratamiento}} Anexo C — Instrucciones de tratamiento de datos personales.{{/if}}{{#if pi_genera_obra}}{{#eq pi_variante \"licencia\"}}{{else}} Anexo D — Cesión de derechos de autor, para su autorización ante notario e inscripción conforme al artículo 73 de la Ley N° 17.336.{{/eq}}{{/if}}",
    },
  ],

  // ── GARANTÍAS POR DISEÑO (límites legales que el motor respeta siempre) ────
  designGuarantees: [
    "R1 · No se generan indicios de subordinación laboral: sin jornada, horario, control de asistencia, jefatura, feriados ni exclusividad forzada (arts. 7 y 8 del Código del Trabajo).",
    "R2 · El tope de responsabilidad nunca cubre el dolo ni la culpa grave: esa salvedad se inserta siempre (art. 1465 CC).",
    "R3 · Cuando se ceden derechos de autor, se agrega el anexo de cesión formal para autorizar ante notario e inscribir (art. 73 Ley N° 17.336).",
    "R4 · No se pacta no competencia post-contractual (restringe la libertad de trabajo, art. 19 N° 16 CPR); se ofrece solo no solicitación de personal.",
    "R5 · La retención y el IVA se calculan desde la naturaleza del prestador y la tabla vigente 2026; no se digitan a mano.",
  ],

  // ── REGLAS DE RIESGO (para el módulo revisor) ────────────────────────────
  riskRules: [
    {
      id: "indicios-subordinacion",
      name: "Indicios de subordinación laboral (horario fijo + exclusividad)",
      severity: "CRITICO",
      explanation:
        "El contrato dice ser 'a honorarios', pero te impone cumplir un horario fijo y trabajar en exclusiva para el cliente. Eso se parece mucho a un empleo. Si en la práctica hay jefe, horario y dependencia, la Dirección del Trabajo o un tribunal pueden declarar que en realidad eras trabajador dependiente, con derecho a contrato laboral, cotizaciones e indemnizaciones.",
      usualInChile:
        "En una prestación de servicios genuina, la persona organiza libremente su trabajo, no cumple una jornada impuesta ni está sujeta a supervisión jerárquica, y puede prestar servicios a otros.",
      normativeReference:
        "Código del Trabajo, arts. 7 y 8 (presunción de laboralidad); principio de primacía de la realidad.",
      detectionGuidance:
        "Busca cláusulas que fijen jornada u horario de trabajo, obligación de asistencia a dependencias del cliente, supervisión o subordinación, y exclusividad. Si concurren horario fijo Y exclusividad (o subordinación), repórtalo como crítico citando ambas cláusulas.",
    },
    {
      id: "termino-sin-preaviso",
      name: "Término sin aviso previo ni plazo mínimo",
      severity: "ADVERTENCIA",
      explanation:
        "El contrato permite que te dejen sin trabajo de un día para otro, sin aviso anticipado. Eso te deja sin margen para reorganizarte ni buscar otro ingreso.",
      usualInChile:
        "Lo habitual es pactar un aviso previo (por ejemplo 30 días) para terminar el contrato, o al menos un plazo mínimo de vigencia.",
      detectionGuidance:
        "Revisa la cláusula de terminación. Si permite terminar sin aviso previo (o con un aviso irrisorio) y no hay plazo mínimo, reporta el hallazgo citando la cláusula.",
    },
    {
      id: "pago-condicionado-abusivo",
      name: "Pago condicionado a la sola conformidad del cliente",
      severity: "ADVERTENCIA",
      explanation:
        "El pago depende de que el cliente quede 'conforme', sin criterios objetivos. Eso permite retener tu pago aunque hayas hecho el trabajo.",
      usualInChile:
        "Lo razonable es pactar criterios objetivos de aceptación de los entregables y plazos claros de pago, evitando la aprobación puramente discrecional.",
      detectionGuidance:
        "Detecta cláusulas donde el pago quede sujeto a la 'entera satisfacción' o 'conformidad' del cliente sin criterios ni plazos. Cítalas textualmente.",
    },
    {
      id: "propiedad-intelectual-total-sin-pago",
      name: "Cesión total de propiedad intelectual sin condicionarla al pago",
      severity: "SUGERENCIA",
      explanation:
        "Cedes todos los derechos sobre lo que creas, incluso si el cliente no te ha pagado. Conviene que la cesión opere solo una vez pagado el honorario.",
      usualInChile:
        "Se acostumbra condicionar la transferencia de derechos al pago íntegro de los honorarios, y respetar los derechos morales del autor.",
      normativeReference: "Ley N° 17.336 sobre Propiedad Intelectual",
      detectionGuidance:
        "Busca cláusulas de propiedad intelectual o cesión de derechos. Si transfieren todo sin condicionarlo al pago, o desconocen los derechos morales, reporta el hallazgo.",
    },
    {
      id: "responsabilidad-ilimitada",
      name: "Responsabilidad ilimitada o multas desproporcionadas",
      severity: "CRITICO",
      explanation:
        "El contrato te hace responder sin límite por cualquier daño, o fija multas enormes. Podrías terminar debiendo mucho más de lo que ganaste con el trabajo.",
      usualInChile:
        "Suele limitarse la responsabilidad del prestador a un tope razonable (por ejemplo, el monto de los honorarios), y las multas se acotan.",
      detectionGuidance:
        "Detecta cláusulas de responsabilidad, indemnización de perjuicios o multas sin tope o claramente desproporcionadas respecto del honorario. Cítalas textualmente.",
    },
  ],
};
