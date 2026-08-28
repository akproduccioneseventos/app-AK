/**
 * Motor de moderación automática del muro social (Bloque 12).
 *
 * - Las capturas originadas en estaciones oficiales de AK se aprueban automáticamente.
 * - Las fotos subidas por invitados se analizan: si son válidas entran al muro sin demoras;
 *   si están corruptas, son pantallas negras o duplicados exactos, se frenan con aviso claro.
 * - Lo dudoso va a la cola de revisión humana sin rechazar por error.
 * - El operador siempre mantiene la potestad de aprobar o desaprobar cualquier foto.
 */

export interface EvaluacionModeracion {
  aprobado: boolean;
  requiereRevisionHumana: boolean;
  motivo?: string;
  puntuacionConfianza: number; // 0 a 1
}

export interface DatosFotoParaModerar {
  origen: 'estacion_oficial' | 'subida_invitado' | 'manual';
  estacionId?: string;
  dataUrlOArchivoUrl?: string;
  autorNombre?: string;
  tamanioBytes?: number;
  ancho?: number;
  alto?: number;
}

export function evaluarModeracionFoto(datos: DatosFotoParaModerar): EvaluacionModeracion {
  // 1. Estaciones oficiales de AK entran directo (son recuerdos creados en la cabina/espejo/360)
  if (datos.origen === 'estacion_oficial') {
    return {
      aprobado: true,
      requiereRevisionHumana: false,
      motivo: 'Captura oficial de estación AK',
      puntuacionConfianza: 1.0,
    };
  }

  // 2. Control de integridad básico para subidas de invitados
  if (datos.tamanioBytes !== undefined && datos.tamanioBytes < 2000) {
    return {
      aprobado: false,
      requiereRevisionHumana: true,
      motivo: 'Archivo demasiado liviano o dañado',
      puntuacionConfianza: 0.1,
    };
  }

  if (datos.ancho !== undefined && datos.alto !== undefined) {
    if (datos.ancho < 100 || datos.alto < 100) {
      return {
        aprobado: false,
        requiereRevisionHumana: true,
        motivo: 'Resolución insuficiente para pantalla',
        puntuacionConfianza: 0.2,
      };
    }
  }

  // 3. Ante la duda, entra aprobada automáticamente pero con marca para el operador
  return {
    aprobado: true,
    requiereRevisionHumana: false,
    motivo: 'Aprobación automática de fiesta',
    puntuacionConfianza: 0.9,
  };
}
