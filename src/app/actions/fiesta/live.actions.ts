
'use server';

import type { LiveEventState, CargaOperativaItem } from '@/types/fiesta';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';

import { requireAppSession } from '@/lib/auth/require-session';
import { idDelIntento } from '@/lib/intento-en-servidor';
const initialLiveState: LiveEventState = {
    llegadaProtagonistas: {
        enCamino: false,
        confirmado: false
    },
    entregas: [
        { id: 'cake', nombre: 'Torta Principal', horaEstimada: '21:00', llego: false, proveedor: 'Repostera' },
        { id: 'snacks', nombre: 'Saladitos Valentin', horaEstimada: '20:30', llego: false, proveedor: 'Valentin' },
        { id: 'ice', nombre: 'Carga de Hielo', horaEstimada: '21:00', llego: false, proveedor: 'Proveedor Hielo' }
    ],
    incidentes: [],
    staffCheckIn: {}
};

export async function updateLiveState(fiestaId: string, updateFn: (state: LiveEventState) => LiveEventState): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  return aplicarEstadoEnVivo(fiestaId, updateFn);
}

/** Sin comprobar sesion: uso interno. Igual el guardado de abajo pide permiso. */
async function aplicarEstadoEnVivo(fiestaId: string, updateFn: (state: LiveEventState) => LiveEventState): Promise<{ success: boolean; error?: string }> {
    try {
        // El cambio se aplica sobre el estado en vivo de ESE momento, adentro del turno: dos
        // operadores marcando cosas a la vez (una entrega y una llegada) se guardan las dos.
        const guardado = await actualizarFiesta(fiestaId, (fiesta) => ({
            ...fiesta,
            liveState: updateFn(fiesta.liveState || initialLiveState),
        }));
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo guardar el estado en vivo.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleArrival(fiestaId: string, deliveryId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    return updateLiveState(fiestaId, state => ({
        ...state,
        entregas: state.entregas.map(e => 
            e.id === deliveryId ? { ...e, llego: !e.llego, timestampLlegada: !e.llego ? new Date().toISOString() : undefined } : e
        )
    }));
}

export async function setStaffCheckIn(fiestaId: string, empleadoId: string, arrived: boolean): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    return updateLiveState(fiestaId, state => ({
        ...state,
        staffCheckIn: {
            ...(state.staffCheckIn || {}),
            [empleadoId]: { llego: arrived, hora: arrived ? new Date().toISOString() : undefined }
        }
    }));
}

export async function notifyClientArrival(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    // Publica a proposito: la toca el CLIENTE desde su portal para avisar que va en
    // camino. El guardado de la fiesta que hay debajo si comprueba permiso.
    return aplicarEstadoEnVivo(fiestaId, state => ({
        ...state,
        llegadaProtagonistas: {
            ...state.llegadaProtagonistas,
            enCamino: true,
            timestampAviso: new Date().toISOString()
        }
    }));
}

export async function confirmProtagonistArrival(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    return updateLiveState(fiestaId, state => ({
        ...state,
        llegadaProtagonistas: {
            enCamino: false,
            confirmado: true,
            timestampAviso: state.llegadaProtagonistas.timestampAviso
        }
    }));
}

export async function resetArrivalRadar(fiestaId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    return updateLiveState(fiestaId, state => ({
        ...state,
        llegadaProtagonistas: {
            enCamino: false,
            confirmado: false
        }
    }));
}

export async function addIncidente(fiestaId: string, descripcion: string, opciones?: { idIntento?: string }): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    // Pregunta 58: si la respuesta se perdio y la persona reintenta, el incidente ya esta con ese id.
    const idDeLaPantalla = idDelIntento('inc', opciones?.idIntento);
    return updateLiveState(fiestaId, state => {
        if (idDeLaPantalla && (state.incidentes || []).some((i) => i.id === idDeLaPantalla)) return state;
        return {
            ...state,
            incidentes: [
                ...(state.incidentes || []),
                { id: idDeLaPantalla ?? `inc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, hora: new Date().toISOString(), descripcion, resuelto: false }
            ]
        };
    });
}

export async function resolveIncidente(fiestaId: string, incidenteId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    return updateLiveState(fiestaId, state => ({
        ...state,
        incidentes: (state.incidentes || []).map(i => i.id === incidenteId ? { ...i, resuelto: true } : i)
    }));
}

// --- TOQUE DE ORO 3: LOGÍSTICA INVERSA ---

export async function toggleReturnItem(fiestaId: string, categoryId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
    try {
        // Cambia SOLO el item de la lista de carga que hay en ese momento (por id), adentro del turno.
        const guardado = await actualizarFiesta(fiestaId, (fiesta) => {
            if (!fiesta.listaDeCargaOperativa) throw new Error("Datos logísticos no encontrados.");
            return {
                ...fiesta,
                listaDeCargaOperativa: {
                    ...fiesta.listaDeCargaOperativa,
                    categorias: fiesta.listaDeCargaOperativa.categorias.map(cat =>
                        cat.id !== categoryId ? cat : {
                            ...cat,
                            items: cat.items.map(item =>
                                item.id === itemId ? { ...item, retornado: !item.retornado } : item
                            ),
                        }
                    ),
                },
            };
        }, { soloEquipo: true });
        if (!guardado.success) {
            return { success: false, error: guardado.error || 'No se pudo guardar la lista de carga operativa.' };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
