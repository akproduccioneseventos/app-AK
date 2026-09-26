import { classifyOfflineUploadError } from '@/lib/offline/offline-upload-policy';

/**
 * CÓMO TERMINA UNA FOTO DE LA CABINA CON IA (devolución 89, Codex, 26 de septiembre de 2026).
 *
 * La pantalla anunciaba "¡Foto lista en la galería!" pasara lo que pasara: con la señal caída,
 * con la foto rechazada y hasta con el equipo sin lugar para guardarla. Este paso devuelve DÓNDE
 * quedó la foto de verdad, y la pantalla dice eso y nada más.
 *
 * - `subida`: el servidor la recibió.
 * - `en-el-equipo`: no se pudo subir, pero quedó en la cola del equipo y sube sola al volver la
 *   señal.
 * - `no-guardada`: no se pudo subir **ni guardar**. La pantalla ofrece bajarla.
 * - `rechazada`: el servidor la rechazó por una regla (permiso, contenido). No se reintenta sola.
 *
 * La **original** de la captura se guardó en el equipo al capturar, retenida para que la cola no
 * la suba mientras trabaja la IA (`retenidaHasta`). Cuando el resultado quedó a salvo, arriba o
 * en el equipo, la original se suelta: si no, se publicarían dos fotos por captura. Si el
 * resultado no quedó en ningún lado, la original **se deja**: cuando venza la retención, sube la
 * original, que es mejor que nada.
 */
export type DestinoDeLaFoto = 'subida' | 'en-el-equipo' | 'no-guardada' | 'rechazada';

export async function terminarTrabajoIA(pasos: {
  subir: () => Promise<{ success: boolean; error?: string }>;
  guardarEnEquipo: () => Promise<unknown>;
  soltarOriginal: () => Promise<unknown>;
}): Promise<{ destino: DestinoDeLaFoto; error?: string }> {
  let error = '';
  try {
    const res = await pasos.subir();
    if (res.success) {
      await pasos.soltarOriginal().catch(() => undefined);
      return { destino: 'subida' };
    }
    error = res.error || 'Error al subir';
  } catch (e: any) {
    error = e?.message || 'Sin conexión';
  }

  const decision = classifyOfflineUploadError(error);
  if (decision === 'duplicate') {
    // El servidor ya la tenía: la subida anterior llegó y se perdió la respuesta.
    await pasos.soltarOriginal().catch(() => undefined);
    return { destino: 'subida' };
  }
  if (decision === 'permanent') {
    // Rechazada por una regla: la original tampoco tiene que subir sola.
    await pasos.soltarOriginal().catch(() => undefined);
    return { destino: 'rechazada', error };
  }
  try {
    await pasos.guardarEnEquipo();
  } catch {
    return { destino: 'no-guardada', error };
  }
  await pasos.soltarOriginal().catch(() => undefined);
  return { destino: 'en-el-equipo', error };
}

/** Lo que la pantalla le dice al invitado, según dónde quedó de verdad la foto. */
export function avisoDelDestino(destino: DestinoDeLaFoto, fueIA: boolean): string {
  const efecto = fueIA ? 'Tu foto con IA' : 'Tu foto (con efecto local, la IA no respondió)';
  switch (destino) {
    case 'subida':
      return `${efecto} ya se subió a la galería de la fiesta.`;
    case 'en-el-equipo':
      return `${efecto} quedó guardada en este equipo y se sube sola cuando vuelva la señal.`;
    case 'rechazada':
      return 'Tu foto no se pudo publicar. Avisale al equipo.';
    case 'no-guardada':
    default:
      return 'No pudimos guardar tu foto. Tocá "Bajar foto" o avisale al equipo antes de cerrar.';
  }
}
