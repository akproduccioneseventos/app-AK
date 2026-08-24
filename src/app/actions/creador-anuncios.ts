'use server';

import { createHash } from 'node:crypto';
import { getPublicWhatsAppNumber } from '@/app/actions/whatsapp';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermiso } from '@/lib/auth/require-session';
import { readData, writeData } from '@/lib/data-service';
import { generarAnuncioCompleto } from '@/lib/marketing/creador-anuncios-ia';
import { auditarAnuncioConIA } from '@/lib/marketing/auditor-anuncios-ia';
import { AK_WHATSAPP_NUMBER } from '@/lib/public-contact';
import type {
  AnuncioGenerado,
  AuditoriaAnuncio,
  ObjetivoAnuncio,
  TipoEventoAnuncio,
  TonoAnuncio,
} from '@/lib/marketing/creador-anuncios-tipos';

const TIPOS_EVENTO: TipoEventoAnuncio[] = ['15_anos', 'bodas', 'cumpleanos', 'empresarial', 'promocion_temporada'];
const OBJETIVOS: ObjetivoAnuncio[] = ['whatsapp', 'simulador', 'reunion'];
const TONOS: TonoAnuncio[] = ['emocional_familiar', 'divertido_fiesta', 'elegante_premium', 'urgencia_oferta'];

function textoSeguro(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || undefined;
}

function getAdsFileForUser(user: { userId?: string; email?: string }): { ok: true; file: string } | { ok: false; error: string } {
  const ownerId = user.userId || user.email?.trim().toLowerCase();
  if (!ownerId) return { ok: false, error: 'No se pudo identificar al usuario actual.' };

  const ownerHash = createHash('sha256').update(ownerId).digest('hex').slice(0, 20);
  return { ok: true, file: `anuncios-guardados-${ownerHash}.json` };
}

function isValidSavedAd(value: unknown): value is AnuncioGenerado {
  if (!value || typeof value !== 'object') return false;
  const ad = value as Partial<AnuncioGenerado>;
  if (!ad.id || !/^ad_[a-zA-Z0-9_-]{1,80}$/.test(ad.id)) return false;
  if (!TIPOS_EVENTO.includes(ad.tipoEvento as TipoEventoAnuncio)) return false;
  if (!OBJETIVOS.includes(ad.objetivo as ObjetivoAnuncio)) return false;
  if (!TONOS.includes(ad.tono as TonoAnuncio)) return false;
  if (!ad.tituloGancho || ad.tituloGancho.length > 300) return false;
  if (!ad.textoPrincipal || ad.textoPrincipal.length > 10_000) return false;
  if (!ad.enlaceDestino || !/^https:\/\/(akproducciones\.uy|wa\.me|www\.instagram\.com)\//.test(ad.enlaceDestino)) return false;
  if (!ad.creadoEn || Number.isNaN(Date.parse(ad.creadoEn))) return false;

  try {
    return JSON.stringify(ad).length <= 100_000;
  } catch {
    return false;
  }
}

import { getMetaAdsSummary } from '@/lib/marketing/meta-ads';
import { loadMetaCommercialMetrics } from '@/lib/marketing/meta-commercial-metrics';
import type { SocialPost } from '@/types/social-media';

export async function generarNuevoAnuncio(params: {
  tipoEvento: TipoEventoAnuncio;
  objetivo: ObjetivoAnuncio;
  tono: TonoAnuncio;
  beneficioDestacado?: string;
  descuentoTexto?: string;
}): Promise<{ success: boolean; anuncio?: AnuncioGenerado; error?: string }> {
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return { success: false, error: auth.error };
    const adsFile = getAdsFileForUser(auth.user);
    if (!adsFile.ok) return { success: false, error: adsFile.error };
    if (!TIPOS_EVENTO.includes(params.tipoEvento) || !OBJETIVOS.includes(params.objetivo) || !TONOS.includes(params.tono)) {
      return { success: false, error: 'Los datos del anuncio no son validos.' };
    }

    const configuredPhone = (await getPublicWhatsAppNumber()).replace(/\D/g, '');

    // Cargar en paralelo métricas de Meta, fotos reales, testimonios y servicios del catálogo
    const [metaMetrics, catalogoFotos, testimonials, servicios] = await Promise.all([
      loadMetaCommercialMetrics().catch(() => null),
      readData<any[]>('catalogo-fotos.json', []).catch(() => []),
      readData<any[]>('testimonials.json', []).catch(() => []),
      readData<any[]>('servicios-empresa.json', []).catch(() => []),
    ]);

    const metaSummary = metaMetrics ? await getMetaAdsSummary(metaMetrics).catch(() => null) : null;

    const anuncio = generarAnuncioCompleto({
      tipoEvento: params.tipoEvento,
      objetivo: params.objetivo,
      tono: params.tono,
      beneficioDestacado: textoSeguro(params.beneficioDestacado, 300),
      descuentoTexto: textoSeguro(params.descuentoTexto, 300),
      contactoWhatsApp: configuredPhone || AK_WHATSAPP_NUMBER,
      metaSummary,
      catalogServices: Array.isArray(servicios) ? servicios : [],
      realPhotos: Array.isArray(catalogoFotos) ? catalogoFotos : [],
      testimonials: Array.isArray(testimonials) ? testimonials : [],
    });
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
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return { success: false, error: auth.error };
    const adsFile = getAdsFileForUser(auth.user);
    if (!adsFile.ok) return { success: false, error: adsFile.error };
    const textoAnuncio = textoSeguro(params.textoAnuncio, 15_000);
    if (!textoAnuncio || textoAnuncio.length < 15) {
      return { success: false, error: 'Por favor ingresá un texto de al menos 15 caracteres para auditar.' };
    }
    const plataformas = ['instagram', 'facebook', 'tiktok', 'otra'] as const;
    const objetivos = ['leads', 'mensajes_wpp', 'visitas_web'] as const;
    if (params.plataforma && !plataformas.includes(params.plataforma)) {
      return { success: false, error: 'La plataforma seleccionada no es valida.' };
    }
    if (params.objetivo && !objetivos.includes(params.objetivo)) {
      return { success: false, error: 'El objetivo seleccionado no es valido.' };
    }
    if (params.presupuestoActual !== undefined && (!Number.isFinite(params.presupuestoActual) || params.presupuestoActual < 0)) {
      return { success: false, error: 'El presupuesto debe ser un numero valido.' };
    }
    const auditoria = auditarAnuncioConIA({ ...params, textoAnuncio });
    return { success: true, auditoria };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al auditar el anuncio.' };
  }
}

export async function guardarAnuncio(anuncio: AnuncioGenerado): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return { success: false, error: auth.error };
    const adsFile = getAdsFileForUser(auth.user);
    if (!adsFile.ok) return { success: false, error: adsFile.error };
    if (!isValidSavedAd(anuncio)) return { success: false, error: 'El anuncio recibido no es valido.' };
    const saved = await readData<AnuncioGenerado[]>(adsFile.file, []);
    const exists = saved.some((a) => a.id === anuncio.id);
    const updated = exists ? saved.map((a) => (a.id === anuncio.id ? anuncio : a)) : [anuncio, ...saved];
    await writeData(adsFile.file, updated.slice(0, 500));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al guardar el anuncio.' };
  }
}

export async function getAnunciosGuardados(): Promise<AnuncioGenerado[]> {
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return [];
    const adsFile = getAdsFileForUser(auth.user);
    if (!adsFile.ok) return [];
    return readData<AnuncioGenerado[]>(adsFile.file, []);
  } catch {
    return [];
  }
}

export async function eliminarAnuncioGuardado(anuncioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return { success: false, error: auth.error };
    const adsFile = getAdsFileForUser(auth.user);
    if (!adsFile.ok) return { success: false, error: adsFile.error };
    if (!/^ad_[a-zA-Z0-9_-]{1,80}$/.test(anuncioId)) {
      return { success: false, error: 'El anuncio indicado no es valido.' };
    }
    const saved = await readData<AnuncioGenerado[]>(adsFile.file, []);
    const updated = saved.filter((a) => a.id !== anuncioId);
    await writeData(adsFile.file, updated);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al eliminar el anuncio.' };
  }
}

export async function enviarABorradorDeContenido(anuncio: AnuncioGenerado): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const auth = await requirePermiso(PERMISOS.CRM);
    if (!auth.ok) return { success: false, error: auth.error };
    if (!isValidSavedAd(anuncio)) return { success: false, error: 'El anuncio recibido no es válido.' };

    const POSTS_FILE = 'social-posts.json';
    const existingPosts = await readData<SocialPost[]>(POSTS_FILE, []);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);

    const newPost: SocialPost = {
      id: `draft_ad_${Date.now()}`,
      platform: 'Instagram',
      isGeneralCampaign: true,
      eventName: `Campaña ${anuncio.tipoEvento.replace('_', ' ')}`,
      publishDate: tomorrow.toISOString(),
      text: `${anuncio.tituloGancho}\n\n${anuncio.textoPrincipal}\n\n${anuncio.llamadoAccion}: ${anuncio.enlaceDestino}`,
      mediaUrl: anuncio.fotoRealSugerida?.url || '/media/catalogo-servicios/barra-tragos-ak-01.jpeg',
      mediaType: 'image',
      status: 'Borrador',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    existingPosts.unshift(newPost);
    await writeData(
      POSTS_FILE,
      existingPosts,
      (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );

    return { success: true, postId: newPost.id };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Error al enviar a borrador de redes.' };
  }
}

