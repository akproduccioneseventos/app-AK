'use server';

import { requirePermiso, requirePermisoAlguno } from '@/lib/auth/require-session';
import { perfilDe, esPerfilValido, PERMISOS } from '@/lib/auth/perfiles';
import { verifySession } from '@/lib/auth/session-token';

const PERMISOS_EQUIPO = [
  PERMISOS.ADMINISTRACION,
  PERMISOS.CONTABILIDAD,
  PERMISOS.CRM,
  PERMISOS.ORGANIZACION,
  PERMISOS.INSUMOS,
  PERMISOS.NOCHE,
] as const;
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

    if (session.user?.perfil !== undefined && session.user?.perfil !== null && String(session.user.perfil) !== '') {
    if (!esPerfilValido(session.user.perfil)) {
      return { success: false, error: 'Tu usuario tiene un perfil que no existe. Pedile al dueño que lo corrija.' };
    }
  }
  await requirePermisoAlguno(...PERMISOS_EQUIPO);

  const usuarioNombre = session.user?.email || 'Equipo AK';
  // Sólo el dueño ve todas las propuestas (plata, lo que pregunta cada cliente). Antes decía
  // "|| true" y cualquiera del equipo las veía todas.
  const esDuenio = perfilDe(session.user) === 'dueno';
  const puedeVerPlata = esDuenio || Boolean((session.user as any)?.perfil && (await import('@/lib/auth/perfiles')).puede(session.user, PERMISOS.CONTABILIDAD)) || Boolean((await import('@/lib/auth/perfiles')).puede(session.user, PERMISOS.ADMINISTRACION));

  try {
    const propuestas = await getPropuestasParaUsuario(usuarioNombre, esDuenio, area, {
      puedeVerPlata,
      perfil: (session.user as any)?.perfil,
    });
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
    if (session.user?.perfil !== undefined && session.user?.perfil !== null && String(session.user.perfil) !== '') {
    if (!esPerfilValido(session.user.perfil)) {
      return { success: false, mensaje: 'Tu usuario tiene un perfil que no existe. Pedile al dueño que lo corrija.' };
    }
  }
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
  } catch (err: any) {
    return { success: false, mensaje: err?.message || 'No autorizado' };
  }
  const usuarioNombre = session.user?.email || 'Equipo AK';

  try {
    const res = await aceptarPropuesta(propuestaId, usuarioNombre, { esDuenio: perfilDe(session.user) === 'dueno' });
    return res;
  } catch (err: any) {
    return { success: false, mensaje: err.message };
  }
}

export async function posponerPropuestaAction(propuestaId: string) {
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
    const res = await posponerPropuesta(propuestaId);
    if (!res.ok) {
      return { success: false, error: res.error || 'No se pudo posponer la propuesta.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function descartarPropuestaAction(propuestaId: string) {
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
    const res = await descartarNoAvisarMas(propuestaId);
    if (!res.ok) {
      return { success: false, error: res.error || 'No se pudo descartar la propuesta.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function tomarPropuestaAction(propuestaId: string) {
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
    const session = await verifySession();
    const usuarioNombre = (session.success && session.user?.email) || 'Equipo AK';
    const res = await tomarPropuesta(propuestaId, usuarioNombre);
    if (!res.ok) {
      return { success: false, error: res.error || 'No se pudo tomar la propuesta.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function marcarResumenVistoAction(id: string) {
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
    await marcarResumenMientrasNoEstabasVisto(id);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function guardarMetaMesAction(metasMes: string) {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) {
    return { success: false, error: permiso.error };
  }
  try {
    await saveAsistenteSettings({ metasMes });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSettingsAsistenteAction() {
  try {
    await requirePermisoAlguno(...PERMISOS_EQUIPO);
    const settings = await getAsistenteSettings();
    const reglas = await getReglasAprendidas();
    return { success: true, settings, reglas };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveSettingsAsistenteAction(settings: Partial<AsistenteSettings>) {
  // Estos ajustes deciden a qué número le llegan los avisos del dueño y quién le puede hablar a la
  // app por WhatsApp: los cambia administración, no cualquiera con sesión (3/10/2026).
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) {
    return { success: false, error: permiso.error };
  }
  try {
    const updated = await saveAsistenteSettings(settings);
    return { success: true, settings: updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function eliminarReglaAprendidaAction(reglaId: string) {
  const permiso = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!permiso.ok) {
    return { success: false, error: permiso.error };
  }
  try {
    const res = await desestimarReglaAprendida(reglaId);
    if (!res.ok) {
      return { success: false, error: res.error || 'Regla no encontrada.' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
