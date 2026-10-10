'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
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
  ejecutarVigilantePublicidad,
} from '@/lib/agentes/motor-agentes';
import type { AgenteId, ConfiguracionAgente, RegistroEjecucionAgente } from '@/lib/agentes/tipos';

/**
 * Los agentes son de la dirección (Codex, auditoría 86): prenderlos, apagarlos o correrlos cambia lo
 * que la app hace sola para todo el negocio, y su historial trae saldos y cobros. Antes alcanzaba
 * con tener sesión, y el personal podía apagar el cobrador.
 */
export async function getAgentesConfig(): Promise<ConfiguracionAgente[]> {
  if (!(await requirePermiso(PERMISOS.ADMINISTRACION)).ok) return [];
  return getConfiguracionAgentes();
}

export async function toggleAgente(
  agenteId: AgenteId,
  activo: boolean,
): Promise<{ success: boolean; config?: ConfiguracionAgente[]; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
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
  if (!(await requirePermiso(PERMISOS.ADMINISTRACION)).ok) return [];
  return getHistorialEjecuciones();
}

export async function ejecutarAgenteManual(
  agenteId: AgenteId,
): Promise<{ success: boolean; registro?: RegistroEjecucionAgente; error?: string }> {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return { success: false, error: permiso.error };
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
      case 'vigilante_publicidad':
        registro = await ejecutarVigilantePublicidad();
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
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) return { success: false, registros: [], error: permiso.error };
  try {
    const registros = await ejecutarAgentesAutonomos(new Date(), { ignorarIntervalo: true });
    return { success: true, registros };
  } catch (error: any) {
    return { success: false, registros: [], error: error?.message || 'Error al ejecutar agentes.' };
  }
}

