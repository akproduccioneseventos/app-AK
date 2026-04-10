'use server';

import { readData, writeData } from '@/lib/data-service';
import type { MissionControlData, EtapaTimeline, EstadoEtapa, ChecklistItemEtapa } from '@/types/mission-control';

function getPath(fiestaId: string) {
  return `mission-control/${fiestaId}.json`;
}

function createDefaultMissionControl(fiestaId: string): MissionControlData {
  const etapas: EtapaTimeline[] = [
    {
      id: 'etapa-1',
      nombre: 'Montaje',
      descripcion: 'Preparación y armado del salón',
      horaInicio: '10:00',
      horaFin: '14:00',
      categoria: 'Montaje',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 1,
      checklist: [
        { id: 'c1-1', texto: 'Verificar iluminación y sonido', completado: false },
        { id: 'c1-2', texto: 'Confirmar disposición de mesas', completado: false },
        { id: 'c1-3', texto: 'Revisar decoración floral', completado: false },
        { id: 'c1-4', texto: 'Chequear accesos y estacionamiento', completado: false },
      ],
    },
    {
      id: 'etapa-2',
      nombre: 'Llegada Equipo',
      descripcion: 'Recepción del equipo de trabajo y proveedores',
      horaInicio: '14:00',
      horaFin: '15:30',
      categoria: 'General',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 2,
      checklist: [
        { id: 'c2-1', texto: 'Verificar llegada del DJ', completado: false },
        { id: 'c2-2', texto: 'Confirmar llegada del equipo de catering', completado: false },
        { id: 'c2-3', texto: 'Confirmar llegada del fotógrafo/video', completado: false },
      ],
    },
    {
      id: 'etapa-3',
      nombre: 'Recepción de Invitados',
      descripcion: 'Bienvenida y acomodación de invitados',
      horaInicio: '20:00',
      horaFin: '21:00',
      categoria: 'Entrada',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 3,
      checklist: [
        { id: 'c3-1', texto: 'Mesa de recepción habilitada', completado: false },
        { id: 'c3-2', texto: 'Lista de invitados disponible', completado: false },
        { id: 'c3-3', texto: 'Bebida de bienvenida lista', completado: false },
      ],
    },
    {
      id: 'etapa-4',
      nombre: 'Entrada de Protagonistas',
      descripcion: 'Ingreso formal de los festejados',
      horaInicio: '21:00',
      horaFin: '21:30',
      categoria: 'Entrada',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 4,
      checklist: [
        { id: 'c4-1', texto: 'Coordinación con DJ para música de entrada', completado: false },
        { id: 'c4-2', texto: 'Fotógrafo posicionado en lugar estratégico', completado: false },
        { id: 'c4-3', texto: 'Invitados alertados para recibir', completado: false },
      ],
    },
    {
      id: 'etapa-5',
      nombre: 'Cena',
      descripcion: 'Servicio de cena y platos principales',
      horaInicio: '21:30',
      horaFin: '23:00',
      categoria: 'Catering',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 5,
      checklist: [
        { id: 'c5-1', texto: 'Primer plato servido', completado: false },
        { id: 'c5-2', texto: 'Plato principal servido', completado: false },
        { id: 'c5-3', texto: 'Necesidades dietarias atendidas', completado: false },
        { id: 'c5-4', texto: 'Bebidas repuestas en mesas', completado: false },
      ],
    },
    {
      id: 'etapa-6',
      nombre: 'Torta y Brindis',
      descripcion: 'Ceremonia de la torta y brindis oficial',
      horaInicio: '23:00',
      horaFin: '23:30',
      categoria: 'Torta',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 6,
      checklist: [
        { id: 'c6-1', texto: 'Torta lista en posición', completado: false },
        { id: 'c6-2', texto: 'Copas con champagne para brindis', completado: false },
        { id: 'c6-3', texto: 'Coordinación con DJ para música', completado: false },
      ],
    },
    {
      id: 'etapa-7',
      nombre: 'Cierre de Fiesta',
      descripcion: 'Baile final y despedida de invitados',
      horaInicio: '01:00',
      horaFin: '03:00',
      categoria: 'Cierre',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 7,
      checklist: [
        { id: 'c7-1', texto: 'Coordinación de música de cierre con DJ', completado: false },
        { id: 'c7-2', texto: 'Entrega de recuerdos/souvenirs', completado: false },
        { id: 'c7-3', texto: 'Despedida formal de festejados', completado: false },
      ],
    },
    {
      id: 'etapa-8',
      nombre: 'Desmontaje',
      descripcion: 'Limpieza y retiro de equipamiento',
      horaInicio: '03:00',
      horaFin: '05:00',
      categoria: 'Montaje',
      estado: 'Pendiente',
      responsableLead: 'Por asignar',
      orden: 8,
      checklist: [
        { id: 'c8-1', texto: 'Retiro de equipo de sonido/DJ', completado: false },
        { id: 'c8-2', texto: 'Retiro de decoración', completado: false },
        { id: 'c8-3', texto: 'Limpieza del salón', completado: false },
        { id: 'c8-4', texto: 'Entrega del salón al responsable', completado: false },
      ],
    },
  ];

  return {
    fiestaId,
    etapas,
    ultimaActualizacion: new Date().toISOString(),
    estadoGeneral: 'En Preparación',
  };
}

export async function getMissionControl(fiestaId: string): Promise<{ success: boolean; data?: MissionControlData; error?: string }> {
  try {
    const data = await readData<MissionControlData | null>(getPath(fiestaId), null);
    if (!data) {
      const defaultData = createDefaultMissionControl(fiestaId);
      await writeData(getPath(fiestaId), defaultData);
      return { success: true, data: defaultData };
    }
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateMissionControl(fiestaId: string, data: MissionControlData): Promise<{ success: boolean; error?: string }> {
  try {
    await writeData(getPath(fiestaId), { ...data, ultimaActualizacion: new Date().toISOString() });
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateEtapaEstado(fiestaId: string, etapaId: string, estado: EstadoEtapa): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await getMissionControl(fiestaId);
    if (!result.success || !result.data) return { success: false, error: result.error ?? 'No encontrado' };

    const data = result.data;
    data.etapas = data.etapas.map(e => e.id === etapaId ? { ...e, estado } : e);
    data.ultimaActualizacion = new Date().toISOString();

    await writeData(getPath(fiestaId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function toggleChecklistItem(
  fiestaId: string,
  etapaId: string,
  itemId: string,
  completadoPor?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await getMissionControl(fiestaId);
    if (!result.success || !result.data) return { success: false, error: result.error ?? 'No encontrado' };

    const data = result.data;
    data.etapas = data.etapas.map(e => {
      if (e.id !== etapaId) return e;
      const checklist: ChecklistItemEtapa[] = e.checklist.map(item => {
        if (item.id !== itemId) return item;
        const nowCompleted = !item.completado;
        return {
          ...item,
          completado: nowCompleted,
          completadoPor: nowCompleted ? (completadoPor ?? item.completadoPor) : undefined,
          completadoEn: nowCompleted ? new Date().toISOString() : undefined,
        };
      });
      return { ...e, checklist };
    });
    data.ultimaActualizacion = new Date().toISOString();

    await writeData(getPath(fiestaId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function addNotaEtapa(fiestaId: string, etapaId: string, nota: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await getMissionControl(fiestaId);
    if (!result.success || !result.data) return { success: false, error: result.error ?? 'No encontrado' };

    const data = result.data;
    data.etapas = data.etapas.map(e => e.id === etapaId ? { ...e, notas: nota } : e);
    data.ultimaActualizacion = new Date().toISOString();

    await writeData(getPath(fiestaId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function addEtapa(fiestaId: string, etapa: Omit<EtapaTimeline, 'id' | 'orden'>): Promise<{ success: boolean; data?: EtapaTimeline; error?: string }> {
  try {
    const result = await getMissionControl(fiestaId);
    if (!result.success || !result.data) return { success: false, error: result.error ?? 'No encontrado' };

    const data = result.data;
    const newEtapa: EtapaTimeline = {
      ...etapa,
      id: `etapa-${Date.now()}`,
      orden: data.etapas.length + 1,
    };
    data.etapas = [...data.etapas, newEtapa];
    data.ultimaActualizacion = new Date().toISOString();

    await writeData(getPath(fiestaId), data);
    return { success: true, data: newEtapa };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updateEtapa(
  fiestaId: string,
  etapaId: string,
  updates: Partial<EtapaTimeline>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await getMissionControl(fiestaId);
    if (!result.success || !result.data) return { success: false, error: result.error ?? 'No encontrado' };

    const data = result.data;
    data.etapas = data.etapas.map(e => e.id === etapaId ? { ...e, ...updates } : e);
    data.ultimaActualizacion = new Date().toISOString();

    await writeData(getPath(fiestaId), data);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
