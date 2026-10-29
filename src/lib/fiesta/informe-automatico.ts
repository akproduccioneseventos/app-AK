export type DatoInforme<T> = { disponible: true; valor: T } | { disponible: false; motivo: string };

export interface InformeFiestaAutomatico {
  id: string;
  fiestaId: string;
  fechaEvento: string;
  fechaGeneracion: string;
  estado: 'preparado_para_revision';
  asistencia: DatoInforme<{ confirmados: number; asistieron: number }>;
  multimedia: DatoInforme<{ fotos: number; videos: number }>;
  catering: DatoInforme<{ sobrantes?: string[]; faltantes?: string[] }>;
  finanzas: DatoInforme<{ contratado: number; pagado: number; saldo: number; moneda: string }>;
  mejoresFotos: DatoInforme<Array<{ id: string; url: string; puntajeCalidad?: number; autor?: string; modulo?: string }>>;
  propuestaResumenDuenio: string;
  proximoPaso: 'revisar_y_aprobar';
}

export function armarInformeAutomatico(params: {
  fiesta: { id: string; configuracion?: { fechaEvento?: string; nombreEvento?: string; clienteNombre?: string } };
  posts?: Array<{ id?: string; fiestaId?: string; imageUrl?: string; mediaType?: string; moderationStatus?: string }>;
  invitados?: Array<{ partySize?: number; rsvp?: string; estadoRsvp?: string; checkedIn?: boolean; checkin?: boolean; asistio?: boolean }>;
  datos?: Partial<Pick<InformeFiestaAutomatico, 'asistencia' | 'multimedia' | 'catering' | 'finanzas' | 'mejoresFotos'>>;
  fechaGeneracion?: Date;
}): InformeFiestaAutomatico {
  const { fiesta, posts = [], invitados = [], datos = {}, fechaGeneracion = new Date() } = params;
  if (!fiesta?.id || !fiesta.configuracion?.fechaEvento) throw new Error('La fiesta debe tener id y fecha confirmados.');
  const id = `informe-posfiesta-${fiesta.id}-${fiesta.configuracion.fechaEvento.slice(0, 10)}`;
  const disponibilidad = <T>(dato: DatoInforme<T> | undefined, nombre: string): DatoInforme<T> =>
    dato || { disponible: false, motivo: `No hay datos confirmados de ${nombre}.` };

  const confirmados = invitados.filter((item) => ['confirmed', 'Confirmado'].includes(item.rsvp || item.estadoRsvp || '')).reduce((n, item) => n + Math.max(1, Number(item.partySize) || 1), 0);
  const asistieron = invitados.filter((item) => item.checkedIn === true || item.checkin === true || item.asistio === true).reduce((n, item) => n + Math.max(1, Number(item.partySize) || 1), 0);
  const mediaDeFiesta = posts.filter((item) => item.fiestaId === fiesta.id && item.moderationStatus === 'approved');
  return {
    id,
    fiestaId: fiesta.id,
    fechaEvento: fiesta.configuracion.fechaEvento,
    fechaGeneracion: fechaGeneracion.toISOString(),
    estado: 'preparado_para_revision',
    asistencia: datos.asistencia || (invitados.length ? { disponible: true, valor: { confirmados, asistieron } } : disponibilidad(undefined, 'asistencia')),
    multimedia: datos.multimedia || (posts.length ? { disponible: true, valor: { fotos: mediaDeFiesta.filter((p) => p.mediaType !== 'video').length, videos: mediaDeFiesta.filter((p) => p.mediaType === 'video').length } } : disponibilidad(undefined, 'multimedia')),
    catering: disponibilidad(datos.catering, 'sobrantes o faltantes de catering'),
    finanzas: disponibilidad(datos.finanzas, 'cierre financiero'),
    mejoresFotos: disponibilidad(datos.mejoresFotos, 'fotos aprobadas con permiso'),
    propuestaResumenDuenio: `Informe posfiesta de ${fiesta.id}: revisar la información disponible y aprobar el resumen antes de compartirlo.`,
    proximoPaso: 'revisar_y_aprobar',
  };
}
