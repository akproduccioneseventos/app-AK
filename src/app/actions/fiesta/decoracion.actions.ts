
'use server';

import type { FiestaEnPlanificacion, DecoracionData, MoodboardItem } from '@/types/fiesta';
import { getFiestaById, saveFiesta } from './fiesta.actions';

export async function updateDecoracion(fiestaId: string, decoracion: DecoracionData): Promise<{ success: boolean; updatedData?: DecoracionData; error?: string }> {
  try {
    const currentData = await getFiestaById(fiestaId);
    if (!currentData) throw new Error("Fiesta no encontrada");
    const updatedData = { ...currentData, decoracion };
    const result = await saveFiesta(updatedData);
    if (!result.success) throw new Error(result.error);
    return { success: true, updatedData: result.fiesta?.decoracion };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addMoodboardItem(fiestaId: string, url: string, description?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = decoracion.moodboardItems || [];

        const newItem: MoodboardItem = {
            id: `mood_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            url,
            description,
            likedByClient: false,
            uploadedBy: 'Organizador',
            timestamp: new Date().toISOString()
        };

        const updatedDecoracion = { ...decoracion, moodboardItems: [...items, newItem] };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deleteMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).filter(i => i.id !== itemId);

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleLikeMoodboardItem(fiestaId: string, itemId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const fiesta = await getFiestaById(fiestaId);
        if (!fiesta) throw new Error("Fiesta no encontrada");

        const decoracion = fiesta.decoracion || {};
        const items = (decoracion.moodboardItems || []).map(i => 
            i.id === itemId ? { ...i, likedByClient: !i.likedByClient } : i
        );

        const updatedDecoracion = { ...decoracion, moodboardItems: items };
        await updateDecoracion(fiestaId, updatedDecoracion);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
