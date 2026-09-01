/**
 * Modos de captura compartidos para las estaciones de entretenimiento (dslrBooth/Touchpix style).
 *
 * Soporta: foto, video, gif, boomerang y cámara lenta.
 */

export type TipoModoCaptura = 'foto' | 'video' | 'gif' | 'boomerang' | 'camara_lenta';

export interface MetaModoCaptura {
  id: TipoModoCaptura;
  nombre: string;
  emoji: string;
  duracionSegundos?: number;
}

export const METADATOS_MODOS_CAPTURA: Record<TipoModoCaptura, MetaModoCaptura> = {
  foto: { id: 'foto', nombre: 'Foto', emoji: '📸' },
  video: { id: 'video', nombre: 'Video', emoji: '🎥', duracionSegundos: 10 },
  gif: { id: 'gif', nombre: 'GIF', emoji: '🎞️', duracionSegundos: 4 },
  boomerang: { id: 'boomerang', nombre: 'Boomerang', emoji: '🔄', duracionSegundos: 3 },
  camara_lenta: { id: 'camara_lenta', nombre: 'Cámara Lenta', emoji: '⚡', duracionSegundos: 6 },
};

/**
 * Obtiene la lista de modos de captura habilitados según la configuración de la estación.
 */
export function obtenerModosCapturaHabilitados(
  captureModes?: string[] | null,
  modoDefault: TipoModoCaptura = 'foto'
): MetaModoCaptura[] {
  if (!captureModes || captureModes.length === 0) {
    return [METADATOS_MODOS_CAPTURA[modoDefault] || METADATOS_MODOS_CAPTURA.foto];
  }

  const resultado: MetaModoCaptura[] = [];
  for (const mode of captureModes) {
    const normalizado = mode.toLowerCase().trim() as TipoModoCaptura;
    if (METADATOS_MODOS_CAPTURA[normalizado]) {
      resultado.push(METADATOS_MODOS_CAPTURA[normalizado]);
    }
  }

  return resultado.length > 0 ? resultado : [METADATOS_MODOS_CAPTURA[modoDefault] || METADATOS_MODOS_CAPTURA.foto];
}

export type OrientacionCamara = 'vertical' | 'horizontal' | 'cuadrada';

export interface DimensionesOrientacion {
  ancho: number;
  alto: number;
  relacionAspecto: number; // ancho / alto
}

export function obtenerDimensionesPorOrientacion(orientacion: OrientacionCamara = 'vertical'): DimensionesOrientacion {
  switch (orientacion) {
    case 'horizontal':
      return { ancho: 1800, alto: 1200, relacionAspecto: 3 / 2 };
    case 'cuadrada':
      return { ancho: 1400, alto: 1400, relacionAspecto: 1 };
    case 'vertical':
    default:
      return { ancho: 1200, alto: 1800, relacionAspecto: 2 / 3 };
  }
}
