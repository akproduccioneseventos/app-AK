'use server';

import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { upsertPublicCommercialLead } from '@/lib/crm/public-lead-persistence';

export interface SuscripcionResult {
  success: boolean;
  message: string;
}

/**
 * Alguien deja su correo para enterarse de las novedades.
 *
 * **Antes esto no guardaba nada.** Le decia al visitante "gracias, te mantendremos
 * al tanto" y devolvia exito sin escribir el correo en ningun lado: se perdia. Una
 * promesa que la app no cumple, y encima un prospecto perdido.
 *
 * Ahora el correo entra a la lista de contactos de siempre, marcado de donde vino,
 * para que el equipo lo vea junto al resto. **No se le manda nada solo:** los
 * mensajes los manda una persona, como en todo lo demas.
 */
export async function suscribirANovedades(email: string): Promise<SuscripcionResult> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, message: 'Por favor ingresá un correo electrónico válido.' };
  }

  if (process.env.NODE_ENV !== 'test') {
    try {
      await enforcePublicRateLimit({
        scope: 'suscripcion-novedades',
        limit: 5,
        windowMs: 60_000,
      });
    } catch {
      return { success: false, message: 'Aguardá un momento antes de reintentar.' };
    }
  }

  // Del correo sale un nombre provisorio: la ficha necesita uno y la persona todavia
  // no lo dio. El equipo lo completa cuando la contacta.
  const nombreDelCorreo = cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').trim();
  const nombre = nombreDelCorreo.length >= 3 ? nombreDelCorreo : `Suscriptor ${cleanEmail}`;

  try {
    await upsertPublicCommercialLead({
      name: nombre.slice(0, 120),
      phone: '',
      email: cleanEmail,
      permitirSinTelefono: true,
      claveSinTelefono: `novedades:${cleanEmail}`,
      notes: 'Se suscribió a las novedades desde la web. Todavía no dejó teléfono.',
      acquisition: { source: 'web-novedades' } as never,
    });
  } catch {
    // Si la ficha no se puede guardar, NO se le miente al visitante diciendo que si.
    return {
      success: false,
      message: 'No pudimos guardar tu correo. Probá de nuevo en un rato o escribinos por WhatsApp.',
    };
  }

  return {
    success: true,
    message: '¡Listo! Quedaste anotado y te vamos a escribir con las novedades de AK Producciones.',
  };
}
