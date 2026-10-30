export type CategoriaObservacionPosfiesta = 'comida' | 'bebida' | 'personal';
export type TipoObservacionPosfiesta = 'sobro' | 'falto';

export interface ObservacionPosfiesta {
  id: string;
  fiestaId: string;
  fechaEvento: string;
  tipoEvento: string;
  invitadosReales: number | null;
  invitadosEstimados?: number | null;
  categoria: CategoriaObservacionPosfiesta;
  tipo: TipoObservacionPosfiesta;
  elemento: string;
  cantidad: number;
  unidad: string;
  actualizadoEn: string;
}

export interface EntradaObservacionPosfiesta {
  categoria: CategoriaObservacionPosfiesta;
  tipo?: TipoObservacionPosfiesta;
  elemento: string;
  cantidad?: number;
  unidad?: string;
}

export function invitadosAsistentesReales(
  invitados: Array<{ partySize?: number; checkedIn?: boolean; checkin?: boolean; asistio?: boolean }> | undefined,
): number | null {
  const presentes = (invitados || []).filter((item) => item.checkedIn === true || item.checkin === true || item.asistio === true);
  if (!presentes.length) return null;
  let total = 0;
  for (const item of presentes) {
    const cantidad = item.partySize === undefined ? 1 : Number(item.partySize);
    if (!Number.isSafeInteger(cantidad) || cantidad < 1) return null;
    total += cantidad;
    if (!Number.isSafeInteger(total)) return null;
  }
  return total;
}

const MAX_TEXTO = 80;
const MAX_CANTIDAD = 100_000;

export function normalizarEntradaObservacion(
  entrada: unknown,
): Omit<ObservacionPosfiesta, 'id' | 'fiestaId' | 'fechaEvento' | 'tipoEvento' | 'invitadosReales' | 'actualizadoEn'> | null {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) return null;
  const dato = entrada as Partial<EntradaObservacionPosfiesta>;
  const elemento = typeof dato.elemento === 'string' ? dato.elemento.trim().replace(/\s+/g, ' ') : '';
  const unidad = typeof dato.unidad === 'string' ? dato.unidad.trim().replace(/\s+/g, ' ') : '';
  const cantidad = dato.cantidad;
  if (!['comida', 'bebida', 'personal'].includes(dato.categoria as string)) return null;
  if (!['sobro', 'falto'].includes(dato.tipo || '')) return null;
  if (!elemento || elemento.length > MAX_TEXTO || /[\r\n<>@]|\d{7,}|\b\d+(?:[.,]\d{2})\b/.test(elemento)) return null;
  if (!unidad || unidad.length > 24 || /[\r\n<>@]|\d{7,}|\b\d+(?:[.,]\d{2})\b/.test(unidad)) return null;
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad) || cantidad <= 0 || cantidad > MAX_CANTIDAD) return null;
  if (dato.categoria === 'personal' && !Number.isInteger(cantidad)) return null;
  if (dato.categoria !== 'personal' && Number(cantidad.toFixed(2)) !== cantidad) return null;
  return { categoria: dato.categoria!, tipo: dato.tipo!, elemento, cantidad: cantidad!, unidad };
}

export function crearObservacionesPosfiesta(
  fiesta: { id: string; configuracion?: { fechaEvento?: string; tipoCelebracion?: string; invitadosEstimados?: number; invitadosAdultos?: number; invitadosNinos?: number; invitadosAdolescentes?: number }; invitados?: Array<{ partySize?: number; checkedIn?: boolean; checkin?: boolean; asistio?: boolean }> },
  entradas: unknown,
  actualizadoEn: string,
): ObservacionPosfiesta[] {
  if (!fiesta.id || !Array.isArray(entradas) || entradas.length < 1 || entradas.length > 30) return [];
  const fechaEvento = String(fiesta.configuracion?.fechaEvento || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEvento)) return [];
  const tipoEvento = String(fiesta.configuracion?.tipoCelebracion || '').trim().slice(0, MAX_TEXTO);
  const invitadosReales = invitadosAsistentesReales(fiesta.invitados);
  return entradas.flatMap((entrada, indice) => {
    const normalizada = normalizarEntradaObservacion(entrada);
    if (!normalizada) return [];
    const identidad = [normalizada.categoria, normalizada.tipo, normalizada.elemento.toLocaleLowerCase('es-UY'), normalizada.unidad.toLocaleLowerCase('es-UY')].join(':');
    const estimados = Number(fiesta.configuracion?.invitadosEstimados);
    return [{ ...normalizada, id: `${fiesta.id}:${fechaEvento}:${encodeURIComponent(identidad)}`, fiestaId: fiesta.id, fechaEvento, tipoEvento, invitadosReales, invitadosEstimados: Number.isSafeInteger(estimados) && estimados > 0 ? estimados : null, actualizadoEn }];
  });
}

export interface SugerenciaPosfiesta extends ObservacionPosfiesta {
  invitadosReferencia: number;
  baseInvitados: 'observados' | 'estimados';
  invitadosActuales: number;
  baseInvitadosActuales: 'observados' | 'estimados';
  diferenciaInvitados: number;
  requiereRevision: true;
  procedencia: string;
}

export function sugerenciasPosfiesta(
  observaciones: ObservacionPosfiesta[],
  actual: { fiestaId: string; tipoEvento?: string; invitadosReales?: number | null; invitadosEstimados?: number | null },
): SugerenciaPosfiesta[] {
  const tipo = (actual.tipoEvento || '').trim().toLocaleLowerCase('es-UY');
  const observadosActuales = Number.isSafeInteger(actual.invitadosReales) && (actual.invitadosReales as number) > 0 ? actual.invitadosReales as number : null;
  const estimadosActuales = Number.isSafeInteger(actual.invitadosEstimados) && (actual.invitadosEstimados as number) > 0 ? actual.invitadosEstimados as number : null;
  const actuales = observadosActuales ?? estimadosActuales;
  if (!tipo || actuales === null) return [];
  return observaciones.flatMap((item) => {
    if (item.fiestaId === actual.fiestaId || item.tipoEvento.trim().toLocaleLowerCase('es-UY') !== tipo) return [];
    const observados = Number.isSafeInteger(item.invitadosReales) && (item.invitadosReales as number) > 0 ? item.invitadosReales as number : null;
    const estimados = Number.isSafeInteger(item.invitadosEstimados) && (item.invitadosEstimados as number) > 0 ? item.invitadosEstimados as number : null;
    const referencia = observados ?? estimados;
    if (referencia === null) return [];
    return [{ ...item, invitadosReferencia: referencia, baseInvitados: observados !== null ? 'observados' as const : 'estimados' as const, invitadosActuales: actuales, baseInvitadosActuales: observadosActuales !== null ? 'observados' as const : 'estimados' as const, diferenciaInvitados: actuales - referencia, requiereRevision: true as const, procedencia: `Observación registrada en fiesta ${item.fiestaId}, ${item.fechaEvento}` }];
  }).sort((a, b) => Math.abs(a.diferenciaInvitados) - Math.abs(b.diferenciaInvitados) || b.fechaEvento.localeCompare(a.fechaEvento)).slice(0, 5);
}
