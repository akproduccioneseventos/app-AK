'use server';

import { readData, writeData } from '@/lib/data-service';
import { getCatalogBySlug } from '@/data/event-catalogs';
import type { CatalogoSettings, CatalogoSettingsMap, PresentacionLedSettings } from '@/types/contenido-publico';
import { DEFAULT_CATALOGO_PRESENTACION_TEXT, DEFAULT_CATALOGO_POR_QUE_TEXT } from '@/lib/public-content-defaults';

const PRESENTACION_LED_SETTINGS_FILE = 'presentacion-led-settings.json';
const CATALOGO_SETTINGS_FILE = 'catalogo-settings.json';

const DEFAULT_PRESENTACION_LED_SETTINGS: PresentacionLedSettings = {
  portada: {
    tituloPrincipal: 'AK Producciones',
    subtitulo: 'Tu evento soñado, hecho realidad',
    imagenFondoUrl: '',
    colorAcento: 'from-indigo-500 to-emerald-500',
  },
  porQueElegirnos: {
    beneficios: [
      { emoji: '🛡️', texto: 'Un solo proveedor para coordinar todo el evento.' },
      { emoji: '⏱️', texto: 'Puntualidad garantizada en cada etapa.' },
      { emoji: '🎧', texto: 'Atención personalizada antes, durante y después.' },
      { emoji: '⭐', texto: 'Calidad premium en servicios y ejecución.' },
      { emoji: '⚡', texto: 'Resolución inmediata ante cualquier imprevisto.' },
      { emoji: '❤️', texto: 'Experiencia que emociona y se recuerda.' },
    ],
    imagenLateralUrl: '',
  },
  salon: {
    titulo: 'Nuestro Salón',
    descripcion: 'Un espacio pensado para celebrar con comodidad, estilo y soporte integral.',
    fotos: [],
  },
  cierre: {
    titulo: 'Contratarnos',
    mensaje: 'Estamos listos para hacer de tu celebración un recuerdo imborrable.',
    ctaTexto: 'Generar Presupuesto Manual',
    ctaAccion: 'generar-presupuesto',
  },
};

function buildDefaultCatalogSettings(tipo: string): CatalogoSettings {
  const catalog = getCatalogBySlug(tipo);
  if (!catalog) {
    return {
      hero: { titulo: '', subtitulo: '', imagenFondoUrl: '', color: 'amber' },
      galeria: [],
      testimonios: [],
      textoPresentacion: DEFAULT_CATALOGO_PRESENTACION_TEXT,
      textoPorQueElegirnos: DEFAULT_CATALOGO_POR_QUE_TEXT,
    };
  }

  return {
    hero: {
      titulo: catalog.hero.headline,
      subtitulo: catalog.hero.subheadline,
      imagenFondoUrl: '',
      color: catalog.hero.accentColor,
    },
    galeria: catalog.gallery.map((item) => ({ url: item.src, alt: item.alt })),
    testimonios: catalog.testimonials.map((t) => t.text),
    textoPresentacion: DEFAULT_CATALOGO_PRESENTACION_TEXT,
    textoPorQueElegirnos: DEFAULT_CATALOGO_POR_QUE_TEXT,
  };
}

function mergeCatalogSettings(base: CatalogoSettings, override: Partial<CatalogoSettings> | undefined): CatalogoSettings {
  if (!override) return base;
  return {
    hero: {
      ...base.hero,
      ...(override.hero || {}),
    },
    galeria: Array.isArray(override.galeria) && override.galeria.length > 0 ? override.galeria : base.galeria,
    testimonios: Array.isArray(override.testimonios) && override.testimonios.length > 0 ? override.testimonios : base.testimonios,
    textoPresentacion: override.textoPresentacion || base.textoPresentacion,
    textoPorQueElegirnos: override.textoPorQueElegirnos || base.textoPorQueElegirnos,
  };
}

export async function getPresentacionLedSettings(): Promise<PresentacionLedSettings> {
  const settings = await readData<Partial<PresentacionLedSettings>>(PRESENTACION_LED_SETTINGS_FILE, {});
  return {
    portada: { ...DEFAULT_PRESENTACION_LED_SETTINGS.portada, ...(settings.portada || {}) },
    porQueElegirnos: {
      ...DEFAULT_PRESENTACION_LED_SETTINGS.porQueElegirnos,
      ...(settings.porQueElegirnos || {}),
      beneficios: (settings.porQueElegirnos?.beneficios || DEFAULT_PRESENTACION_LED_SETTINGS.porQueElegirnos.beneficios)
        .slice(0, 6),
    },
    salon: { ...DEFAULT_PRESENTACION_LED_SETTINGS.salon, ...(settings.salon || {}) },
    cierre: { ...DEFAULT_PRESENTACION_LED_SETTINGS.cierre, ...(settings.cierre || {}) },
    ledFotosServicios: settings.ledFotosServicios || {},
    ledFotosMenuItems: settings.ledFotosMenuItems || {},
    planPagosImagenUrl: settings.planPagosImagenUrl || '',
  };
}

export async function savePresentacionLedSettings(data: PresentacionLedSettings): Promise<{success: boolean}> {
  const sanitized: PresentacionLedSettings = {
    portada: {
      tituloPrincipal: (data.portada?.tituloPrincipal || '').trim(),
      subtitulo: (data.portada?.subtitulo || '').trim(),
      imagenFondoUrl: (data.portada?.imagenFondoUrl || '').trim(),
      colorAcento: (data.portada?.colorAcento || '').trim() || DEFAULT_PRESENTACION_LED_SETTINGS.portada.colorAcento,
    },
    porQueElegirnos: {
      beneficios: (data.porQueElegirnos?.beneficios || [])
        .map((item) => ({ emoji: (item.emoji || '').trim(), texto: (item.texto || '').trim() }))
        .filter((item) => item.texto)
        .slice(0, 6),
      imagenLateralUrl: (data.porQueElegirnos?.imagenLateralUrl || '').trim(),
    },
    salon: {
      titulo: (data.salon?.titulo || '').trim(),
      descripcion: (data.salon?.descripcion || '').trim(),
      fotos: (data.salon?.fotos || []).map((f) => f.trim()).filter(Boolean),
    },
    cierre: {
      titulo: (data.cierre?.titulo || '').trim(),
      mensaje: (data.cierre?.mensaje || '').trim(),
      ctaTexto: (data.cierre?.ctaTexto || '').trim(),
      ctaAccion: data.cierre?.ctaAccion || 'generar-presupuesto',
    },
    ledFotosServicios: data.ledFotosServicios || {},
    ledFotosMenuItems: data.ledFotosMenuItems || {},
    planPagosImagenUrl: (data.planPagosImagenUrl || '').trim(),
  };

  await writeData(PRESENTACION_LED_SETTINGS_FILE, sanitized);
  return { success: true };
}

export async function getCatalogoSettings(tipo: string): Promise<CatalogoSettings> {
  const map = await readData<CatalogoSettingsMap>(CATALOGO_SETTINGS_FILE, {});
  const key = (tipo || '').trim().toLowerCase();
  const defaults = buildDefaultCatalogSettings(key);
  return mergeCatalogSettings(defaults, map[key]);
}

export async function saveCatalogoSettings(tipo: string, data: CatalogoSettings): Promise<{success: boolean}> {
  const map = await readData<CatalogoSettingsMap>(CATALOGO_SETTINGS_FILE, {});
  const key = (tipo || '').trim().toLowerCase();

  const sanitized: CatalogoSettings = {
    hero: {
      titulo: (data.hero?.titulo || '').trim(),
      subtitulo: (data.hero?.subtitulo || '').trim(),
      imagenFondoUrl: (data.hero?.imagenFondoUrl || '').trim(),
      color: (data.hero?.color || '').trim() || 'amber',
    },
    galeria: (data.galeria || [])
      .map((item) => ({ url: (item.url || '').trim(), alt: (item.alt || '').trim() }))
      .filter((item) => item.url),
    testimonios: (data.testimonios || []).map((t) => t.trim()).filter(Boolean),
    textoPresentacion: (data.textoPresentacion || '').trim(),
    textoPorQueElegirnos: (data.textoPorQueElegirnos || '').trim(),
  };

  await writeData(CATALOGO_SETTINGS_FILE, {
    ...map,
    [key]: sanitized,
  });

  return { success: true };
}
