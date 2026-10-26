import type { FiestaEnPlanificacion, Tarea } from '@/types/fiesta';
import type { Presupuesto } from '@/types/presupuesto';
import { calculateReadinessScore } from '@/lib/readiness-score';
import { subDays, startOfWeek } from 'date-fns';
import { hayPresupuestoParaIA, registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { generateWithGeminiFallback, getGeminiModelForAgent } from '@/ai/genkit';

export interface GenerarTareasParams {
  fiesta: FiestaEnPlanificacion;
  presupuesto?: Presupuesto | null;
  ahora?: Date;
}

export async function generarTareasSegunServiciosYReadiness({
  fiesta,
  presupuesto,
  ahora = new Date(),
}: GenerarTareasParams): Promise<Tarea[]> {
  const tareas: Tarea[] = [];
  const fechaEventoStr = fiesta.configuracion?.fechaEvento || (fiesta.configuracion as any)?.fecha;
  const fechaEvento = fechaEventoStr ? new Date(fechaEventoStr) : new Date(ahora.getTime() + 14 * 86400000);
  const eventDate = isNaN(fechaEvento.getTime()) ? new Date(ahora.getTime() + 14 * 86400000) : fechaEvento;

  let mondayForCatering = startOfWeek(eventDate, { weekStartsOn: 1 });
  if (eventDate.getDay() === 1 || eventDate.getDay() === 2) {
    mondayForCatering = subDays(mondayForCatering, 7);
  }

  // 1. Detectar servicios contratados
  const serviciosContratados = new Set<string>();

  // Del presupuesto si existe
  const itemsPresupuesto = (presupuesto as any)?.itemsPresupuestados || (presupuesto as any)?.items || [];
  for (const item of itemsPresupuesto) {
    const desc = ((item as any).nombre || (item as any).nombreServicio || (item as any).descripcion || '').toLowerCase();
      if (desc.includes('fotocabina') || desc.includes('cabina de fotos') || desc.includes('tiras')) serviciosContratados.add('fotocabina');
      if (desc.includes('360') || desc.includes('touchpix') || desc.includes('plataforma')) serviciosContratados.add('360');
      if (desc.includes('catering') || desc.includes('menu') || desc.includes('asado') || desc.includes('plato')) serviciosContratados.add('catering');
      if (desc.includes('dj') || desc.includes('sonido') || desc.includes('iluminacion') || desc.includes('luces')) serviciosContratados.add('dj');
      if (desc.includes('barra') || desc.includes('trago') || desc.includes('coctel') || desc.includes('barman')) serviciosContratados.add('barra');
      if (desc.includes('pantalla') || desc.includes('muro') || desc.includes('proyector')) serviciosContratados.add('pantalla');
  }

  // De los modulos contratados en la fiesta
  if (fiesta.modulosContratados) {
    const mod = fiesta.modulosContratados as any;
    if (mod.fotocabina) serviciosContratados.add('fotocabina');
    if (mod.plataforma360) serviciosContratados.add('360');
    if (mod.catering || fiesta.menuAsignadoId) serviciosContratados.add('catering');
    if (mod.pantallaGigante || mod.muroSocial) serviciosContratados.add('pantalla');
    if (mod.barraTragos) serviciosContratados.add('barra');
  }

  // Si no hay modulos detectados todavia, sugerir los esenciales
  if (serviciosContratados.size === 0) {
    serviciosContratados.add('dj');
    serviciosContratados.add('catering');
  }

  // Tareas estables por servicio
  if (serviciosContratados.has('fotocabina')) {
    tareas.push({
      id: `tarea_servicio_fotocabina`,
      texto: 'Diseñar e imprimir plantilla de Fotocabina',
      descripcion: 'Coordinar con el cliente el marco gráfico, tiras de fotos y logo personalizado.',
      completada: false,
      fechaLimite: subDays(eventDate, 7).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  if (serviciosContratados.has('360')) {
    tareas.push({
      id: `tarea_servicio_360`,
      texto: 'Configurar superposiciones y música para Plataforma 360',
      descripcion: 'Subir overlay gráfico y pista de audio en Touchpix para los videos de los invitados.',
      completada: false,
      fechaLimite: subDays(eventDate, 5).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  if (serviciosContratados.has('catering')) {
    tareas.push({
      id: `tarea_servicio_catering`,
      texto: 'Comprar insumos de catering y bebidas',
      descripcion: 'Ir al mercado y distribuidores mayoristas para adquirir todo lo necesario para el menú.',
      completada: false,
      fechaLimite: mondayForCatering.toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  if (serviciosContratados.has('dj')) {
    tareas.push({
      id: `tarea_servicio_dj`,
      texto: 'Revisar playlist y briefing para el DJ',
      descripcion: 'Confirmar canciones de momentos clave y lista de temas no deseados.',
      completada: false,
      fechaLimite: subDays(eventDate, 3).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  if (serviciosContratados.has('barra')) {
    tareas.push({
      id: `tarea_servicio_barra`,
      texto: 'Controlar stock de licores y descartables de barra',
      descripcion: 'Comprobar insumos para coctelería, hielo y copas/vasos.',
      completada: false,
      fechaLimite: subDays(eventDate, 2).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  if (serviciosContratados.has('pantalla')) {
    tareas.push({
      id: `tarea_servicio_pantalla`,
      texto: 'Verificar contenido para pantalla gigante y muro social',
      descripcion: 'Chequear proyección, videos de homenaje y conectividad en el salón.',
      completada: false,
      fechaLimite: subDays(eventDate, 2).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  // 2. Tareas por lo que falta según readiness-score
  const readiness = calculateReadinessScore(fiesta);

  // Falta lista de invitados o está vacía
  const invitados = fiesta.invitados || [];
  if (invitados.length === 0) {
    tareas.push({
      id: `tarea_readiness_invitados`,
      texto: 'Cargar la lista inicial de invitados',
      descripcion: 'Solicitar al cliente la nómina de invitados para comenzar la confirmación de asistencia.',
      completada: false,
      fechaLimite: subDays(eventDate, 15).toISOString(),
      asignadaA: 'Cliente',
      esPredeterminada: true,
    });
  }

  // Faltan pagos o cuotas pendientes
  const cuotas = fiesta.planDePagos?.cuotas || [];
  const cuotasImpagas = cuotas.filter(c => c.estado !== 'pagado');
  if (cuotasImpagas.length > 0) {
    tareas.push({
      id: `tarea_readiness_cobros`,
      texto: 'Seguimiento de cuotas del plan de pagos',
      descripcion: `Existen ${cuotasImpagas.length} cuota(s) pendiente(s) por registrar en el plan de cobros.`,
      completada: false,
      fechaLimite: subDays(eventDate, 10).toISOString(),
      asignadaA: 'Organizador',
      esPredeterminada: true,
    });
  }

  // Falta música
  const musica = fiesta.musica;
  if (!musica?.playlistFiesta && !musica?.cancionEntrada) {
    tareas.push({
      id: `tarea_readiness_musica`,
      texto: 'Definir canciones clave del agasajado',
      descripcion: 'Completar canción de entrada, vals y momentos especiales en el portal.',
      completada: false,
      fechaLimite: subDays(eventDate, 7).toISOString(),
      asignadaA: 'Cliente',
      esPredeterminada: true,
    });
  }

  // Tarea de montaje y coordinación general
  tareas.push({
    id: `tarea_coordinacion_montaje`,
    texto: 'Check-in final del salón y montaje',
    descripcion: 'Llegada al salón para supervisar el armado inicial y distribución de mesas.',
    completada: false,
    fechaLimite: eventDate.toISOString(),
    asignadaA: 'Organizador',
    esPredeterminada: true,
  });

  return tareas;
}

