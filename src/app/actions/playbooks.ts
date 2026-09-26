'use server';

import type { Playbook, PlaybookAplicacion, PlaybookTarea, PlaybookDocumento, PlaybookCompra } from '@/types/playbook';
import type { TipoEvento } from '@/types/presupuesto';
import type { Tarea, DocumentoRequeridoFiesta, CompraSugeridaFiesta } from '@/types/fiesta';
import { readData, writeData } from '@/lib/data-service';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { requireAppSession } from '@/lib/auth/require-session';
import { verifySession } from '@/lib/auth/session-token';
import { hoyEnUruguay } from '@/lib/utils';

const PLAYBOOKS_FILE = 'playbooks.json';
const APLICACIONES_FILE = 'playbook-aplicaciones.json';

export async function getPlaybooks(): Promise<Playbook[]> {
  await requireAppSession();
  return readData<Playbook[]>(PLAYBOOKS_FILE, []);
}

export async function getPlaybookById(id: string): Promise<Playbook | null> {
  await requireAppSession();
  const playbooks = await getPlaybooks();
  return playbooks.find(p => p.id === id) ?? null;
}

export async function getPlaybookByTipoEvento(tipoEvento: TipoEvento | 'Otro'): Promise<Playbook | null> {
  await requireAppSession();
  const playbooks = await getPlaybooks();
  return playbooks.find(p => p.tipoEvento === tipoEvento) ?? null;
}

export async function savePlaybook(playbook: Playbook): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const playbooks = await getPlaybooks();
    const index = playbooks.findIndex(p => p.id === playbook.id);
    if (index >= 0) {
      playbooks[index] = { ...playbook, updatedAt: new Date().toISOString() };
    } else {
      playbooks.push({
        ...playbook,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await writeData(PLAYBOOKS_FILE, playbooks);
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function createPlaybook(
  data: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; playbook?: Playbook; error?: string }> {
  await requireAppSession();
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
  await requireAppSession();
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
  await requireAppSession();
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
  _userId?: string
): Promise<{
  success: boolean;
  tareasGeneradas: number;
  documentosGenerados: number;
  comprasGeneradas: number;
  historialNoAnotado?: boolean;
  errorHistorial?: string;
  error?: string;
}> {
  await requireAppSession();
  const session = await verifySession();
  if (!session.success || !session.user) {
    return { success: false, tareasGeneradas: 0, documentosGenerados: 0, comprasGeneradas: 0, error: session.error || 'Sesion no autorizada.' };
  }
  const usuarioReal = session.user.email || session.user.userId || 'Usuario autenticado';
  try {
    const [playbook, fiesta] = await Promise.all([
      getPlaybookById(playbookId),
      getFiestaById(fiestaId),
    ]);

    if (!playbook) return { success: false, tareasGeneradas: 0, documentosGenerados: 0, comprasGeneradas: 0, error: 'Playbook no encontrado.' };
    if (!fiesta) return { success: false, tareasGeneradas: 0, documentosGenerados: 0, comprasGeneradas: 0, error: 'Evento no encontrado.' };

    const fechaEvento = fiesta.configuracion?.fechaEvento
      ? new Date(fiesta.configuracion.fechaEvento)
      : null;

    const tareasExistentes = fiesta.tareas ?? [];
    const documentosExistentes = fiesta.documentosRequeridos ?? [];
    const comprasExistentes = fiesta.comprasSugeridas ?? [];

    const nuevasTareas: Tarea[] = (playbook.tareas ?? []).map((tpl: PlaybookTarea) => {
      let fechaLimite: string | undefined;
      if (fechaEvento && tpl.diasAntesEvento !== undefined) {
        const d = new Date(fechaEvento);
        d.setDate(d.getDate() + tpl.diasAntesEvento);
        fechaLimite = hoyEnUruguay(d);
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

    const nuevosDocumentos: DocumentoRequeridoFiesta[] = (playbook.documentos ?? []).map((doc: PlaybookDocumento) => ({
      id: `doc_pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nombre: doc.nombre,
      tipo: doc.tipo,
      obligatorio: Boolean(doc.obligatorio),
      completado: false,
      origen: 'guia',
      playbookId,
      fechaCreacion: new Date().toISOString(),
    }));

    const nuevasCompras: CompraSugeridaFiesta[] = (playbook.compras ?? []).map((compra: PlaybookCompra) => ({
      id: `compra_pb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      nombre: compra.nombre,
      categoria: compra.categoria,
      prioridad: compra.prioridad,
      descripcion: compra.descripcion,
      comprado: false,
      origen: 'guia',
      playbookId,
      fechaCreacion: new Date().toISOString(),
    }));

    const updatedFiesta = {
      ...fiesta,
      tareas: [...tareasExistentes, ...nuevasTareas],
      documentosRequeridos: [...documentosExistentes, ...nuevosDocumentos],
      comprasSugeridas: [...comprasExistentes, ...nuevasCompras],
    };

    const saveResult = await saveFiesta(updatedFiesta);
    if (!saveResult.success) {
      return { success: false, tareasGeneradas: 0, documentosGenerados: 0, comprasGeneradas: 0, error: saveResult.error };
    }

    try {
      const aplicaciones = await getPlaybookAplicaciones();
      const aplicacion: PlaybookAplicacion = {
        id: `aplic_${Date.now()}`,
        playbookId,
        fiestaId,
        aplicadoEn: new Date().toISOString(),
        aplicadoPor: usuarioReal,
        tareasGeneradas: nuevasTareas.length,
        documentosGenerados: nuevosDocumentos.length,
      };
      aplicaciones.push(aplicacion);
      await writeData(APLICACIONES_FILE, aplicaciones);
    } catch (historialError: any) {
      return {
        success: true,
        tareasGeneradas: nuevasTareas.length,
        documentosGenerados: nuevosDocumentos.length,
        comprasGeneradas: nuevasCompras.length,
        historialNoAnotado: true,
        errorHistorial: String(historialError?.message || historialError),
      };
    }

    return {
      success: true,
      tareasGeneradas: nuevasTareas.length,
      documentosGenerados: nuevosDocumentos.length,
      comprasGeneradas: nuevasCompras.length,
    };
  } catch (error) {
    return { success: false, tareasGeneradas: 0, documentosGenerados: 0, comprasGeneradas: 0, error: String(error) };
  }
}

export async function getPlaybookAplicaciones(): Promise<PlaybookAplicacion[]> {
  await requireAppSession();
  return readData<PlaybookAplicacion[]>(APLICACIONES_FILE, []);
}
