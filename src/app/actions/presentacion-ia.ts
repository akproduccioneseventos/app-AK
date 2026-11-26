'use server';

import { pedirTexto } from '@/ai/cerebro';
import { getServiciosEmpresaPublicos } from '@/app/actions/servicios-empresa';
import { enforcePublicRateLimit } from '@/lib/commercial/public-rate-limit';
import { hasAppSession } from '@/lib/auth/require-session';

export interface ServicioPresentacionOption {
  id: string;
  nombre: string;
  categoria?: string;
}

export interface ResultadoPresentacionIA {
  ok: boolean;
  accion?: 'agregar' | 'sacar' | 'invitados';
  servicioId?: string;
  servicioNombre?: string;
  cantidad?: number;
  opciones?: Array<{ id: string; nombre: string }>;
  error?: string;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function extraerJsonDeTexto(texto: string): Record<string, unknown> | null {
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

function sugerirOpcionesParecidas(
  frase: string,
  servicios: ServicioPresentacionOption[],
): Array<{ id: string; nombre: string }> {
  const palabras = normalizar(frase)
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !['agrega', 'agregar', 'saca', 'sacar', 'pone', 'poner', 'quita', 'quitar', 'para', 'con', 'los', 'las', 'del', 'una', 'uno'].includes(p));

  if (palabras.length === 0) return [];

  const puntuados = servicios
    .map((s) => {
      const textoServicio = normalizar(`${s.nombre} ${s.categoria || ''}`);
      let puntaje = 0;
      for (const palabra of palabras) {
        if (textoServicio.includes(palabra)) puntaje += 2;
      }
      return { id: s.id, nombre: s.nombre, puntaje };
    })
    .filter((item) => item.puntaje > 0)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 3);

  return puntuados.map(({ id, nombre }) => ({ id, nombre }));
}

/**
 * Interpreta un pedido en lenguaje natural durante la presentación LED
 * (ej. "agregá la fuente de chocolate", "sacá la fotocabina", "poné 150 invitados").
 *
 * Nunca guarda, confirma ni cobra presupuestos: sólo devuelve la intención
 * validada contra el catálogo real de servicios.
 */
export async function interpretarPedidoPresentacionIA(input: {
  frase: string;
  servicios?: ServicioPresentacionOption[];
}): Promise<ResultadoPresentacionIA> {
  // La presentación LED es pública, pero la IA la usa el equipo en la reunión: sin sesión, un desconocido podía gastar el
  // tope diario de IA de la empresa (revisión de la entrega 346-349, 25/11/2026).
  if (!(await hasAppSession())) {
    return { ok: false, error: 'La IA de la reunión la usa el equipo: iniciá sesión para pedirle cambios.' };
  }
  await enforcePublicRateLimit({
    scope: 'presentacion-led-ia',
    limit: 40,
    windowMs: 60_000,
  });

  const frase = (input?.frase || '').trim().slice(0, 400);
  if (!frase) {
    return { ok: false, error: 'Escribí o decí qué querés cambiar.' };
  }

  const serviciosRaw =
    Array.isArray(input?.servicios) && input.servicios.length > 0
      ? input.servicios
      : await getServiciosEmpresaPublicos().catch(() => []);

  const catalogo = serviciosRaw
    .filter((s) => s && typeof s.id === 'string' && typeof s.nombre === 'string')
    .map((s) => ({
      id: s.id,
      nombre: s.nombre,
      ...(s.categoria ? { categoria: s.categoria } : {}),
    }));

  const listadoCatalogo = catalogo
    .map((s) => `- id: "${s.id}" | nombre: "${s.nombre}"${s.categoria ? ` | categoria: "${s.categoria}"` : ''}`)
    .join('\n');

  const prompt = [
    'El vendedor está frente al cliente en la presentación LED de AK Producciones y pidió un cambio en pantalla.',
    'Devolvé ÚNICAMENTE un objeto JSON válido con esta forma:',
    '{"accion": "agregar" | "sacar" | "invitados", "servicioId": string | null, "cantidad": number | null, "opciones": [{"id": string, "nombre": string}]}',
    '',
    'Reglas estrictas:',
    '- Si pide sumar un servicio, accion = "agregar" y servicioId = el id EXACTO del catálogo que mejor coincide.',
    '- Si pide quitar un servicio, accion = "sacar" y servicioId = el id EXACTO del catálogo.',
    '- Si no estás seguro de cuál servicio es o hay varios parecidos, dejá servicioId = null y devolvé 2 o 3 objetos del catálogo en opciones.',
    '- Si pide cambiar la cantidad de invitados, accion = "invitados" y cantidad = número entero positivo.',
    '- Nunca inventes un servicioId que no esté en la lista.',
    '- Nunca guardes, cierres ni cobres presupuestos.',
    '',
    'Catálogo de servicios disponibles:',
    listadoCatalogo || '(sin servicios)',
  ].join('\n');

  const respuesta = await pedirTexto({
    prompt,
    system: 'Sos un asistente de presentación comercial en vivo. Respondé solo con JSON válido.',
    quien: 'presentacion',
    incluirReglas: true,
    datosNoConfiables: { frase },
    maxOutputTokens: 300,
  });

  if (!respuesta.ok) {
    return {
      ok: false,
      error: respuesta.error || 'No se pudo consultar a la IA en este momento.',
    };
  }
  if (!respuesta.texto) {
    return {
      ok: false,
      error: 'No se pudo consultar a la IA en este momento.',
    };
  }

  const parsed = extraerJsonDeTexto(respuesta.texto);
  if (!parsed) {
    return {
      ok: false,
      error: 'No entendí ese pedido. Probá decir el nombre del servicio o la cantidad de invitados.',
    };
  }

  const accion = parsed.accion;
  if (accion !== 'agregar' && accion !== 'sacar' && accion !== 'invitados') {
    return {
      ok: false,
      error: 'No pude identificar si querés agregar, sacar o cambiar invitados.',
    };
  }

  if (accion === 'invitados') {
    const cantidad = Math.round(Number(parsed.cantidad));
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 5000) {
      return {
        ok: false,
        error: 'Indicá una cantidad válida de invitados.',
      };
    }
    return {
      ok: true,
      accion: 'invitados',
      cantidad,
    };
  }

  const opcionesValidas: Array<{ id: string; nombre: string }> = [];
  const vistos = new Set<string>();
  if (Array.isArray(parsed.opciones)) {
    for (const op of parsed.opciones) {
      if (!op || typeof op !== 'object') continue;
      const opId = typeof (op as { id?: unknown }).id === 'string' ? (op as { id: string }).id.trim() : '';
      const encontrado = catalogo.find((s) => s.id === opId);
      if (encontrado && !vistos.has(encontrado.id)) {
        vistos.add(encontrado.id);
        opcionesValidas.push({ id: encontrado.id, nombre: encontrado.nombre });
      }
      if (opcionesValidas.length >= 3) break;
    }
  }

  const rawServicioId = typeof parsed.servicioId === 'string' ? parsed.servicioId.trim() : '';
  const servicioEncontrado = rawServicioId
    ? catalogo.find((s) => s.id === rawServicioId)
    : undefined;

  if (servicioEncontrado) {
    return {
      ok: true,
      accion,
      servicioId: servicioEncontrado.id,
      servicioNombre: servicioEncontrado.nombre,
      ...(opcionesValidas.length > 0 ? { opciones: opcionesValidas } : {}),
    };
  }

  const opcionesFinales =
    opcionesValidas.length > 0 ? opcionesValidas : sugerirOpcionesParecidas(frase, catalogo);

  return {
    ok: true,
    accion,
    opciones: opcionesFinales,
  };
}
