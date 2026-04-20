'use server';

import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { evaluarReglasParaFiesta, evaluarReglasParaTodasLasFiestas } from '@/lib/automatizaciones-engine';
import type { AlertaAutomatica } from '@/types/automatizaciones';
import { readData, writeData } from '@/lib/data-service';
import * as logger from '@/lib/logger';

const ALERTAS_LEIDAS_FILE = 'alertas-leidas.json';

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

export async function marcarAlertaLeida(alertaId: string): Promise<{ success: boolean }> {
  try {
    const idsLeidos = await readData<string[]>(ALERTAS_LEIDAS_FILE, []);
    if (!idsLeidos.includes(alertaId)) {
      idsLeidos.push(alertaId);
      await writeData(ALERTAS_LEIDAS_FILE, idsLeidos);
    }
    return { success: true };
  } catch (error) {
    logger.error(`[Alertas] Error marcando alerta "${alertaId}" como leída:`, error);
    return { success: false };
  }
}

export async function marcarTodasLeidas(): Promise<{ success: boolean }> {
  try {
    const alertas = await getAlertasGlobales();
    const todosIds = alertas.map(a => a.id);
    await writeData(ALERTAS_LEIDAS_FILE, todosIds);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getAlertasGlobalesConLeidas(): Promise<AlertaAutomatica[]> {
  const alertasActuales = await getAlertasGlobales();
  const idsLeidos = await readData<string[]>(ALERTAS_LEIDAS_FILE, []);

  // Auto-purge: remove ids that no longer correspond to active alerts
  const idsActivos = new Set(alertasActuales.map(a => a.id));
  const idsLeidosActivos = idsLeidos.filter(id => idsActivos.has(id));
  if (idsLeidosActivos.length !== idsLeidos.length) {
    await writeData(ALERTAS_LEIDAS_FILE, idsLeidosActivos);
  }

  return alertasActuales.map(a => ({ ...a, leida: Boolean(idsLeidosActivos.includes(a.id)) }));
}

export async function resetAlertasLeidas(): Promise<{ success: boolean }> {
  try {
    await writeData(ALERTAS_LEIDAS_FILE, []);
    return { success: true };
  } catch (error) {
    logger.error('[Alertas] Error reseteando alertas leídas:', error);
    return { success: false };
  }
}

export async function getAlertasNoLeidas(): Promise<AlertaAutomatica[]> {
  const todas = await getAlertasGlobalesConLeidas();
  return todas.filter(a => !a.leida);
}
