/**
 * Ajustes Remotos (Firebase Remote Config / Fallback en memoria)
 * Orden 33: Permite cambiar configuraciones operativas sin redesplegar código.
 * Regla de oro: NUNCA bloquea, timeout de 3s, usa siempre valores por defecto seguros si Firebase no responde.
 */

export interface AjustesRemotos {
  estacionesApagadas: string[];
  cartelDeMantenimiento: string;
  modoCinePorDefecto: boolean;
  topeImagenesIaPorFiesta: number;
  mensajeDePromocion: string;
}

export const AJUSTES_POR_DEFECTO: AjustesRemotos = {
  estacionesApagadas: [],
  cartelDeMantenimiento: '',
  modoCinePorDefecto: false,
  topeImagenesIaPorFiesta: 3, // Tope seguro por defecto
  mensajeDePromocion: 'Consultá por paquetes especiales para tu fiesta',
};

let cacheAjustes: AjustesRemotos = { ...AJUSTES_POR_DEFECTO };
let cargado = false;

/**
 * Obtiene los ajustes remotos en memoria de forma sincrónica.
 */
export function obtenerAjustesRemotos(): AjustesRemotos {
  return cacheAjustes;
}

/**
 * Carga o refresca los ajustes remotos con un límite estricto de tiempo (3s).
 * Si falla, no hay red o no hay credenciales, devuelve inmediatamente los valores por defecto.
 */
export async function inicializarAjustesRemotos(): Promise<AjustesRemotos> {
  if (cargado) return cacheAjustes;

  if (typeof window === 'undefined') {
    return cacheAjustes;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    // Si Firebase está configurado, intentamos consultar Firestore o la configuración remota
    const { db } = await import('@/lib/firebase/config');
    if (!db) {
      clearTimeout(timeoutId);
      cargado = true;
      return cacheAjustes;
    }

    const { doc, getDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'configuracion_sistema', 'ajustes_remotos');

    // Promesa de fetch con carrera contra el timeout de 3 segundos
    const snap = await Promise.race([
      getDoc(docRef),
      new Promise<null>((_, reject) => {
        controller.signal.addEventListener('abort', () => reject(new Error('Timeout ajustes remotos')));
      }),
    ]);

    clearTimeout(timeoutId);

    if (snap && snap.exists()) {
      const data = snap.data();
      cacheAjustes = {
        estacionesApagadas: Array.isArray(data.estacionesApagadas) ? data.estacionesApagadas : AJUSTES_POR_DEFECTO.estacionesApagadas,
        cartelDeMantenimiento: typeof data.cartelDeMantenimiento === 'string' ? data.cartelDeMantenimiento : AJUSTES_POR_DEFECTO.cartelDeMantenimiento,
        modoCinePorDefecto: typeof data.modoCinePorDefecto === 'boolean' ? data.modoCinePorDefecto : AJUSTES_POR_DEFECTO.modoCinePorDefecto,
        // El remoto sólo puede bajar el tope, nunca subirlo más allá de 3
        topeImagenesIaPorFiesta: typeof data.topeImagenesIaPorFiesta === 'number'
          ? Math.min(AJUSTES_POR_DEFECTO.topeImagenesIaPorFiesta, Math.max(0, data.topeImagenesIaPorFiesta))
          : AJUSTES_POR_DEFECTO.topeImagenesIaPorFiesta,
        mensajeDePromocion: typeof data.mensajeDePromocion === 'string' && data.mensajeDePromocion.trim()
          ? data.mensajeDePromocion
          : AJUSTES_POR_DEFECTO.mensajeDePromocion,
      };
    }
  } catch {
    // Falla silenciosa: usamos siempre los valores por defecto sin interrumpir la app
    cacheAjustes = { ...AJUSTES_POR_DEFECTO };
  } finally {
    clearTimeout(timeoutId);
    cargado = true;
  }

  return cacheAjustes;
}

/**
 * Permite reiniciar la caché (para tests unitarios)
 */
export function _resetCacheParaTests(nuevosAjustes?: Partial<AjustesRemotos>) {
  cargado = Boolean(nuevosAjustes);
  cacheAjustes = nuevosAjustes ? { ...AJUSTES_POR_DEFECTO, ...nuevosAjustes } : { ...AJUSTES_POR_DEFECTO };
}

