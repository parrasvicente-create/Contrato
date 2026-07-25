import type { ContractType } from "../types";

// ─────────────────────────────────────────────────────────────────────────
// TIPO DE CONTRATO: Prestación de servicios profesionales
//
// ⚠️ El texto de las cláusulas es CONTENIDO DE EJEMPLO razonable. Debe ser
// reemplazado por la redacción legal definitiva antes de producción.
//
// Marco general: contrato civil de prestación de servicios (Código Civil,
// arrendamiento de servicios inmateriales). RIESGO CLAVE: si en los hechos
// hay subordinación y dependencia, la relación puede ser recaracterizada como
// laboral por la Dirección del Trabajo o los tribunales.
// ─────────────────────────────────────────────────────────────────────────

export const prestacionServicios: ContractType = {
  id: "prestacion-servicios",
  name: "Prestación de servicios profesionales",
  description:
    "Contrato civil entre un prestador (persona que emite boleta de honorarios) y quien contrata sus servicios, sin relación de subordinación laboral.",
  generationPriceClp: 8990,
  reviewPriceClp: 7990,
  legalBasis: [
    "Código Civil, arts. 2006 y siguientes (arrendamiento de servicios inmateriales)",
    "Código del Trabajo, art. 7 (contraste con la relación laboral)",
  ],
  detectionKeywords: [
    "prestador",
    "prestación de servicios",
    "honorarios",
    "boleta de honorarios",
    "sin vínculo de subordinación",
    "autonomía técnica",
    "entregables",
    "propiedad intelectual",
    "confidencialidad",
  ],

  // ── CUESTIONARIO (pasos del wizard) ─────────────────────────────────────
  steps: [
    {
      id: "partes",
      title: "Partes",
      description: "Quién presta el servicio y quién lo contrata.",
      fields: [
        {
          name: "prestador_nombre",
          label: "Nombre completo del prestador",
          type: "text",
          required: true,
          placeholder: "Ej: Camila Rojas Vega",
          validation: { min: 3, max: 120 },
        },
        {
          name: "prestador_rut",
          label: "RUT del prestador",
          type: "rut",
          required: true,
          placeholder: "15.678.901-1",
        },
        {
          name: "prestador_domicilio",
          label: "Domicilio del prestador",
          type: "text",
          required: true,
          placeholder: "Ej: Calle Manuel Montt 234, Providencia, Santiago",
        },
        {
          name: "prestador_profesion",
          label: "Profesión o actividad del prestador",
          type: "text",
          required: true,
          placeholder: "Ej: Diseñadora gráfica",
        },
        {
          name: "cliente_nombre",
          label: "Nombre o razón social de quien contrata",
          type: "text",
          required: true,
          placeholder: "Ej: Comercializadora Andes SpA",
          validation: { min: 3, max: 160 },
        },
        {
          name: "cliente_rut",
          label: "RUT de quien contrata",
          type: "rut",
          required: true,
          placeholder: "76.123.456-0",
        },
        {
          name: "cliente_domicilio",
          label: "Domicilio de quien contrata",
          type: "text",
          required: true,
          placeholder: "Ej: Av. Apoquindo 5500, of 802, Las Condes, Santiago",
        },
      ],
    },
    {
      id: "objeto",
      title: "Servicios",
      description: "Descripción de los servicios y cómo se entregan.",
      fields: [
        {
          name: "servicios_descripcion",
          label: "Descripción de los servicios",
          type: "textarea",
          required: true,
          placeholder:
            "Ej: Diseño de identidad visual: logotipo, paleta de colores y manual de marca, en dos rondas de revisión.",
          validation: { min: 10, max: 2000 },
        },
        {
          name: "entregables",
          label: "Entregables concretos",
          type: "textarea",
          required: false,
          placeholder: "Ej: Archivos en formato .ai, .png y .pdf; manual de marca en PDF.",
        },
        {
          name: "lugar_prestacion",
          label: "Lugar donde se prestan los servicios",
          type: "select",
          required: true,
          defaultValue: "remoto",
          options: [
            { value: "remoto", label: "Remoto / donde el prestador decida" },
            { value: "dependencias_cliente", label: "En dependencias del cliente" },
            { value: "mixto", label: "Mixto" },
          ],
          help: "Trabajar siempre en las dependencias del cliente, con horario fijo, puede ser indicio de relación laboral.",
        },
      ],
    },
    {
      id: "honorarios",
      title: "Honorarios",
      description: "Cuánto y cómo se paga.",
      fields: [
        {
          name: "modalidad_pago",
          label: "Modalidad de pago",
          type: "select",
          required: true,
          defaultValue: "por_proyecto",
          options: [
            { value: "por_proyecto", label: "Suma total por el proyecto" },
            { value: "mensual", label: "Honorario mensual" },
            { value: "por_hora", label: "Por hora" },
          ],
        },
        {
          name: "honorario_monto",
          label: "Monto del honorario (CLP)",
          type: "money_clp",
          required: true,
          placeholder: "1200000",
          help: "Si es mensual o por hora, indica el valor de la unidad correspondiente.",
          validation: { min: 1 },
        },
        {
          name: "emite_boleta",
          label: "El prestador emitirá boleta de honorarios",
          type: "boolean",
          defaultValue: true,
        },
      ],
    },
    {
      id: "plazos",
      title: "Plazos",
      description: "Vigencia del contrato y término.",
      fields: [
        {
          name: "fecha_inicio",
          label: "Fecha de inicio",
          type: "date",
          required: true,
        },
        {
          name: "tiene_plazo_fijo",
          label: "¿El contrato tiene una fecha de término definida?",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "fecha_termino",
          label: "Fecha de término (si aplica)",
          type: "date",
          required: false,
        },
        {
          name: "preaviso_dias",
          label: "Días de aviso para terminar anticipadamente",
          type: "number",
          required: true,
          defaultValue: 30,
          help: "Lo usual es 30 días. Sin preaviso, cualquiera puede cortar de un día para otro.",
          validation: { min: 0, max: 180 },
        },
      ],
    },
    {
      id: "opcionales",
      title: "Cláusulas opcionales",
      description: "Activa las cláusulas adicionales que quieras incluir.",
      fields: [
        {
          name: "incluye_confidencialidad",
          label: "Incluir cláusula de confidencialidad",
          type: "boolean",
          defaultValue: true,
        },
        {
          name: "incluye_propiedad_intelectual",
          label: "Incluir cláusula de propiedad intelectual",
          type: "boolean",
          defaultValue: true,
          help: "Define de quién son los derechos sobre lo creado.",
        },
        {
          name: "exige_exclusividad",
          label: "Exigir exclusividad al prestador",
          type: "boolean",
          defaultValue: false,
          help: "⚠️ Cuidado: exclusividad + horario fijo son fuertes indicios de relación laboral.",
        },
      ],
    },
  ],

  // ── CLÁUSULAS (texto de ejemplo con placeholders y condiciones) ──────────
  clauses: [
    {
      id: "comparecencia",
      heading: "COMPARECENCIA",
      text: "En Santiago de Chile, a {{fecha_inicio}}, entre {{cliente_nombre}}, RUT N° {{cliente_rut}}, con domicilio en {{cliente_domicilio}}, en adelante el \"Cliente\"; y don(ña) {{prestador_nombre}}, {{prestador_profesion}}, cédula nacional de identidad N° {{prestador_rut}}, con domicilio en {{prestador_domicilio}}, en adelante el \"Prestador\"; se ha convenido el siguiente contrato de prestación de servicios profesionales.",
    },
    {
      id: "naturaleza",
      heading: "PRIMERO: Naturaleza del contrato",
      text: "Las partes dejan expresa constancia de que este es un contrato civil de prestación de servicios y que entre ellas NO existe vínculo de subordinación ni dependencia laboral. El Prestador ejecuta los servicios con plena autonomía técnica y profesional, organizando libremente su trabajo, sin sujeción a jornada ni a supervisión jerárquica del Cliente.",
    },
    {
      id: "objeto",
      heading: "SEGUNDO: De los servicios",
      text: "El Prestador se obliga a ejecutar para el Cliente los siguientes servicios: {{servicios_descripcion}}. Los servicios se prestarán en la modalidad de lugar: {{lugar_prestacion}}.",
    },
    {
      id: "entregables",
      heading: "SEGUNDO BIS: Entregables",
      condition: { field: "entregables", op: "truthy" },
      text: "El Prestador entregará al Cliente los siguientes productos del servicio: {{entregables}}.",
    },
    {
      id: "honorarios",
      heading: "TERCERO: De los honorarios",
      text: "Como contraprestación, el Cliente pagará al Prestador la suma de {{honorario_monto}}, según la modalidad \"{{modalidad_pago}}\". El pago se efectuará contra la respectiva boleta de honorarios o documento tributario que corresponda.",
    },
    {
      id: "boleta",
      heading: "CUARTO: Boleta de honorarios",
      condition: { field: "emite_boleta", op: "truthy" },
      text: "El Prestador emitirá la correspondiente boleta de honorarios electrónica por cada pago, haciéndose responsable del cumplimiento de sus obligaciones tributarias y previsionales como trabajador independiente.",
    },
    {
      id: "plazo",
      heading: "QUINTO: Vigencia",
      text: "El presente contrato regirá a contar del {{fecha_inicio}}.",
    },
    {
      id: "plazo-fijo",
      heading: "QUINTO BIS: Plazo de término",
      condition: { field: "tiene_plazo_fijo", op: "truthy" },
      text: "El contrato se extenderá hasta el {{fecha_termino}}, sin perjuicio de la facultad de las partes de terminarlo anticipadamente según la cláusula siguiente.",
    },
    {
      id: "terminacion",
      heading: "SEXTO: Terminación anticipada",
      text: "Cualquiera de las partes podrá poner término anticipado a este contrato, comunicándolo a la otra por escrito con a lo menos {{preaviso_dias}} días de anticipación. En tal caso, el Cliente pagará los servicios efectivamente prestados hasta la fecha de término.",
    },
    {
      id: "confidencialidad",
      heading: "SÉPTIMO: Confidencialidad",
      condition: { field: "incluye_confidencialidad", op: "truthy" },
      text: "El Prestador se obliga a mantener estricta reserva sobre toda información del Cliente a la que acceda con ocasión de los servicios, obligación que subsistirá aun después de terminado el contrato.",
    },
    {
      id: "propiedad-intelectual",
      heading: "OCTAVO: Propiedad intelectual",
      condition: { field: "incluye_propiedad_intelectual", op: "truthy" },
      text: "Los resultados y entregables originales creados por el Prestador en la ejecución de este contrato serán de propiedad del Cliente una vez pagados íntegramente los honorarios, quien podrá usarlos y explotarlos sin limitación, salvo los derechos morales que la ley reconoce al autor.",
    },
    {
      id: "exclusividad",
      heading: "NOVENO: Exclusividad",
      condition: { field: "exige_exclusividad", op: "truthy" },
      text: "Durante la vigencia de este contrato, el Prestador destinará su actividad profesional preferentemente al Cliente en el ámbito de los servicios contratados. (Nota: revísese esta cláusula con cuidado, pues la exclusividad puede constituir un indicio de subordinación laboral.)",
    },
    {
      id: "domicilio",
      heading: "DÉCIMO: Domicilio y competencia",
      text: "Para todos los efectos legales, las partes fijan domicilio en la comuna de Santiago y se someten a la jurisdicción de sus tribunales ordinarios de justicia.",
    },
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
        "Código del Trabajo, art. 7 y 8 (presunción de laboralidad); principio de primacía de la realidad.",
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
