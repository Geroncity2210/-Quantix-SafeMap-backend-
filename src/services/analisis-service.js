const bigquery = require('../config/bigquery.js');
const model = require('../config/gemini.js');

const TABLA = `\`${process.env.BIGQUERY_PROJECT_ID}.${process.env.BIGQUERY_DATASET}.accidentes\``;

// Paso 1: Recopila estadísticas clave de BigQuery
const obtenerEstadisticas = async () => {
  const queries = {
    totales: `
      SELECT
        COUNT(*) AS total_accidentes,
        COUNT(DISTINCT LOCALIDAD) AS total_localidades,
        COUNT(DISTINCT TIPO_DE_INCIDENTE) AS tipos_incidente_distintos,
        MIN(FECHA_INDICENTE) AS fecha_mas_antigua,
        MAX(FECHA_INDICENTE) AS fecha_mas_reciente
      FROM ${TABLA}
    `,
    por_localidad: `
      SELECT LOCALIDAD, COUNT(*) AS total
      FROM ${TABLA}
      GROUP BY LOCALIDAD
      ORDER BY total DESC
      LIMIT 10
    `,
    por_tipo: `
      SELECT TIPO_DE_INCIDENTE, COUNT(*) AS total
      FROM ${TABLA}
      GROUP BY TIPO_DE_INCIDENTE
      ORDER BY total DESC
    `,
    por_actor: `
      SELECT TIPO_DE_ACTORES_VIALES_IMPLICADOS, COUNT(*) AS total
      FROM ${TABLA}
      GROUP BY TIPO_DE_ACTORES_VIALES_IMPLICADOS
      ORDER BY total DESC
      LIMIT 10
    `,
  };

  const [totales, por_localidad, por_tipo, por_actor] = await Promise.all(
    Object.values(queries).map((query) => bigquery.query({ query }).then(([rows]) => rows))
  );

  return { totales: totales[0], por_localidad, por_tipo, por_actor };
};

// Paso 2: Construye el prompt y llama a Gemini
const generarAnalisis = async () => {
  const estadisticas = await obtenerEstadisticas();

  const prompt = `
    Eres un experto en seguridad vial urbana. Analiza los siguientes datos 
    de accidentalidad vial en Bogotá, Colombia y genera observaciones útiles 
    para tomadores de decisiones públicas.

    DATOS:
    ${JSON.stringify(estadisticas, null, 2)}

    INSTRUCCIONES:
    - Genera entre 5 y 8 observaciones basadas ÚNICAMENTE en los datos proporcionados
    - Cada observación debe ser concreta, accionable y respaldada por los números
    - Asigna severidad según este criterio:
        * Critico: patrones que implican riesgo de vida o zonas con altísima concentración
        * Importante: tendencias preocupantes que requieren intervención pronta
        * Info: datos contextuales o positivos relevantes para la toma de decisiones

    FORMATO DE RESPUESTA:
    Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques 
    de código markdown, sin explicaciones. Exactamente así:
    {
      "observaciones": [
        {
          "titulo": "Título breve de máximo 6 palabras",
          "observacion": "Descripción clara de máximo 2 oraciones con datos específicos",
          "severidad": "high" | "medium" | "low"
        }
      ]
    }
  `;

  const resultado = await model.generateContent(prompt);
  const texto = resultado.response.text();

  // Limpia posibles bloques markdown que Gemini agregue
  const limpio = texto.replace(/```json|```/g, '').trim();

  return JSON.parse(limpio);
};

module.exports = { generarAnalisis };