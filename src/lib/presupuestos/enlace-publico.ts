import { getPresupuestoShareToken } from '@/app/actions/presupuestos';

/**
 * EL enlace que abre el cliente, sin cuenta: `/presupuestos/<id>/ver?cliente=1&token=...`.
 *
 * Codex, auditoría 80 (SHARE80): la barra flotante copiaba la dirección interna del equipo, y
 * el cliente que la abría caía en el ingreso. Copiar, WhatsApp y compartir salen de acá, igual
 * que el botón propio de la pantalla. Si no se puede emitir el token, tira: quien llama avisa que
 * falló, nunca "enlace copiado".
 */
export async function enlacePublicoDelPresupuesto(
  presupuestoId: string,
  origen: string,
  tokenConocido?: string | null,
  clienteNombre?: string | null,
): Promise<string> {
  let token = tokenConocido || '';
  if (!token) {
    const r = await getPresupuestoShareToken(presupuestoId);
    if (!r.success || !r.token) throw new Error(r.error || 'No se pudo crear un acceso seguro al presupuesto.');
    token = r.token;
  }
  const url = new URL(`/presupuestos/${encodeURIComponent(presupuestoId)}/ver`, origen);
  url.searchParams.set('cliente', '1');
  url.searchParams.set('token', token);
  const nombre = (clienteNombre || '').trim().replace(/\s+/g, '_');
  if (nombre) url.searchParams.set('para', nombre);
  return url.toString();
}
