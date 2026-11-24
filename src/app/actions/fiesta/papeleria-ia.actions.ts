'use server';

import { getMenuById } from '@/app/actions/menus-catering';
import {
  getCompanyInfo,
  getInvoiceTemplateSettings,
} from '@/app/actions/settings';
import { PERMISOS } from '@/lib/auth/perfiles';
import { requirePermiso } from '@/lib/auth/require-session';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { uploadToStorageWithDownloadToken } from '@/lib/firebase/storage';
import {
  PIEZAS_PAPELERIA_IA,
  disenarPiezaConIA,
  type LayoutFotocabina,
  type ResultadoDisenoPapeleriaIA,
  type TipoPiezaPapeleriaIA,
} from '@/lib/papeleria/disenar-con-ia';
import type {
  PapeleriaIAData,
  PapeleriaIAPieza,
  ProgramaEventoItem,
} from '@/types/fiesta';
import {
  getFiestaById,
  requireFiestaWriteAccess,
  updateFiestaPartial,
} from './fiesta.actions';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function esPiezaValida(pieza: string): pieza is TipoPiezaPapeleriaIA {
  return (PIEZAS_PAPELERIA_IA as readonly string[]).includes(pieza);
}

async function verificarAccesoPapeleria(
  fiestaId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const permiso = await requirePermiso(PERMISOS.ORGANIZACION);
  if (!permiso.ok) {
    return { ok: false, error: permiso.error };
  }
  try {
    await requireFiestaWriteAccess(fiestaId);
    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      error: error?.message || 'No autorizado para modificar este evento.',
    };
  }
}

function parsearImagenDataUrl(
  value: string,
): { buffer: Buffer; contentType: string; extension: 'png' | 'jpg' | 'webp' } | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const match = raw.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=_-]+)$/i);
  const base64 = (match?.[2] || raw).replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/=_-]+$/.test(base64)) return null;

  let contentType = match?.[1]?.toLowerCase() || '';
  if (contentType === 'image/jpg') contentType = 'image/jpeg';
  if (!contentType) {
    if (base64.startsWith('iVBORw0KGgo')) contentType = 'image/png';
    else if (base64.startsWith('/9j/')) contentType = 'image/jpeg';
    else if (base64.startsWith('UklGR')) contentType = 'image/webp';
    else contentType = 'image/png';
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  const extension =
    contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/webp' ? 'webp' : 'png';

  return { buffer, contentType, extension };
}

export interface DisenarPapeleriaConIAInput {
  fiestaId: string;
  pieza: TipoPiezaPapeleriaIA;
  platosMenu?: Array<{
    nombre: string;
    categoria?: string;
    type?: string;
    imageUrl?: string;
  }>;
  itemsItinerario?: ProgramaEventoItem[];
  whatsappAjustes?: string;
  logoUrl?: string | null;
  printLayout?: LayoutFotocabina;
}

export async function disenarPapeleriaConIAAction(
  input: DisenarPapeleriaConIAInput,
): Promise<ResultadoDisenoPapeleriaIA> {
  if (!input?.fiestaId || !esPiezaValida(input.pieza)) {
    return {
      ok: false,
      error: 'Faltan datos válidos de la fiesta o de la pieza de papelería.',
      intentos: 0,
    };
  }

  const acceso = await verificarAccesoPapeleria(input.fiestaId);
  if (!acceso.ok) {
    return { ok: false, error: acceso.error, intentos: 0 };
  }

  const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { ok: false, error: 'Fiesta no encontrada.', intentos: 0 };
  }

  let platosMenu = input.platosMenu;
  if (input.pieza === 'menuMesa' && !platosMenu && fiesta.menuAsignadoId) {
    const menuAsignado = await getMenuById(fiesta.menuAsignadoId).catch(() => null);
    if (menuAsignado?.items?.length) {
      platosMenu = menuAsignado.items.map((item) => ({
        nombre: item.name,
        categoria: item.type,
        type: item.type,
        imageUrl: item.imageUrl,
      }));
    }
  }

  const [invoiceSettings, companyInfo] = await Promise.all([
    input.logoUrl === undefined
      ? getInvoiceTemplateSettings().catch(() => null)
      : Promise.resolve(null),
    input.whatsappAjustes === undefined
      ? getCompanyInfo().catch(() => null)
      : Promise.resolve(null),
  ]);

  const logoUrl =
    input.logoUrl !== undefined ? input.logoUrl : (invoiceSettings?.logoUrl ?? null);
  const whatsappAjustes =
    input.whatsappAjustes !== undefined
      ? input.whatsappAjustes
      : companyInfo?.companyContact?.trim() || undefined;

  return disenarPiezaConIA({
    fiesta,
    pieza: input.pieza,
    platosMenu,
    itemsItinerario: input.itemsItinerario,
    whatsappAjustes,
    logoUrl,
    printLayout: input.printLayout,
  });
}

export interface GuardarPapeleriaIAInput {
  fiestaId: string;
  pieza: TipoPiezaPapeleriaIA;
  imageDataUrl: string;
  modelo?: string;
  bajaResolucion?: boolean;
  anchoPx?: number;
  altoPx?: number;
}

export async function guardarPapeleriaIAAction(
  input: GuardarPapeleriaIAInput,
): Promise<{ success: boolean; url?: string; pieza?: PapeleriaIAPieza; error?: string }> {
  if (!input?.fiestaId || !esPiezaValida(input.pieza)) {
    return { success: false, error: 'Pieza o fiesta inválida.' };
  }

  const acceso = await verificarAccesoPapeleria(input.fiestaId);
  if (!acceso.ok) {
    return { success: false, error: acceso.error };
  }

  const imagen = parsearImagenDataUrl(input.imageDataUrl);
  if (!imagen) {
    return { success: false, error: 'La imagen generada no tiene un formato válido.' };
  }

  const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada.' };
  }

  try {
    const storagePath = `papeleria-ia/${input.fiestaId}/${input.pieza}-${Date.now()}.${imagen.extension}`;
    const url = await uploadToStorageWithDownloadToken(
      imagen.buffer,
      storagePath,
      imagen.contentType,
    );

    const nuevaPieza: PapeleriaIAPieza = {
      url,
      creadoEn: new Date().toISOString(),
      ...(input.modelo ? { modelo: input.modelo } : {}),
      ...(input.bajaResolucion !== undefined ? { bajaResolucion: input.bajaResolucion } : {}),
      ...(input.anchoPx !== undefined ? { anchoPx: input.anchoPx } : {}),
      ...(input.altoPx !== undefined ? { altoPx: input.altoPx } : {}),
    };

    const papeleriaIA: PapeleriaIAData = {
      ...(fiesta.papeleriaIA || {}),
      [input.pieza]: nuevaPieza,
    };

    const guardado = await updateFiestaPartial(input.fiestaId, { papeleriaIA });
    if (!guardado.success) {
      return {
        success: false,
        error: guardado.error || 'No se pudo guardar el diseño de papelería en la fiesta.',
      };
    }

    return { success: true, url, pieza: nuevaPieza };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Error al guardar la pieza de papelería.',
    };
  }
}

export async function quitarPapeleriaIAAction(input: {
  fiestaId: string;
  pieza: TipoPiezaPapeleriaIA;
}): Promise<{ success: boolean; error?: string }> {
  if (!input?.fiestaId || !esPiezaValida(input.pieza)) {
    return { success: false, error: 'Pieza o fiesta inválida.' };
  }

  const acceso = await verificarAccesoPapeleria(input.fiestaId);
  if (!acceso.ok) {
    return { success: false, error: acceso.error };
  }

  const fiesta = await getFiestaById(input.fiestaId, LECTURA_COMPLETA);
  if (!fiesta) {
    return { success: false, error: 'Fiesta no encontrada.' };
  }

  const siguientePapeleria: PapeleriaIAData = { ...(fiesta.papeleriaIA || {}) };
  delete siguientePapeleria[input.pieza];

  const guardado = await updateFiestaPartial(input.fiestaId, {
    papeleriaIA: siguientePapeleria,
  });

  if (!guardado.success) {
    return {
      success: false,
      error: guardado.error || 'No se pudo volver a la plantilla original.',
    };
  }

  return { success: true };
}
