import 'server-only';

import { mutarDocumento, mutateGenericJsonArray, readGenericJsonFile } from '@/lib/generic-json-store';
import { geminiCommercialModel } from '@/ai/genkit';
import { MODELOS_GEMINI } from '@/ai/modelos';
import { pedirTexto } from '@/ai/cerebro';

export interface CompetenciaCuenta {
  username: string;
  activo: boolean;
  seguidores: number;
  publicacionesCount: number;
  ultimaActualizacion?: string;
  error?: string;
  ultimosMedios?: Array<{
    caption?: string;
    like_count?: number;
    comments_count?: number;
    timestamp?: string;
    media_type?: string;
    permalink?: string;
  }>;
}

export interface CompetenciaEstado {
  cuentas: CompetenciaCuenta[];
  resumenIA?: string;
  actualizadoAt?: string;
}

const COMPETENCIA_FILE = 'marketing-competencia.json';
const COMPETENCIA_RESUMEN_FILE = 'asistente/marketing-competencia-resumen.json';
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

interface CompetenciaResumenGuardado {
  resumenIA?: string;
  actualizadoAt?: string;
}

async function guardarResumenCompetencia(resumenIA: string, actualizadoAt: string): Promise<void> {
  const payload: CompetenciaResumenGuardado = { resumenIA, actualizadoAt };
  if (typeof mutarDocumento === 'function') {
    await mutarDocumento<CompetenciaResumenGuardado>(COMPETENCIA_RESUMEN_FILE, {}, () => payload).catch(() => undefined);
    return;
  }
  // En tests donde solo se mockea readGenericJsonFile / mutateGenericJsonArray
  try {
    const { writeData } = await import('@/lib/data-service');
    await writeData(COMPETENCIA_RESUMEN_FILE, payload).catch(() => undefined);
  } catch {
    // ignore
  }
}

export async function getCompetenciaEstado(): Promise<CompetenciaEstado> {
  const [guardadas, resumenDoc] = await Promise.all([
    readGenericJsonFile(COMPETENCIA_FILE) as Promise<CompetenciaCuenta[] | null>,
    (readGenericJsonFile(COMPETENCIA_RESUMEN_FILE) as Promise<CompetenciaResumenGuardado | null>).catch(() => null),
  ]);
  const cuentas = Array.isArray(guardadas) ? guardadas : [];
  return {
    cuentas,
    ...(resumenDoc?.resumenIA ? { resumenIA: resumenDoc.resumenIA } : {}),
    ...(resumenDoc?.actualizadoAt ? { actualizadoAt: resumenDoc.actualizadoAt } : {}),
  };
}

export async function guardarCompetenciaCuentas(cuentas: CompetenciaCuenta[]): Promise<void> {
  await mutateGenericJsonArray<CompetenciaCuenta>(COMPETENCIA_FILE, () => cuentas);
}

export async function sincronizarCompetenciaSemanal(options?: { forzar?: boolean; ahora?: Date }): Promise<void> {
  const ahora = options?.ahora ?? new Date();
  const ahoraMs = ahora.getTime();
  const estado = await getCompetenciaEstado();
  const cuentasActivas = estado.cuentas.filter((c) => c.activo);
  if (cuentasActivas.length === 0) return;

  if (!options?.forzar) {
    const todasRecientes = cuentasActivas.every((c) => {
      if (!c.ultimaActualizacion) return false;
      const ms = new Date(c.ultimaActualizacion).getTime();
      return Number.isFinite(ms) && ahoraMs - ms < SIETE_DIAS_MS;
    });
    if (todasRecientes && estado.resumenIA) {
      return;
    }
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.META_PAGE_ID || '';

  const nuevasCuentas = [...estado.cuentas];

  for (let i = 0; i < nuevasCuentas.length; i++) {
    const cuenta = nuevasCuentas[i];
    if (!cuenta.activo) continue;

    try {
      if (!token || !igUserId) {
        cuenta.error = undefined;
        cuenta.ultimaActualizacion = ahora.toISOString();
        continue;
      }

      const url = `https://graph.facebook.com/v19.0/${igUserId}?fields=business_discovery.username(${cuenta.username}){followers_count,media_count,media.limit(12){caption,like_count,comments_count,timestamp,media_type,permalink}}&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        const errorMsg = data.error.message || '';
        if (errorMsg.toLowerCase().includes('business discovery') || errorMsg.toLowerCase().includes('not a business') || errorMsg.toLowerCase().includes('creator')) {
          cuenta.error = 'Esta cuenta no es de empresa: Instagram no deja verla desde otra aplicación';
        } else {
          cuenta.error = errorMsg;
        }
        cuenta.ultimaActualizacion = ahora.toISOString();
      } else if (data.business_discovery) {
        const bd = data.business_discovery;
        cuenta.seguidores = bd.followers_count || 0;
        cuenta.publicacionesCount = bd.media_count || 0;
        cuenta.ultimosMedios = (bd.media?.data || []).map((m: any) => ({
          caption: m.caption,
          like_count: m.like_count || 0,
          comments_count: m.comments_count || 0,
          timestamp: m.timestamp,
          media_type: m.media_type,
          permalink: m.permalink,
        }));
        cuenta.error = undefined;
        cuenta.ultimaActualizacion = ahora.toISOString();
      } else {
        cuenta.error = 'Esta cuenta no es de empresa: Instagram no deja verla desde otra aplicación';
        cuenta.ultimaActualizacion = ahora.toISOString();
      }
    } catch (err: any) {
      cuenta.error = err?.message || 'Error al conectar con Meta';
    }
  }

  await guardarCompetenciaCuentas(nuevasCuentas);
  const resumen = await generarResumenCompetenciaIA();
  await guardarResumenCompetencia(resumen, ahora.toISOString());
}

export async function generarResumenCompetenciaIA(): Promise<string> {
  const estado = await getCompetenciaEstado();
  const cuentas = estado.cuentas;

  if (cuentas.length === 0 || !cuentas.some((c) => c.seguidores > 0 || c.ultimosMedios?.length)) {
    return 'No hay datos suficientes de la competencia para generar un resumen.';
  }

  const prompt = `Analizá los siguientes datos de cuentas de la competencia en Instagram y redactá exactamente 3 líneas basadas solo en los datos guardados:
${JSON.stringify(cuentas, null, 2)}`;

  const res = await pedirTexto({
    prompt,
    quien: 'decisiones',
    incluirReglas: false,
    modelos: [geminiCommercialModel, ...MODELOS_GEMINI.texto],
  });
  return res.ok && res.texto ? res.texto : 'No hay análisis esta semana';
}
