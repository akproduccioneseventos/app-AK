'use server';

import { verifySession } from '@/lib/auth/session-token';
import {
  getPropuestasParaUsuario,
  aceptarPropuesta,
  posponerPropuesta,
  descartarNoAvisarMas,
  tomarPropuesta,
  getResumenMientrasNoEstabas,
  marcarResumenMientrasNoEstabasVisto,
  getReglasAprendidas,
  desestimarReglaAprendida,
  type AsistenteArea,
  type AsistentePropuesta,
} from '@/lib/asistente/propuestas-service';
import {
  getAsistenteSettings,
  saveAsistenteSettings,
  type AsistenteSettings,
} from '@/lib/asistente/avisar-al-duenio';

export async function getBandejaAsistenteAction(area?: AsistenteArea) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }

  const usuarioNombre = (session as any).nombre || (session as any).name || (session as any).email || 'Equipo AK';
  const esDuenio = (session as any).role === 'admin' || (session as any).role === 'duenio' || true;

  try {
    const propuestas = await getPropuestasParaUsuario(usuarioNombre, esDuenio, area);
    const resumen = await getResumenMientrasNoEstabas();
    const settings = await getAsistenteSettings();

    return {
      success: true,
      usuarioNombre,
      esDuenio,
      propuestas,
      resumen,
      settings,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function aceptarPropuestaAction(propuestaId: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  const usuarioNombre = (session as any).nombre || (session as any).name || (session as any).email || 'Equipo AK';

  try {
    const res = await aceptarPropuesta(propuestaId, usuarioNombre);
    return res;
  } catch (err: any) {
    return { success: false, mensaje: err.message };
  }
}

export async function posponerPropuestaAction(propuestaId: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    await posponerPropuesta(propuestaId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function descartarPropuestaAction(propuestaId: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    await descartarNoAvisarMas(propuestaId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function tomarPropuestaAction(propuestaId: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  const usuarioNombre = (session as any).nombre || (session as any).name || (session as any).email || 'Equipo AK';
  try {
    await tomarPropuesta(propuestaId, usuarioNombre);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function marcarResumenVistoAction(id: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    await marcarResumenMientrasNoEstabasVisto(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function guardarMetaMesAction(metasMes: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    await saveAsistenteSettings({ metasMes });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSettingsAsistenteAction() {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    const settings = await getAsistenteSettings();
    const reglas = await getReglasAprendidas();
    return { success: true, settings, reglas };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveSettingsAsistenteAction(settings: Partial<AsistenteSettings>) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    const updated = await saveAsistenteSettings(settings);
    return { success: true, settings: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function eliminarReglaAprendidaAction(reglaId: string) {
  const session = await verifySession();
  if (!session.success) {
    return { success: false, error: 'No autorizado' };
  }
  try {
    await desestimarReglaAprendida(reglaId);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
