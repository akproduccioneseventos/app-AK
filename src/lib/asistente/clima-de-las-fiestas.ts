/**
 * @fileOverview Consulta meteorológica de fiestas con Open-Meteo.
 * Comprueba el pronóstico para los próximos 7 días y advierte de lluvias o vientos fuertes.
 */

export interface PronosticoClimaFiesta {
  fecha: string;
  probabilidadLluviaMax: number; // Porcentaje 0-100
  vientoMaxKmH: number;
  alertaLluvia: boolean;
  alertaViento: boolean;
  alertaGeneral: boolean;
  motivo?: string;
}

export interface PropuestaClimaFiesta {
  clave: string;
  area: 'fiestas';
  titulo: string;
  descripcion: string;
  porQueImporta: string;
  quePropone: string;
  fiestaId: string;
  clienteNombre?: string;
  fechaFiesta: string;
  nivelRiesgo: 'pregunta';
  datos: {
    probabilidadLluvia: number;
    vientoKmH: number;
  };
}

const COORDENADAS_SALTO_DEFAULT = {
  lat: -31.3833,
  lng: -57.9667,
};

/**
 * Consulta la API de Open-Meteo para una latitud y longitud.
 */
export async function consultarOpenMeteo(
  lat: number = COORDENADAS_SALTO_DEFAULT.lat,
  lng: number = COORDENADAS_SALTO_DEFAULT.lng
): Promise<any> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=precipitation_probability_max,windspeed_10m_max&timezone=America%2FMontevideo`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error al consultar clima en api.open-meteo.com:', error);
    return null;
  }
}

/**
 * Evalúa el pronóstico para una fecha específica (formato YYYY-MM-DD o Date).
 */
export async function evaluarClimaParaFecha(
  fecha: string | Date,
  lat?: number,
  lng?: number
): Promise<PronosticoClimaFiesta | null> {
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const fechaIso = fechaObj.toISOString().split('T')[0];

  const latitude = lat ?? COORDENADAS_SALTO_DEFAULT.lat;
  const longitude = lng ?? COORDENADAS_SALTO_DEFAULT.lng;

  const data = await consultarOpenMeteo(latitude, longitude);
  if (!data || !data.daily || !data.daily.time) {
    return null;
  }

  const times: string[] = data.daily.time;
  const index = times.indexOf(fechaIso);

  let probLluvia = 0;
  let vientoKmH = 0;

  if (index !== -1) {
    probLluvia = data.daily.precipitation_probability_max?.[index] ?? 0;
    vientoKmH = data.daily.windspeed_10m_max?.[index] ?? 0;
  } else {
    // Si no está el día exacto pero es en la ventana, tomamos el día más cercano
    probLluvia = data.daily.precipitation_probability_max?.[0] ?? 0;
    vientoKmH = data.daily.windspeed_10m_max?.[0] ?? 0;
  }

  const alertaLluvia = probLluvia > 60;
  const alertaViento = vientoKmH > 45;
  const alertaGeneral = alertaLluvia || alertaViento;

  let motivo = '';
  if (alertaLluvia && alertaViento) {
    motivo = `Lluvia probable (${probLluvia}%) y vientos fuertes (${vientoKmH} km/h).`;
  } else if (alertaLluvia) {
    motivo = `Alta probabilidad de lluvia (${probLluvia}%).`;
  } else if (alertaViento) {
    motivo = `Viento fuerte previsto (${vientoKmH} km/h).`;
  }

  return {
    fecha: fechaIso,
    probabilidadLluviaMax: probLluvia,
    vientoMaxKmH: vientoKmH,
    alertaLluvia,
    alertaViento,
    alertaGeneral,
    motivo: alertaGeneral ? motivo : undefined,
  };
}

/**
 * Revisa fiestas de los próximos 7 días y genera propuestas para el área de Fiestas si hay mal tiempo.
 */
export async function detectarAlertasClimaFiestas(
  fiestas: Array<{ id: string; fecha?: string; fechaEvento?: string; clienteNombre?: string; salonId?: string; salonNombre?: string }>,
  salonesMap: Record<string, { lat?: number; lng?: number }> = {}
): Promise<PropuestaClimaFiesta[]> {
  const propuestas: PropuestaClimaFiesta[] = [];
  const hoy = new Date();
  const limite7Dias = new Date();
  limite7Dias.setDate(hoy.getDate() + 7);

  for (const fiesta of fiestas) {
    const rawFecha = fiesta.fecha || fiesta.fechaEvento;
    if (!rawFecha) continue;

    const fechaFiesta = new Date(rawFecha);
    if (isNaN(fechaFiesta.getTime())) continue;

    // Verificar si está en los próximos 7 días
    if (fechaFiesta >= hoy && fechaFiesta <= limite7Dias) {
      const fechaStr = fechaFiesta.toISOString().split('T')[0];
      const salonCoord = fiesta.salonId ? salonesMap[fiesta.salonId] : undefined;
      const pronostico = await evaluarClimaParaFecha(fechaFiesta, salonCoord?.lat, salonCoord?.lng);

      if (pronostico && pronostico.alertaGeneral) {
        const nombreCliente = fiesta.clienteNombre || 'Cliente';
        const salonDesc = fiesta.salonNombre ? ` en ${fiesta.salonNombre}` : '';
        propuestas.push({
          clave: `clima-fiesta:${fiesta.id}:${fechaStr}`,
          area: 'fiestas',
          titulo: `Alerta de clima: fiesta de ${nombreCliente}${salonDesc}`,
          descripcion: `Pronóstico de ${pronostico.motivo} para el día ${fechaStr}.`,
          porQueImporta: 'Permite coordinar con anticipación carpas, gazebos o relocalizar estaciones al interior.',
          quePropone: `Pronóstico de lluvia para la fiesta de ${nombreCliente}: ¿prever carpa o cambiar el armado?`,
          fiestaId: fiesta.id,
          clienteNombre: nombreCliente,
          fechaFiesta: fechaStr,
          nivelRiesgo: 'pregunta',
          datos: {
            probabilidadLluvia: pronostico.probabilidadLluviaMax,
            vientoKmH: pronostico.vientoMaxKmH,
          },
        });
      }
    }
  }

  return propuestas;
}
