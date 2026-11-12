'use server';

import { requirePermiso } from '@/lib/auth/require-session';
import { PERMISOS } from '@/lib/auth/perfiles';
import { mutarDocumento, readGenericJsonFile } from '@/lib/generic-json-store';

const ESTILO_FOTOS_AK_FILE = 'estilo-fotos-ak.json';

export interface ZonaColorNumerica {
  r?: number;
  g?: number;
  b?: number;
  brillo?: number;
  saturacion?: number;
}

export interface EstiloFotosAKNumerico {
  intensidad?: number;
  temperatura?: number;
  contraste?: number;
  exposicion?: number;
  saturacion?: number;
  suavizadoPiel?: number;
  sombras?: ZonaColorNumerica;
  medios?: ZonaColorNumerica;
  altas?: ZonaColorNumerica;
}

export interface EstiloFotosAKCompleto extends EstiloFotosAKNumerico {
  actualizadoEn?: string;
  version?: number | string;
  activo?: boolean;
}

function parsearNumero(val: unknown): number | undefined {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
    return Number(val);
  }
  return undefined;
}

function sanitizarZonaNumerica(zona: unknown): ZonaColorNumerica | undefined {
  if (!zona || typeof zona !== 'object') return undefined;
  const z = zona as Record<string, unknown>;
  const res: ZonaColorNumerica = {};

  const r = parsearNumero(z.r);
  const g = parsearNumero(z.g);
  const b = parsearNumero(z.b);
  const brillo = parsearNumero(z.brillo);
  const saturacion = parsearNumero(z.saturacion);

  if (r !== undefined) res.r = r;
  if (g !== undefined) res.g = g;
  if (b !== undefined) res.b = b;
  if (brillo !== undefined) res.brillo = brillo;
  if (saturacion !== undefined) res.saturacion = saturacion;

  return Object.keys(res).length > 0 ? res : undefined;
}

/**
 * Filtra un objeto de estilo para extraer EXCLUSIVAMENTE los valores numéricos
 * de calibración y color (eliminando cualquier campo de usuario, token, rol o secretos).
 */
function extraerSoloValoresNumericos(raw: unknown): EstiloFotosAKNumerico | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const res: EstiloFotosAKNumerico = {};

  const intensidad = parsearNumero(obj.intensidad);
  const temperatura = parsearNumero(obj.temperatura);
  const contraste = parsearNumero(obj.contraste);
  const exposicion = parsearNumero(obj.exposicion);
  const saturacion = parsearNumero(obj.saturacion);
  const suavizadoPiel = parsearNumero(obj.suavizadoPiel);

  if (intensidad !== undefined) res.intensidad = intensidad;
  if (temperatura !== undefined) res.temperatura = temperatura;
  if (contraste !== undefined) res.contraste = contraste;
  if (exposicion !== undefined) res.exposicion = exposicion;
  if (saturacion !== undefined) res.saturacion = saturacion;
  if (suavizadoPiel !== undefined) res.suavizadoPiel = suavizadoPiel;

  const sombras = sanitizarZonaNumerica(obj.sombras);
  const medios = sanitizarZonaNumerica(obj.medios);
  const altas = sanitizarZonaNumerica(obj.altas);

  if (sombras) res.sombras = sombras;
  if (medios) res.medios = medios;
  if (altas) res.altas = altas;

  return res;
}

/**
 * Guarda el estilo de fotos AK en el almacén de configuración.
 * Exige permiso de administración (solo el dueño/administrador puede cambiarlo).
 */
export async function guardarEstiloFotosAK(
  estiloJson: any,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requirePermiso(PERMISOS.ADMINISTRACION);
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  if (!estiloJson || typeof estiloJson !== 'object') {
    return { success: false, error: 'El archivo de estilo JSON no tiene un formato válido.' };
  }

  const numericos = extraerSoloValoresNumericos(estiloJson) || {};
  const datosAGuardar: EstiloFotosAKCompleto = {
    ...numericos,
    activo: estiloJson.activo !== false,
    version: parsearNumero(estiloJson.version) ?? 1,
    actualizadoEn: new Date().toISOString(),
  };

  await mutarDocumento<EstiloFotosAKCompleto>(
    ESTILO_FOTOS_AK_FILE,
    datosAGuardar,
    () => datosAGuardar,
  );

  return { success: true };
}

/**
 * Obtiene el estilo de fotos AK para las estaciones de entretenimiento y el muro social.
 * Función pública de sólo lectura.
 * Devuelve ÚNICAMENTE los valores numéricos de ajuste/color (sin campos extra ni datos de usuarios).
 */
export async function obtenerEstiloFotosAK(): Promise<EstiloFotosAKNumerico | null> {
  try {
    const raw = await readGenericJsonFile(ESTILO_FOTOS_AK_FILE);
    if (!raw) return null;
    return extraerSoloValoresNumericos(raw);
  } catch {
    return null;
  }
}

/**
 * Obtiene el estado y fecha de última actualización del estilo para el panel de Ajustes.
 */
export async function obtenerEstadoEstiloFotosAK(): Promise<{
  configurado: boolean;
  actualizadoEn?: string;
  estilo: EstiloFotosAKNumerico | null;
}> {
  try {
    const raw = await readGenericJsonFile(ESTILO_FOTOS_AK_FILE);
    if (!raw) return { configurado: false, estilo: null };
    const estilo = extraerSoloValoresNumericos(raw);
    return {
      configurado: Boolean(estilo && Object.keys(estilo).length > 0),
      actualizadoEn: typeof raw.actualizadoEn === 'string' ? raw.actualizadoEn : undefined,
      estilo,
    };
  } catch {
    return { configurado: false, estilo: null };
  }
}
