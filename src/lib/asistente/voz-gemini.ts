/**
 * @fileOverview La voz real del Asistente AK, con la voz de Gemini (3 de octubre de 2026).
 *
 * Decisión del dueño: la voz de Gemini, que tiene una parte gratis por día, y la voz del teléfono,
 * cada una con su interruptor en Ajustes. Antes se usaba la voz de Google Cloud, que es otro
 * servicio y cobra pasado un tope mensual.
 *
 * Si no hay clave, la voz está apagada, se pasó el tope del día o Gemini no contesta, tira un
 * error explícito y el reproductor usa la voz del teléfono (si está prendida). NUNCA devuelve un
 * tono haciéndose pasar por voz (orden 110).
 */

export interface OpcionesVozGemini {
  voz?: string;
  apiKey?: string;
  fetchFn?: typeof fetch;
}

/** Voces de Gemini que hablan bien en español. El id es el nombre que pide Gemini. */
export const VOCES_IA_DISPONIBLES = [
  { id: 'Kore', nombre: 'Kore', genero: 'femenina', descripcion: 'Firme y clara, buena para el parte de la mañana.' },
  { id: 'Aoede', nombre: 'Aoede', genero: 'femenina', descripcion: 'Liviana y cercana.' },
  { id: 'Leda', nombre: 'Leda', genero: 'femenina', descripcion: 'Joven y amable.' },
  { id: 'Puck', nombre: 'Puck', genero: 'masculina', descripcion: 'Animada, con energía.' },
  { id: 'Charon', nombre: 'Charon', genero: 'masculina', descripcion: 'Informativa y tranquila.' },
  { id: 'Orus', nombre: 'Orus', genero: 'masculina', descripcion: 'Firme y segura.' },
];
export const VOZ_POR_OMISION = 'Kore';

/** El modelo se puede cambiar sin tocar código si Google lo renombra. */
export const MODELOS_DE_VOZ = (process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts,gemini-2.5-flash-preview-tts')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

/** Gemini devuelve audio crudo (PCM de 16 bits, 24 kHz, un canal): se le pone el encabezado WAV. */
export function pcmAWav(pcm: Buffer, frecuencia = 24000): Buffer {
  const encabezado = Buffer.alloc(44);
  encabezado.write('RIFF', 0);
  encabezado.writeUInt32LE(36 + pcm.length, 4);
  encabezado.write('WAVE', 8);
  encabezado.write('fmt ', 12);
  encabezado.writeUInt32LE(16, 16);
  encabezado.writeUInt16LE(1, 20);
  encabezado.writeUInt16LE(1, 22);
  encabezado.writeUInt32LE(frecuencia, 24);
  encabezado.writeUInt32LE(frecuencia * 2, 28);
  encabezado.writeUInt16LE(2, 32);
  encabezado.writeUInt16LE(16, 34);
  encabezado.write('data', 36);
  encabezado.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([encabezado, pcm]);
}

export function limpiarTextoParaVoz(texto: string): string {
  return (texto || '')
    .replace(/[*#_`~>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

/**
 * Pide la voz a Gemini y devuelve un WAV listo para reproducir.
 * Tira un error si no hay clave o Gemini no contesta (por ejemplo, tope gratis del día: 429).
 */
export async function sintetizarVozGemini(texto: string, opciones?: OpcionesVozGemini): Promise<Buffer> {
  const textoLimpio = limpiarTextoParaVoz(texto);
  if (!textoLimpio) throw new Error('El texto para la voz está vacío.');

  const rawKey = opciones?.apiKey !== undefined
    ? opciones.apiKey
    : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const apiKey = rawKey && rawKey !== 'dummy' ? rawKey.trim() : '';
  if (!apiKey || apiKey.length < 10) throw new Error('No hay clave de Gemini para la voz.');

  const voz = VOCES_IA_DISPONIBLES.some((v) => v.id === opciones?.voz) ? opciones!.voz! : VOZ_POR_OMISION;
  const fetchFn = opciones?.fetchFn || globalThis.fetch;
  if (!fetchFn) throw new Error('No se puede llamar a Gemini: falta fetch.');

  let ultimoError = 'Gemini no devolvió audio.';
  for (const modelo of MODELOS_DE_VOZ) {
    const response = await fetchFn(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Decilo en español rioplatense, con tono cálido y natural: ${textoLimpio}` }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } },
          },
        }),
      },
    );
    if (response.status === 404) {
      ultimoError = `El modelo de voz ${modelo} no existe.`;
      continue;
    }
    if (!response.ok) {
      const datos = await response.json().catch(() => ({} as any));
      throw new Error(`Gemini no dio la voz (${response.status}): ${datos?.error?.message || response.statusText}`);
    }
    const datos = await response.json();
    const audio = datos?.candidates?.[0]?.content?.parts?.find((p: any) => p?.inlineData?.data)?.inlineData?.data;
    if (!audio) throw new Error('La respuesta de Gemini no trae audio.');
    return pcmAWav(Buffer.from(audio, 'base64'));
  }
  throw new Error(ultimoError);
}
