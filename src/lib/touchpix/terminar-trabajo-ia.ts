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
 * - `original-publicada` / `original-subiendo` / `original-sin-confirmar`: la IA tardó tanto que la
 *   cola mandó la original como rescate. El resultado de la IA NO se sube: una sola foto por
 *   captura (orden 91). Y se dice "publicada" sólo si la cola CONFIRMÓ la subida (orden 93): si
 *   todavía está subiendo, se espera un rato; si sigue, se dice que se está subiendo.
 *
 * La **original** de la captura se guardó en el equipo al capturar, retenida para que la cola no
 * la suba mientras trabaja la IA (`retenidaHasta`). Cuando el resultado quedó a salvo, arriba o
 * en el equipo, la original se suelta: si no, se publicarían dos fotos por captura. Si el
 * resultado no quedó en ningún lado, la original **se deja**: cuando venza la retención, sube la
 * original, que es mejor que nada.
 */
export type DestinoDeLaFoto =
  | 'subida'
  | 'en-el-equipo'
  | 'no-guardada'
  | 'rechazada'
  | 'original-publicada'
  | 'original-subiendo'
  | 'original-sin-confirmar';

type EstadoDeLaOriginal = 'retenida' | 'subiendo' | 'publicada' | 'rechazada' | 'sin-rastro';

export async function terminarTrabajoIA(pasos: {
  subir: () => Promise<{ success: boolean; error?: string }>;
  guardarEnEquipo: () => Promise<unknown>;
  soltarOriginal: () => Promise<unknown>;
  /**
   * Vuelve a retener la original antes de subir el resultado (orden 91). `false`: la cola ya la
   * mandó como rescate, y entonces el resultado de la IA NO se sube (una sola foto por captura).
   * Si no hay original en el equipo, no se pasa.
   */
  retenerOriginal?: () => Promise<EstadoDeLaOriginal>;
  /** Para las pruebas: cómo esperar entre miradas mientras la cola sube la original. */
  dormir?: (ms: number) => Promise<void>;
  esperaMaximaMs?: number;
}): Promise<{ destino: DestinoDeLaFoto; error?: string }> {
  if (pasos.retenerOriginal) {
    const dormir = pasos.dormir ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
    const maximo = pasos.esperaMaximaMs ?? 60_000;
    const intervalo = 2_000;
    // Si la base del navegador falla, se sigue como antes: el trabajo sube su resultado.
    let estado: EstadoDeLaOriginal = await pasos.retenerOriginal().catch(() => 'retenida' as const);
    for (let esperado = 0; estado === 'subiendo' && esperado < maximo; esperado += intervalo) {
      await dormir(intervalo);
      estado = await pasos.retenerOriginal().catch(() => 'subiendo' as const);
    }
    if (estado === 'publicada') return { destino: 'original-publicada' };
    if (estado === 'rechazada') return { destino: 'rechazada' };
    if (estado === 'subiendo') return { destino: 'original-subiendo' };
    if (estado === 'sin-rastro') return { destino: 'original-sin-confirmar' };
    // `retenida`: el rescate no salió (o nunca empezó) y la original volvió a este trabajo.
  }
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
    case 'original-publicada':
      return 'La IA tardó demasiado: tu foto original ya está en la galería de la fiesta.';
    case 'original-subiendo':
      return 'La IA tardó demasiado: tu foto original se está subiendo a la galería de la fiesta.';
    case 'original-sin-confirmar':
      return 'La IA tardó demasiado: se mandó tu foto original. Si no aparece en la galería, avisale al equipo.';
    case 'rechazada':
      return 'Tu foto no se pudo publicar. Avisale al equipo.';
    case 'no-guardada':
    default:
      return 'No pudimos guardar tu foto. Tocá "Bajar foto" o avisale al equipo antes de cerrar.';
  }
}
