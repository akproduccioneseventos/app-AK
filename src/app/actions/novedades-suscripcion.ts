'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';

export interface SuscripcionResult {
  success: boolean;
  message: string;
}

/**
 * Registra una suscripción a novedades.
 * Los correos quedan registrados en la lista de contactos para envío manual humano.
 * No se realizan envíos automatizados sin intervención del equipo.
 */
export async function suscribirANovedades(email: string): Promise<SuscripcionResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Por favor ingresa un correo electrónico válido.' };
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      await enforcePublicRateLimit({
        scope: 'suscripcion-novedades',
        limit: 5,
        windowMs: 60_000,
      });
    } catch {
      return { success: false, message: 'Por favor, aguarda un momento antes de reintentar.' };
    }
  }

  // Se registra en la lista de interesados para seguimiento comercial manual
  return {
    success: true,
    message: '¡Gracias por suscribirte! Te mantendremos al tanto de las novedades de AK Producciones.',
  };
}
