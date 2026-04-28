'use server';

import { getAllFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { evaluarReglasParaFiesta, evaluarReglasParaTodasLasFiestas } from '@/lib/automatizaciones-engine';
import type { AlertaAutomatica } from '@/types/automatizaciones';
import { readData, writeData } from '@/lib/data-service';
import * as logger from '@/lib/logger';

const ALERTAS_LEIDAS_FILE = 'alertas-leidas.json';
const ALERTAS_DESCARTADAS_FILE = 'alertas-descartadas.json';
const PRIORIDADES_DESCARTADAS_FILE = 'prioridades-descartadas.json';

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
  const [idsLeidos, idsDescartados] = await Promise.all([
    readData<string[]>(ALERTAS_LEIDAS_FILE, []),
    readData<string[]>(ALERTAS_DESCARTADAS_FILE, []),
  ]);
  const idsDescartadosSet = new Set(idsDescartados);

  // Exclude permanently discarded alerts
  const alertasFiltradas = alertasActuales.filter(a => !idsDescartadosSet.has(a.id));

  // Auto-purge: remove ids that no longer correspond to active alerts
  const idsActivos = new Set(alertasFiltradas.map(a => a.id));
  const idsLeidosActivos = idsLeidos.filter(id => idsActivos.has(id));
  if (idsLeidosActivos.length !== idsLeidos.length) {
    await writeData(ALERTAS_LEIDAS_FILE, idsLeidosActivos);
  }
  const idsLeidosSet = new Set(idsLeidosActivos);

  return alertasFiltradas.map(a => ({ ...a, leida: idsLeidosSet.has(a.id) }));
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

/**
 * Permanently discards an alert by adding its ID to a separate file.
 * Discarded alerts are excluded from all future queries.
 */
export async function descartarAlerta(alertaId: string): Promise<{ success: boolean }> {
  try {
    const idsDescartados = await readData<string[]>(ALERTAS_DESCARTADAS_FILE, []);
    if (!idsDescartados.includes(alertaId)) {
      idsDescartados.push(alertaId);
      await writeData(ALERTAS_DESCARTADAS_FILE, idsDescartados);
    }
    // Also mark as read so it doesn't reappear in read-status checks
    await marcarAlertaLeida(alertaId);
    return { success: true };
  } catch (error) {
    logger.error(`[Alertas] Error descartando alerta "${alertaId}":`, error);
    return { success: false };
  }
}

/**
 * Dismisses a dashboard priority (GlobalAlert) by ID, persisting it so it
 * does not reappear on the next page load.
 */
export async function descartarPrioridad(alertaId: string): Promise<{ success: boolean }> {
  try {
    const ids = await readData<string[]>(PRIORIDADES_DESCARTADAS_FILE, []);
    if (!ids.includes(alertaId)) {
      ids.push(alertaId);
      await writeData(PRIORIDADES_DESCARTADAS_FILE, ids);
    }
    return { success: true };
  } catch (error) {
    logger.error(`[Prioridades] Error descartando prioridad "${alertaId}":`, error);
    return { success: false };
  }
}

/** Returns the set of dismissed GlobalAlert IDs. */
export async function getPrioridadesDescartadas(): Promise<Set<string>> {
  const ids = await readData<string[]>(PRIORIDADES_DESCARTADAS_FILE, []);
  return new Set(ids);
}
