import 'server-only';

import fs from 'fs/promises';
import path from 'path';
import { leerImagen } from '@/ai/cerebro';
import { hayPresupuestoParaIA } from '@/lib/ai/consumo-servidor';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { TIPOS_FIESTA_GALERIA, type GaleriaFoto } from '@/types/galeria';

export interface ServicioCatalogoMinimo {
  id: string;
  nombre: string;
  categoria?: string;
}

export interface ClasificarFotoOpciones {
  servicios?: ServicioCatalogoMinimo[];
  leerImagenFn?: typeof leerImagen;
  fetchFn?: typeof fetch;
  verificarPresupuesto?: boolean;
}

export interface ResultadoClasificacionFoto {
  actualizada: boolean;
  motivo?:
    | 'clasificada-por-persona'
    | 'sin-presupuesto'
    | 'imagen-no-disponible'
    | 'error-ia'
    | 'confianza-baja'
    | 'sin-coincidencia-valida';
  confianza?: number;
  cambios: Partial<GaleriaFoto>;
  foto: GaleriaFoto;
}

const CONFIANZA_MINIMA = 0.6;
const MAX_IMAGEN_BYTES = 10 * 1024 * 1024;

function inferirMimeTypePorRuta(ruta: string): string {
  const lower = ruta.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

async function cargarImagenComoBase64(
  url: string,
  fetchFn?: typeof fetch,
): Promise<{ imagenBase64: string; mimeType: string } | null> {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;]+);base64,(.+)$/i);
    if (!match) return null;
    return { mimeType: match[1], imagenBase64: match[2] };
  }

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    try {
      const publicRoot = path.resolve(process.cwd(), 'public');
      const rel = trimmed.replace(/^\/+/, '').split('?')[0];
      const fullPath = path.resolve(publicRoot, rel);
      if (!fullPath.startsWith(publicRoot + path.sep)) return null;
      const bytes = await fs.readFile(fullPath);
      if (bytes.byteLength > MAX_IMAGEN_BYTES) return null;
      return {
        imagenBase64: bytes.toString('base64'),
        mimeType: inferirMimeTypePorRuta(fullPath),
      };
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const f = fetchFn || globalThis.fetch;
    if (!f) return null;
    const resp = await f(trimmed, {
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    if (!resp.ok) return null;
    const contentLength = Number(resp.headers.get('content-length') || '0');
    if (contentLength > MAX_IMAGEN_BYTES) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGEN_BYTES) return null;
    const contentType = resp.headers.get('content-type')?.split(';')[0]?.trim() || '';
    const mimeType = contentType.startsWith('image/') ? contentType : inferirMimeTypePorRuta(parsed.pathname);
    return {
      imagenBase64: buffer.toString('base64'),
      mimeType,
    };
  } catch {
    return null;
  }
}

function extraerJsonDeRespuesta(texto: string): Record<string, unknown> | null {
  if (!texto || typeof texto !== 'string') return null;
  const limpio = texto
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();
  const inicio = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (inicio === -1 || fin <= inicio) return null;
  try {
    const parsed = JSON.parse(limpio.slice(inicio, fin + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/**
 * Clasifica una foto de la galería usando el cerebro (`leerImagen`) y valida
 * estrictamente que tanto el servicio como el tipo de fiesta pertenezcan a las
 * listas reales del catálogo. Nunca pisa una clasificación hecha por una persona.
 */
export async function clasificarFotoDeGaleria(
  foto: GaleriaFoto,
  opciones: ClasificarFotoOpciones = {},
): Promise<ResultadoClasificacionFoto> {
  if (foto.clasificadaPor === 'persona') {
    return {
      actualizada: false,
      motivo: 'clasificada-por-persona',
      cambios: {},
      foto,
    };
  }

  const usarLeerImagen = opciones.leerImagenFn || leerImagen;

  if (opciones.verificarPresupuesto !== false) {
    const hayPresupuesto = await hayPresupuestoParaIA().catch(() => false);
    if (!hayPresupuesto) {
      return {
        actualizada: false,
        motivo: 'sin-presupuesto',
        cambios: {},
        foto,
      };
    }
  }

  const servicios = opciones.servicios ?? (await getServiciosEmpresaPublicos().catch(() => []));
  const listaServicios = servicios
    .filter((s) => s && typeof s.id === 'string' && typeof s.nombre === 'string')
    .map((s) => ({ id: s.id, nombre: s.nombre, ...(s.categoria ? { categoria: s.categoria } : {}) }));

  let imagen = await cargarImagenComoBase64(foto.url, opciones.fetchFn);
  if (!imagen) {
    if (!opciones.leerImagenFn) {
      return {
        actualizada: false,
        motivo: 'imagen-no-disponible',
        cambios: {},
        foto,
      };
    }
    imagen = { imagenBase64: '', mimeType: 'image/jpeg' };
  }

  const catalogoTexto = listaServicios
    .map((s) => `- id: "${s.id}" | nombre: "${s.nombre}"${s.categoria ? ` | categoria: "${s.categoria}"` : ''}`)
    .join('\n');
  const tiposTexto = TIPOS_FIESTA_GALERIA.map((t) => `"${t}"`).join(', ');
  const contextoFoto = [
    foto.titulo ? `Título existente: ${foto.titulo}` : '',
    foto.descripcion ? `Descripción existente: ${foto.descripcion}` : '',
    foto.categoria ? `Categoría actual: ${foto.categoria}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = [
    'Analizá esta foto de un evento de AK Producciones (Salto, Uruguay) y clasificala.',
    'Devolvé ÚNICAMENTE un objeto JSON válido con esta forma exacta:',
    '{"servicioId": string | null, "tipoFiesta": string | null, "titulo": string | null, "confianza": number}',
    '',
    'Reglas:',
    '- servicioId debe ser EXACTAMENTE uno de los ids del catálogo listado abajo, o null si ninguno coincide con claridad.',
    `- tipoFiesta debe ser EXACTAMENTE uno de: ${tiposTexto}, o null si no se distingue.`,
    '- titulo: un título corto y descriptivo en español rioplatense (máx. 60 caracteres), o null.',
    '- confianza: número entre 0 y 1 indicando qué tan seguro estás.',
    '',
    'Catálogo de servicios reales:',
    catalogoTexto || '(sin servicios cargados)',
    contextoFoto ? `\nDatos de referencia de la foto (no confiables):\n${contextoFoto}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  let resultadoIA: Awaited<ReturnType<typeof leerImagen>>;
  try {
    resultadoIA = await usarLeerImagen({
      imagenBase64: imagen.imagenBase64,
      mimeType: imagen.mimeType,
      prompt,
      system: 'Sos un clasificador de fotos de eventos. Respondé exclusivamente con JSON válido sin texto adicional.',
      quien: 'galeria',
      maxOutputTokens: 300,
    });
  } catch {
    return {
      actualizada: false,
      motivo: 'error-ia',
      cambios: {},
      foto,
    };
  }

  if (!resultadoIA?.ok || !resultadoIA.texto) {
    return {
      actualizada: false,
      motivo: 'error-ia',
      cambios: {},
      foto,
    };
  }

  const parsed = extraerJsonDeRespuesta(resultadoIA.texto);
  if (!parsed) {
    return {
      actualizada: false,
      motivo: 'error-ia',
      cambios: {},
      foto,
    };
  }

  const confianza = Number(parsed.confianza);
  if (!Number.isFinite(confianza) || confianza < CONFIANZA_MINIMA) {
    return {
      actualizada: false,
      motivo: 'confianza-baja',
      confianza: Number.isFinite(confianza) ? confianza : undefined,
      cambios: {},
      foto,
    };
  }

  const rawServicioId = typeof parsed.servicioId === 'string' ? parsed.servicioId.trim() : '';
  const servicioValido = rawServicioId
    ? listaServicios.find((s) => s.id === rawServicioId)
    : undefined;

  const rawTipoFiesta = typeof parsed.tipoFiesta === 'string' ? parsed.tipoFiesta.trim() : '';
  const tipoFiestaValido = (TIPOS_FIESTA_GALERIA as readonly string[]).includes(rawTipoFiesta)
    ? rawTipoFiesta
    : undefined;

  const rawTitulo = typeof parsed.titulo === 'string' ? parsed.titulo.trim() : '';
  const tituloValido = rawTitulo ? rawTitulo.slice(0, 120) : undefined;

  if (!servicioValido && !tipoFiestaValido) {
    return {
      actualizada: false,
      motivo: 'sin-coincidencia-valida',
      confianza,
      cambios: {},
      foto,
    };
  }

  const cambios: Partial<GaleriaFoto> = {
    clasificadaPor: 'ia',
  };

  if (servicioValido) {
    cambios.servicioId = servicioValido.id;
    if (!foto.servicio) {
      cambios.servicio = servicioValido.nombre;
    }
  }
  if (tipoFiestaValido) {
    cambios.tipoFiesta = tipoFiestaValido;
  }
  if (tituloValido) {
    cambios.tituloIA = tituloValido;
    if (!foto.titulo) {
      cambios.titulo = tituloValido;
    }
  }

  return {
    actualizada: true,
    confianza,
    cambios,
    foto: {
      ...foto,
      ...cambios,
    },
  };
}
