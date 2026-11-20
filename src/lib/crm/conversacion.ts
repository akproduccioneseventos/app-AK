import type { CrmMensaje } from '@/types/crm';

const MAX_CONVERSACION_MENSAJES = 500;

export function buildCrmMensaje(
  input: Omit<CrmMensaje, 'id'> & { id?: string },
): CrmMensaje {
  return {
    ...input,
    id: input.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fecha: input.fecha || new Date().toISOString(),
  };
}

/**
 * Fusiona mensajes en `CrmLead.conversacion` sin duplicar por `idExterno` ni por `id`,
 * ordenados cronológicamente de más antiguo a más reciente.
 */
export function mergeConversacionMessages(
  existing?: CrmMensaje[],
  incoming?: CrmMensaje[],
): CrmMensaje[] | undefined {
  const base = Array.isArray(existing) ? existing : [];
  const nuevos = Array.isArray(incoming) ? incoming : [];
  if (base.length === 0 && nuevos.length === 0) return existing;

  const resultado: CrmMensaje[] = [];
  const idsVistos = new Set<string>();
  const externosVistos = new Set<string>();

  for (const item of [...base, ...nuevos]) {
    if (!item || typeof item.texto !== 'string') continue;
    if (item.id && idsVistos.has(item.id)) continue;
    if (item.idExterno && externosVistos.has(item.idExterno)) continue;

    if (item.id) idsVistos.add(item.id);
    if (item.idExterno) externosVistos.add(item.idExterno);
    resultado.push(item);
  }

  resultado.sort((a, b) => {
    const ta = new Date(a.fecha).getTime();
    const tb = new Date(b.fecha).getTime();
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return -1;
    if (Number.isNaN(tb)) return 1;
    return ta - tb;
  });

  return resultado.slice(-MAX_CONVERSACION_MENSAJES);
}
