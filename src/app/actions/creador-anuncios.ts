'use server';

import { requireAppSession } from '@/lib/auth/require-session';
import { readData, writeData } from '@/lib/data-service';
import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { auditarAnuncioConIA } from '@/lib/marketing/auditor-anuncios-ia';
import type {
  AnuncioGenerado,
  AuditoriaAnuncio,
  ObjetivoAnuncio,
  TipoEventoAnuncio,
  TonoAnuncio,
} from '@/lib/marketing/creador-anuncios-tipos';

const ADS_SAVED_FILE = 'anuncios-guardados.json';

export async function generarNuevoAnuncio(params: {
  tipoEvento: TipoEventoAnuncio;
  objetivo: ObjetivoAnuncio;
  tono: TonoAnuncio;
  beneficioDestacado?: string;
  descuentoTexto?: string;
}): Promise<{ success: boolean; anuncio?: AnuncioGenerado; error?: string }> {
  await requireAppSession();
  try {
    const anuncio = generarAnuncioCompleto(params);
    return { success: true, anuncio };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al generar el anuncio.' };
  }
}

export async function auditarAnuncioAction(params: {
  textoAnuncio: string;
  plataforma?: 'instagram' | 'facebook' | 'tiktok' | 'otra';
  objetivo?: 'leads' | 'mensajes_wpp' | 'visitas_web';
  presupuestoActual?: number;
}): Promise<{ success: boolean; auditoria?: AuditoriaAnuncio; error?: string }> {
  await requireAppSession();
  try {
    if (!params.textoAnuncio || params.textoAnuncio.trim().length < 15) {
      return { success: false, error: 'Por favor ingresá un texto de al menos 15 caracteres para auditar.' };
    }
    const auditoria = auditarAnuncioConIA(params);
    return { success: true, auditoria };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al auditar el anuncio.' };
  }
}

export async function guardarAnuncio(anuncio: AnuncioGenerado): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const saved = await readData<AnuncioGenerado[]>(ADS_SAVED_FILE, []);
    const exists = saved.some((a) => a.id === anuncio.id);
    const updated = exists ? saved.map((a) => (a.id === anuncio.id ? anuncio : a)) : [anuncio, ...saved];
    await writeData(ADS_SAVED_FILE, updated);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al guardar el anuncio.' };
  }
}

export async function getAnunciosGuardados(): Promise<AnuncioGenerado[]> {
  await requireAppSession();
  try {
    return readData<AnuncioGenerado[]>(ADS_SAVED_FILE, []);
  } catch {
    return [];
  }
}

export async function eliminarAnuncioGuardado(anuncioId: string): Promise<{ success: boolean; error?: string }> {
  await requireAppSession();
  try {
    const saved = await readData<AnuncioGenerado[]>(ADS_SAVED_FILE, []);
    const updated = saved.filter((a) => a.id !== anuncioId);
    await writeData(ADS_SAVED_FILE, updated);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al eliminar el anuncio.' };
  }
}

