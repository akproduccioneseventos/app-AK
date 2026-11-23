import 'server-only';

import { mutateGenericJsonArray, readGenericJsonFile } from '@/lib/generic-json-store';
import { geminiCommercialModel, generateWithGeminiFallback } from '@/ai/genkit';
import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';

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

export async function getCompetenciaEstado(): Promise<CompetenciaEstado> {
  const guardadas = (await readGenericJsonFile(COMPETENCIA_FILE)) as CompetenciaCuenta[] | null;
  if (!guardadas || !Array.isArray(guardadas)) {
    return {
      cuentas: [],
    };
  }
  return {
    cuentas: guardadas,
  };
}

export async function guardarCompetenciaCuentas(cuentas: CompetenciaCuenta[]): Promise<void> {
  await mutateGenericJsonArray<CompetenciaCuenta>(COMPETENCIA_FILE, () => cuentas);
}

export async function sincronizarCompetenciaSemanal(): Promise<void> {
  const estado = await getCompetenciaEstado();
  const cuentasActivas = estado.cuentas.filter((c) => c.activo);
  if (cuentasActivas.length === 0) return;

  const token = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
  const igUserId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.META_PAGE_ID || '';

  const nuevasCuentas = [...estado.cuentas];

  for (let i = 0; i < nuevasCuentas.length; i++) {
    const cuenta = nuevasCuentas[i];
    if (!cuenta.activo) continue;

    try {
      if (!token || !igUserId) {
        cuenta.error = undefined;
        cuenta.ultimaActualizacion = new Date().toISOString();
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
        cuenta.ultimaActualizacion = new Date().toISOString();
      } else {
        cuenta.error = 'Esta cuenta no es de empresa: Instagram no deja verla desde otra aplicación';
      }
    } catch (err: any) {
      cuenta.error = err?.message || 'Error al conectar con Meta';
    }
  }

  await guardarCompetenciaCuentas(nuevasCuentas);
  await generarResumenCompetenciaIA();
}

export async function generarResumenCompetenciaIA(): Promise<string> {
  const estado = await getCompetenciaEstado();
  const cuentas = estado.cuentas;

  if (cuentas.length === 0 || !cuentas.some((c) => c.seguidores > 0 || c.ultimosMedios?.length)) {
    return 'No hay datos suficientes de la competencia para generar un resumen.';
  }

  const reserva = await reservarConsumoIA('decisiones');
  if (!reserva) {
    return 'No hay análisis esta semana';
  }

  try {
    const prompt = `Analizá los siguientes datos de cuentas de la competencia en Instagram y redactá exactamente 3 líneas basadas solo en los datos guardados:
${JSON.stringify(cuentas, null, 2)}`;

    const resp = await generateWithGeminiFallback({
      model: geminiCommercialModel,
      prompt,
    });
    const resText = resp?.text?.trim();
    if (!resText) {
      await reserva.liberar().catch(() => undefined);
      return 'No hay análisis esta semana';
    }
    return resText;
  } catch (err: any) {
    await reserva.liberar().catch(() => undefined);
    return 'No hay análisis esta semana';
  }
}
