'use server';

import { leerFiestasCrudas } from '@/lib/fiesta/leer-fiestas';
import {
  aniosDeAK,
  fiestasRealizadas,
  FIESTAS_BASE,
  type CifrasDeAK,
} from '@/lib/marketing/cifras-de-ak';

/**
 * Lectura pública agregada de las cifras comerciales de AK Producciones.
 * No devuelve nombres, teléfonos ni detalles individuales de ninguna fiesta.
 */
export async function getCifrasPublicasAK(): Promise<CifrasDeAK> {
  const anios = aniosDeAK();
  try {
    const fiestas = await leerFiestasCrudas(false);
    return {
      anios,
      fiestasRealizadas: fiestasRealizadas(fiestas),
    };
  } catch {
    return {
      anios,
      fiestasRealizadas: FIESTAS_BASE,
    };
  }
}
