'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import {
  getConfiguracionAgentes,
  guardarConfiguracionAgentes,
  getHistorialEjecuciones,
  ejecutarAgentesAutonomos,
  ejecutarVigilanteFiestas,
  ejecutarPerseguidorPresupuestos,
  ejecutarCobrador,
  ejecutarGeneradorContenido,
  ejecutarVigilanteNoche,
} from '@/lib/agentes/motor-agentes';
import type { AgenteId, ConfiguracionAgente, RegistroEjecucionAgente } from '@/lib/agentes/tipos';

export async function getAgentesConfig(): Promise<ConfiguracionAgente[]> {
  await requireAppSession();
  return getConfiguracionAgentes();
}

export async function toggleAgente(
  agenteId: AgenteId,
  activo: boolean,
): Promise<{ success: boolean; config?: ConfiguracionAgente[]; error?: string }> {
  await requireAppSession();
  try {
    const config = await getConfiguracionAgentes();
    const updated = config.map((a) => (a.id === agenteId ? { ...a, activo } : a));
    await guardarConfiguracionAgentes(updated);
    return { success: true, config: updated };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al cambiar estado del agente.' };
  }
}

export async function getHistorialAgentes(): Promise<RegistroEjecucionAgente[]> {
  await requireAppSession();
  return getHistorialEjecuciones();
}

export async function ejecutarAgenteManual(
  agenteId: AgenteId,
): Promise<{ success: boolean; registro?: RegistroEjecucionAgente; error?: string }> {
  await requireAppSession();
  try {
    let registro: RegistroEjecucionAgente;
    switch (agenteId) {
      case 'vigilante_fiestas':
        registro = await ejecutarVigilanteFiestas();
        break;
      case 'perseguidor_presupuestos':
        registro = await ejecutarPerseguidorPresupuestos();
        break;
      case 'cobrador':
        registro = await ejecutarCobrador();
        break;
      case 'generador_contenido':
        registro = await ejecutarGeneradorContenido();
        break;
      case 'vigilante_noche':
        registro = await ejecutarVigilanteNoche();
        break;
      default:
        throw new Error('Agente no reconocido.');
    }
    return { success: true, registro };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al ejecutar el agente.' };
  }
}

export async function ejecutarTodosLosAgentesManual(): Promise<{
  success: boolean;
  registros: RegistroEjecucionAgente[];
  error?: string;
}> {
  await requireAppSession();
  try {
    const registros = await ejecutarAgentesAutonomos();
    return { success: true, registros };
  } catch (error: any) {
    return { success: false, registros: [], error: error?.message || 'Error al ejecutar agentes.' };
  }
}

