import { PAGINAS_PARA_GOOGLE, SITE_URL } from '@/lib/seo/paginas-publicas';
import { marcarCorrida } from '@/lib/automatico/tareas-automaticas';
import type { OrigenDisparo } from '@/lib/automatico/control-concurrencia';

export interface ReporteSaludWeb {
  paginasRevisadas: number;
  estado: 'optimo' | 'atencion';
  resumen: string;
  fecha: string;
  detalles: Array<{
    ruta: string;
    estado: 'ok' | 'revisar';
    mensaje: string;
  }>;
}

const TIEMPO_MAXIMO_MS = 10_000;

type Detalle = ReporteSaludWeb['detalles'][number];

/** Pide de verdad una página pública y mira que abra y tenga título. */
async function revisarPagina(base: string, ruta: string): Promise<{ detalle: Detalle; pudoPedir: boolean }> {
  const controlador = new AbortController();
  const reloj = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS);
  try {
    const respuesta = await fetch(`${base}${ruta}`, { signal: controlador.signal, redirect: 'follow' });
    if (respuesta.status !== 200) {
      return {
        pudoPedir: true,
        detalle: { ruta, estado: 'revisar', mensaje: `No abrió (código ${respuesta.status})` },
      };
    }
    const html = await respuesta.text();
    const titulo = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim();
    if (!titulo) {
      return { pudoPedir: true, detalle: { ruta, estado: 'revisar', mensaje: 'Le falta el título' } };
    }
    return { pudoPedir: true, detalle: { ruta, estado: 'ok', mensaje: 'Abre bien y tiene título' } };
  } catch {
    return { pudoPedir: false, detalle: { ruta, estado: 'revisar', mensaje: 'No contestó a tiempo' } };
  } finally {
    clearTimeout(reloj);
  }
}

/**
 * Tarea automática que revisa la salud de las páginas públicas: pide cada una a la
 * dirección pública y comprueba que abra (200) y tenga título.
 * Nunca inventa posiciones en el buscador. Si no pudo pedir NINGUNA página (sin red),
 * tira un error: no se puede decir que la web está al día sin haberla mirado, y la
 * corrida no se anota como buena.
 */
export async function ejecutarRevisionPosicionamiento(
  ahora: Date = new Date(),
  origen: OrigenDisparo = 'app'
): Promise<ReporteSaludWeb> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || SITE_URL).replace(/\/+$/, '');

  const revisiones = await Promise.all(PAGINAS_PARA_GOOGLE.map((ruta) => revisarPagina(base, ruta)));
  const detalles = revisiones.map((r) => r.detalle);

  if (!revisiones.some((r) => r.pudoPedir)) {
    throw new Error('No se pudo pedir ninguna página de la web (sin conexión). La revisión no se anotó como hecha.');
  }

  const falladas = detalles.filter((d) => d.estado !== 'ok').length;
  const reporte: ReporteSaludWeb = {
    paginasRevisadas: PAGINAS_PARA_GOOGLE.length,
    estado: falladas === 0 ? 'optimo' : 'atencion',
    resumen:
      falladas === 0
        ? `Web pública al día: ${PAGINAS_PARA_GOOGLE.length} páginas abren bien y tienen título`
        : `${falladas} de ${PAGINAS_PARA_GOOGLE.length} páginas tienen problemas: revisalas`,
    fecha: ahora.toISOString(),
    detalles,
  };

  // Registrar marca oficial de corrida
  // no pasa nada si falla: la revisión ya se hizo; sin la marca, sólo se repite antes.
  await marcarCorrida('posicionamiento-diario', ahora, origen).catch(() => {});

  return reporte;
}
