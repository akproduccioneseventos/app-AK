'use server';

import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { evaluarReglasParaFiesta, evaluarReglasParaTodasLasFiestas } from '@/lib/automatizaciones-engine';
import type { AlertaAutomatica } from '@/types/automatizaciones';

export async function getAlertasGlobales(): Promise<AlertaAutomatica[]> {
  try {
    const fiestas = await getAllFiestas();
    // Only active (non-archived) fiestas
    const activas = fiestas.filter(f => !f.generadoDesdeHistorico);
    return evaluarReglasParaTodasLasFiestas(activas);
  } catch {
    return [];
  }
}

export async function getAlertasPorFiesta(fiestaId: string): Promise<AlertaAutomatica[]> {
  try {
    const fiestas = await getAllFiestas();
    const fiesta = fiestas.find(f => f.id === fiestaId);
    if (!fiesta) return [];
    return evaluarReglasParaFiesta(fiesta);
  } catch {
    return [];
  }
}

// Alertas leídas are stored in-memory per server restart.
// For persistence, a Firestore collection or JSON file could be used.
const alertasLeidas = new Set<string>();

export async function marcarAlertaLeida(alertaId: string): Promise<{ success: boolean }> {
  alertasLeidas.add(alertaId);
  return { success: true };
}

export async function getAlertasGlobalesConLeidas(): Promise<AlertaAutomatica[]> {
  const alertas = await getAlertasGlobales();
  return alertas.map(a => ({ ...a, leida: alertasLeidas.has(a.id) }));
}
