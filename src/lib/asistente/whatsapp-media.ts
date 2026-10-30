import 'server-only';

import { reservarConsumoIA } from '@/lib/ai/consumo-servidor';

export interface MediaWhatsApp {
  mimeType: string;
  base64: string;
}

const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const META_VERSION = /^v\d+\.\d+$/.test(process.env.META_GRAPH_API_VERSION || '')
  ? process.env.META_GRAPH_API_VERSION!
  : 'v23.0';

function metaToken(): string {
  return (process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_API_TOKEN || '').trim();
}

function contenidoCoincide(bytes: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/webp') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (mimeType === 'audio/ogg' || mimeType === 'audio/opus' || mimeType === 'application/ogg') return bytes.toString('ascii', 0, 4) === 'OggS';
  if (mimeType === 'audio/wav') return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WAVE';
  if (mimeType === 'audio/webm') return bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if (mimeType === 'audio/mp4') return bytes.toString('ascii', 4, 8) === 'ftyp';
  if (mimeType === 'audio/mpeg') return bytes.toString('ascii', 0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  if (mimeType === 'audio/aac') return (bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0) || bytes.toString('ascii', 0, 4) === 'ADIF';
  return false;
}

export async function descargarMediaWhatsApp(
  mediaId: string,
  tipo: 'audio' | 'image',
  fetchFn: typeof fetch = fetch,
): Promise<MediaWhatsApp> {
  const token = metaToken();
  if (!token) throw new Error('Falta la conexión de WhatsApp Meta.');
  if (!/^[A-Za-z0-9_-]{2,200}$/.test(mediaId)) throw new Error('El identificador de la foto o el audio no es válido.');

  const metadataResponse = await fetchFn(`https://graph.facebook.com/${META_VERSION}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    redirect: 'error',
  });
  if (!metadataResponse.ok) throw new Error('Meta no permitió descargar el archivo recibido.');
  const metadata = await metadataResponse.json() as { url?: string; mime_type?: string; file_size?: number };
  if (!metadata.url || !metadata.mime_type) throw new Error('Meta no devolvió la ubicación y el formato del archivo.');

  const url = new URL(metadata.url);
  if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password || url.hash ||
      !/(^|\.)(facebook\.com|fbcdn\.net|fbsbx\.com)$/.test(url.hostname)) {
    throw new Error('La ubicación del archivo de Meta no es válida.');
  }
  const mimeType = metadata.mime_type.split(';')[0].trim().toLowerCase();
  const allowed = tipo === 'audio'
    ? new Set(['audio/aac', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/opus', 'audio/wav', 'audio/webm', 'application/ogg'])
    : new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowed.has(mimeType)) throw new Error('Meta devolvió un formato de archivo no compatible.');
  const metadataSize = Number(metadata.file_size);
  if (!Number.isSafeInteger(metadataSize) || metadataSize <= 0 || metadataSize > MAX_MEDIA_BYTES) {
    throw new Error('El archivo recibido supera el límite de 10 MB o Meta informó un tamaño inválido.');
  }

  const fileResponse = await fetchFn(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    redirect: 'error',
  });
  if (!fileResponse.ok) throw new Error('No se pudo descargar el archivo recibido.');
  const headerType = fileResponse.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (headerType && headerType !== mimeType && headerType !== 'application/octet-stream') {
    throw new Error('El formato descargado no coincide con el informado por Meta.');
  }
  const contentLength = Number(fileResponse.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_MEDIA_BYTES) {
    throw new Error('El archivo recibido supera el límite de 10 MB.');
  }
  const bytes = Buffer.from(await fileResponse.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_MEDIA_BYTES || bytes.length !== metadataSize) {
    throw new Error('El archivo está vacío, incompleto o supera el límite de 10 MB.');
  }
  if (!contenidoCoincide(bytes, mimeType)) throw new Error('El contenido descargado no coincide con el formato informado por Meta.');
  return { mimeType, base64: bytes.toString('base64') };
}

async function consultarGemini(media: MediaWhatsApp, instruccion: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta configurar Gemini para procesar archivos de WhatsApp.');
  const reserva = await reservarConsumoIA('whatsapp-media');
  if (!reserva) throw new Error('Se llegó al tope mensual de IA.');

  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [
          { inlineData: { mimeType: media.mimeType, data: media.base64 } },
          { text: instruccion },
        ] }],
        generationConfig: { temperature: 0 },
      }),
      cache: 'no-store',
    }).catch((error) => {
      // Sin respuesta no sabemos si Gemini llegó a procesar la solicitud: se conserva la reserva.
      throw error;
    });
  if (!response.ok) {
    if ([400, 401, 403, 404, 413, 429].includes(response.status)) {
      await reserva.liberar().catch(() => undefined);
    }
    throw new Error('Gemini no pudo procesar el archivo recibido.');
  }
  const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
  if (!text) throw new Error('Gemini no devolvió un resultado legible.');
  return text;
}

export async function transcribirAudioWhatsApp(media: MediaWhatsApp): Promise<string> {
  const texto = await consultarGemini(media,
    'Transcribí literalmente el audio en español. Conservá nombres, fechas y montos tal como se oyen. No completes partes inaudibles; marcá [inaudible]. Devolvé solo la transcripción.');
  if (!texto || /^\[?inaudible\]?$/i.test(texto)) throw new Error('No pude escuchar el audio.');
  return texto;
}

export interface ResultadoImagenWhatsApp {
  tipo: 'comprobante' | 'otra';
  descripcion: string;
  proveedor?: string;
  fecha?: string;
  monto?: number;
  categoria?: string;
  confianza?: 'alta' | 'media' | 'baja';
  detalle?: string;
}

export async function clasificarImagenWhatsApp(media: MediaWhatsApp): Promise<ResultadoImagenWhatsApp> {
  const salida = await consultarGemini(media,
    'Analizá la imagen sin inventar ni completar datos ilegibles. Respondé solo JSON válido con este formato: {"tipo":"comprobante"|"otra","descripcion":"descripción breve de lo visible","proveedor":"texto visible o vacío","fecha":"fecha visible o vacío","monto":número visible o null,"categoria":"categoría visible o vacío","confianza":"alta"|"media"|"baja","detalle":"detalle visible o vacío"}. Usá comprobante únicamente si se ve claramente un ticket, factura o recibo con texto impreso. Si no, usá otra y deja los campos del comprobante vacíos o null.');
  try {
    const limpio = salida.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(limpio);
    if (!['comprobante', 'otra'].includes(parsed.tipo) || typeof parsed.descripcion !== 'string') throw new Error();
    const monto = typeof parsed.monto === 'number' && Number.isFinite(parsed.monto) && parsed.monto > 0
      ? parsed.monto
      : undefined;
    const confianza = ['alta', 'media', 'baja'].includes(parsed.confianza) ? parsed.confianza : undefined;
    const campo = (valor: unknown) => typeof valor === 'string' ? valor.trim().slice(0, 200) : undefined;
    return {
      tipo: parsed.tipo,
      descripcion: parsed.descripcion.slice(0, 500),
      proveedor: campo(parsed.proveedor),
      fecha: campo(parsed.fecha),
      monto,
      categoria: campo(parsed.categoria),
      confianza,
      detalle: campo(parsed.detalle),
    };
  } catch {
    throw new Error('No pude identificar con seguridad qué aparece en la foto.');
  }
}
