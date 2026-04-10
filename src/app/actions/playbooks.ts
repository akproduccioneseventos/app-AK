'use server';

import type { Playbook, PlaybookAplicacion, PlaybookTarea } from '@/types/playbook';
import type { TipoEvento } from '@/types/presupuesto';
import type { Tarea } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const PLAYBOOKS_FILE = 'playbooks.json';
const APLICACIONES_FILE = 'playbook-aplicaciones.json';

export async function getPlaybooks(): Promise<Playbook[]> {
  return readData<Playbook[]>(PLAYBOOKS_FILE, []);
}

export async function getPlaybookById(id: string): Promise<Playbook | null> {
  const playbooks = await getPlaybooks();
  return playbooks.find(p => p.id === id) ?? null;
}

export async function getPlaybookByTipoEvento(tipoEvento: TipoEvento | 'Otro'): Promise<Playbook | null> {
  const playbooks = await getPlaybooks();
  return playbooks.find(p => p.tipoEvento === tipoEvento && p.esPlantillaDefault) ?? null;
}

export async function createPlaybook(
  data: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
  try {
    const playbooks = await getPlaybooks();
    const now = new Date().toISOString();
    const newPlaybook: Playbook = {
      ...data,
      id: `pb_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    playbooks.push(newPlaybook);
    await writeData(PLAYBOOKS_FILE, playbooks);
    return { success: true, playbook: newPlaybook };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function updatePlaybook(
  id: string,
  data: Partial<Omit<Playbook, 'id' | 'createdAt'>>
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
  try {
    const playbooks = await getPlaybooks();
    const index = playbooks.findIndex(p => p.id === id);
    if (index === -1) return { success: false, error: 'Playbook no encontrado.' };
    playbooks[index] = { ...playbooks[index], ...data, updatedAt: new Date().toISOString() };
    await writeData(PLAYBOOKS_FILE, playbooks);
    return { success: true, playbook: playbooks[index] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deletePlaybook(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const playbooks = await getPlaybooks();
    const filtered = playbooks.filter(p => p.id !== id);
    if (filtered.length === playbooks.length) return { success: false, error: 'Playbook no encontrado.' };
    await writeData(PLAYBOOKS_FILE, filtered);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function applyPlaybookToFiesta(
  playbookId: string,
  fiestaId: string,
  userId: string
): Promise<{ success: boolean; tareasGeneradas: number; documentosGenerados: number; error?: string }> {
  try {
    const [playbook, fiesta] = await Promise.all([
      getPlaybookById(playbookId),
      getFiestaById(fiestaId),
    ]);

    if (!playbook) return { success: false, tareasGeneradas: 0, documentosGenerados: 0, error: 'Playbook no encontrado.' };
    if (!fiesta) return { success: false, tareasGeneradas: 0, documentosGenerados: 0, error: 'Evento no encontrado.' };

    const fechaEvento = fiesta.configuracion?.fechaEvento
      ? new Date(fiesta.configuracion.fechaEvento)
      : null;

    const tareasExistentes = fiesta.tareas ?? [];

    const nuevasTareas: Tarea[] = playbook.tareas.map((tpl: PlaybookTarea) => {
      let fechaLimite: string | undefined;
      if (fechaEvento && tpl.diasAntesEvento !== undefined) {
        const d = new Date(fechaEvento);
        d.setDate(d.getDate() + tpl.diasAntesEvento);
        fechaLimite = d.toISOString().split('T')[0];
      }
      return {
        id: `tarea_pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        texto: tpl.titulo,
        descripcion: tpl.descripcion,
        completada: false,
        fechaLimite,
        esPredeterminada: false,
      };
    });

    const updatedFiesta = {
      ...fiesta,
      tareas: [...tareasExistentes, ...nuevasTareas],
    };

    const saveResult = await saveFiesta(updatedFiesta);
    if (!saveResult.success) {
      return { success: false, tareasGeneradas: 0, documentosGenerados: 0, error: saveResult.error };
    }

    const aplicaciones = await getPlaybookAplicaciones();
    const aplicacion: PlaybookAplicacion = {
      id: `aplic_${Date.now()}`,
      playbookId,
      fiestaId,
      aplicadoEn: new Date().toISOString(),
      aplicadoPor: userId,
      tareasGeneradas: nuevasTareas.length,
      documentosGenerados: playbook.documentos.length,
    };
    aplicaciones.push(aplicacion);
    await writeData(APLICACIONES_FILE, aplicaciones);

    return { success: true, tareasGeneradas: nuevasTareas.length, documentosGenerados: playbook.documentos.length };
  } catch (error) {
    return { success: false, tareasGeneradas: 0, documentosGenerados: 0, error: String(error) };
  }
}

export async function getPlaybookAplicaciones(): Promise<PlaybookAplicacion[]> {
  return readData<PlaybookAplicacion[]>(APLICACIONES_FILE, []);
}
