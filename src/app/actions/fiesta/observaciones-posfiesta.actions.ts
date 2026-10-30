'use server';

import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { crearObservacionesPosfiesta, sugerenciasPosfiesta, type EntradaObservacionPosfiesta, type ObservacionPosfiesta } from '@/lib/fiesta/sugerencias-posfiesta';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { hoyEnUruguay } from '@/lib/utils';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const ARCHIVO = 'observaciones-posfiesta.json';

function fiestaFinalizada(fiesta: FiestaEnPlanificacion, ahora = new Date()): boolean {
  const estado = String(fiesta.estado || '').trim().toLocaleLowerCase('es-UY');
  if (['suspendida', 'suspendido', 'cancelada', 'cancelado', 'archivada', 'archivado'].includes(estado)) return false;
  const rango = getFiestaTimeRange(fiesta);
  return !!rango && ahora.getTime() >= rango.endMs && rango.fechaStr < hoyEnUruguay(ahora);
}

export async function guardarObservacionesPosfiesta(
  fiestaId: string,
  entradas: unknown,
): Promise<{ success: boolean; observaciones: ObservacionPosfiesta[] }> {
  if (!fiestaId?.trim()) throw new Error('Falta identificar la fiesta.');
  const fiesta = await requireEventPermission(fiestaId, [PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION]);
  const ahora = new Date();
  if (!fiestaFinalizada(fiesta, ahora)) throw new Error('Solo se pueden registrar observaciones después del fin confirmado del evento en Uruguay.');
  const nuevas = crearObservacionesPosfiesta(fiesta, entradas, ahora.toISOString());
  if (!Array.isArray(entradas) || !nuevas.length || nuevas.length !== entradas.length) throw new Error('Revisá las observaciones: se requieren datos válidos y cantidades observadas mayores que cero.');
  const result = await mutateGenericJsonArray<ObservacionPosfiesta>(ARCHIVO, (actuales) => {
    const porId = new Map(actuales.map((item) => [item.id, item]));
    for (const nuevo of nuevas) {
      const existente = porId.get(nuevo.id);
      if (existente && !sonMismosHechos(existente, nuevo)) {
        throw new Error('Otra persona ya registró una observación distinta en esta posición. Volvé a cargar los hechos para evitar sobrescribirla.');
      }
    }
    const faltantes = nuevas.filter((nuevo) => !porId.has(nuevo.id));
    if (!faltantes.length) return null;
    return [...actuales, ...faltantes];
  });
  if (!result) {
    const { readData } = await import('@/lib/data-service');
    const actuales = await readData<ObservacionPosfiesta[]>(ARCHIVO, []);
    if (!nuevas.every((nuevo) => actuales.some((item) => sonMismosHechos(item, nuevo)))) {
      throw new Error('No se pudieron guardar las observaciones.');
    }
  }
  return { success: true, observaciones: nuevas };
}

function sonMismosHechos(a: ObservacionPosfiesta, b: ObservacionPosfiesta): boolean {
  return a.id === b.id && a.fiestaId === b.fiestaId && a.fechaEvento === b.fechaEvento &&
    a.categoria === b.categoria && a.tipo === b.tipo && a.elemento === b.elemento &&
    a.cantidad === b.cantidad && a.unidad === b.unidad && a.invitadosReales === b.invitadosReales;
}

export async function obtenerSugerenciasPosfiesta(fiestaId: string) {
  if (!fiestaId?.trim()) throw new Error('Falta identificar la fiesta.');
  const fiesta = await requireEventPermission(fiestaId, [PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION]);
  const { readDataConDetalle } = await import('@/lib/data-service');
  const lectura = await readDataConDetalle<ObservacionPosfiesta[]>(ARCHIVO, []);
  if (lectura.huboFalla) throw new Error('No se pudo leer el historial posfiesta; no se mostrarán sugerencias incompletas.');
  const invitadosEstimados = Number(fiesta.configuracion?.invitadosEstimados);
  return sugerenciasPosfiesta(lectura.valor, {
    fiestaId,
    tipoEvento: fiesta.configuracion?.tipoCelebracion,
    invitadosReales: null,
    invitadosEstimados: Number.isSafeInteger(invitadosEstimados) && invitadosEstimados > 0 ? invitadosEstimados : null,
  });
}

export async function obtenerObservacionesFiestaPosfiesta(fiestaId: string): Promise<ObservacionPosfiesta[]> {
  if (!fiestaId?.trim()) throw new Error('Falta identificar la fiesta.');
  await requireEventPermission(fiestaId, [PERMISOS.ADMINISTRACION, PERMISOS.ORGANIZACION]);
  const { readDataConDetalle } = await import('@/lib/data-service');
  const lectura = await readDataConDetalle<ObservacionPosfiesta[]>(ARCHIVO, []);
  if (lectura.huboFalla) throw new Error('No se pudieron leer los hechos guardados de esta fiesta.');
  return lectura.valor.filter((item) => item.fiestaId === fiestaId);
}
