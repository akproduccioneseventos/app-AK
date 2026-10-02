/**
 * @fileOverview Generador de voz real con Gemini TTS para el Asistente AK.
 * Genera voz de verdad con Gemini / Google Cloud TTS.
 * Si no hay clave disponible o falla la llamada, produce un error explícito
 * para que el reproductor use la voz del navegador (speechSynthesis).
 * NUNCA devuelve un tono ni pitidos haciéndose pasar por voz (Orden 110).
 */

export interface OpcionesVozGemini {
  voz?: string;
  velocidad?: number;
  apiKey?: string;
}

export const VOCES_GEMINI = [
  { id: 'es-ES-Journey-F', nombre: 'Laura (Journey Cálida)', genero: 'femenina', lang: 'es-ES' },
  { id: 'es-ES-Journey-D', nombre: 'Martín (Journey Cercana)', genero: 'masculina', lang: 'es-ES' },
  { id: 'es-US-Journey-F', nombre: 'Camila (Latinoamericana Natural)', genero: 'femenina', lang: 'es-US' },
  { id: 'es-US-Journey-D', nombre: 'Nicolás (Rioplatense Natural)', genero: 'masculina', lang: 'es-US' },
  { id: 'es-ES-Neural2-A', nombre: 'Valeria (Neural2 Estudio)', genero: 'femenina', lang: 'es-ES' },
  { id: 'es-ES-Neural2-B', nombre: 'Javier (Neural2 Estudio)', genero: 'masculina', lang: 'es-ES' },
];

/**
 * Sintetiza voz con Gemini / Google Cloud Text-to-Speech API.
 * Lanza un error si no hay clave o si el servicio externo no está disponible.
 */
export async function sintetizarVozGemini(
  texto: string,
  opciones?: OpcionesVozGemini
): Promise<Buffer> {
  const textoLimpio = (texto || '')
    .replace(/[*#_`~>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);

  if (!textoLimpio) {
    throw new Error('El texto para sintetizar está vacío.');
  }

  const apiKey =
    opciones?.apiKey ||
    process.env.GOOGLE_TTS_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'dummy' || apiKey.length < 10) {
    throw new Error('No hay clave de API configurada para Gemini TTS.');
  }

  const vozId = opciones?.voz || 'es-ES-Journey-F';
  const vozConfig = VOCES_GEMINI.find((v) => v.id === vozId) || VOCES_GEMINI[0];

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text: textoLimpio },
      voice: {
        languageCode: vozConfig.lang,
        name: vozConfig.id,
      },
      audioConfig: {
        audioEncoding: 'LINEAR16',
        speakingRate: opciones?.velocidad || 1.0,
        sampleRateHertz: 24000,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const mensaje = errorData?.error?.message || response.statusText;
    throw new Error(`Fallo en servicio Gemini TTS (${response.status}): ${mensaje}`);
  }

  const data = await response.json();
  if (!data?.audioContent) {
    throw new Error('La respuesta de Gemini TTS no contiene audio.');
  }

  return Buffer.from(data.audioContent, 'base64');
}
