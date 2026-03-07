
'use server';

import type { FiestaEnPlanificacion, LiveEventState, EntregaCritica, IncidenteEvento } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

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
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const currentState = fiesta.liveState || initialLiveState;
        const newState = updateFn(currentState);

        await saveFiesta({ ...fiesta, liveState: newState });
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleArrival(fiestaId: string, deliveryId: string): Promise<{ success: boolean; error?: string }> {
    return updateLiveState(fiestaId, state => ({
        ...state,
        entregas: state.entregas.map(e => 
            e.id === deliveryId ? { ...e, llego: !e.llego, timestampLlegada: !e.llego ? new Date().toISOString() : undefined } : e
        )
    }));
}

export async function setStaffCheckIn(fiestaId: string, empleadoId: string, arrived: boolean): Promise<{ success: boolean; error?: string }> {
    return updateLiveState(fiestaId, state => ({
        ...state,
        staffCheckIn: {
            ...(state.staffCheckIn || {}),
            [empleadoId]: { llego: arrived, hora: arrived ? new Date().toISOString() : undefined }
        }
    }));
}

export async function notifyClientArrival(fiestaId: string): Promise<{ success: boolean; error?: string }> {
    return updateLiveState(fiestaId, state => ({
        ...state,
        llegadaProtagonistas: {
            ...state.llegadaProtagonistas,
            enCamino: true,
            timestampAviso: new Date().toISOString()
        }
    }));
}

export async function confirmProtagonistArrival(fiestaId: string): Promise<{ success: boolean; error?: string }> {
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
    return updateLiveState(fiestaId, state => ({
        ...state,
        llegadaProtagonistas: {
            enCamino: false,
            confirmado: false
        }
    }));
}

export async function addIncidente(fiestaId: string, descripcion: string): Promise<{ success: boolean; error?: string }> {
    return updateLiveState(fiestaId, state => ({
        ...state,
        incidentes: [
            ...(state.incidentes || []),
            { id: `inc_${Date.now()}`, hora: new Date().toISOString(), descripcion, resuelto: false }
        ]
    }));
}

export async function resolveIncidente(fiestaId: string, incidenteId: string): Promise<{ success: boolean; error?: string }> {
    return updateLiveState(fiestaId, state => ({
        ...state,
        incidentes: (state.incidentes || []).map(i => i.id === incidenteId ? { ...i, resuelto: true } : i)
    }));
}
