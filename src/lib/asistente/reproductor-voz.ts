/**
 * @fileOverview Reproductor universal de voz para la IA en el cliente.
 * Prioriza la voz de Gemini (/api/asistente/voz-parte?texto=...) y, si no está (apagada, tope del
 * día, sin señal), usa la voz del teléfono, salvo que también esté apagada en Ajustes.
 */

let audioActual: HTMLAudioElement | null = null;
let reproduciendo = false;

export function selectBestSpanishVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. es-UY (Uruguay)
  const uy = voices.find((v) => v.lang === 'es-UY' || v.lang.startsWith('es_UY') || v.lang.toLowerCase().includes('uy'));
  if (uy) return uy;

  // 2. es-AR (Argentina / Rioplatense)
  const ar = voices.find((v) => v.lang === 'es-AR' || v.lang.startsWith('es_AR') || v.lang.toLowerCase().includes('ar'));
  if (ar) return ar;

  // 3. es-419 / es-US (Latinoamérica)
  const latam = voices.find((v) => v.lang === 'es-419' || v.lang === 'es-US' || v.lang.toLowerCase().includes('419') || v.lang.toLowerCase().includes('us'));
  if (latam) return latam;

  // 4. Cualquier voz en español
  const generalEs = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
  if (generalEs) return generalEs;

  return null;
}

export function truncateForSpeech(text: string): string {
  const cleaned = (text || '')
    .replace(/[*#_`~>]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 4) {
    return cleaned;
  }
  return `${sentences.slice(0, 4).join(' ')} ¿Querés que siga con más detalle?`;
}

/**
 * Reproduce voz de IA real y humana en el cliente.
 */
export async function reproducirVozReal(
  texto: string,
  opciones?: {
    voz?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): Promise<void> {
  detenerVozReal();

  const textoLimpio = truncateForSpeech(texto);
  if (!textoLimpio) {
    opciones?.onEnd?.();
    return;
  }

  reproduciendo = true;

  // 1. Intentar audio neuronal del servidor
  try {
    const params = new URLSearchParams({ texto: textoLimpio });
    if (opciones?.voz) {
      params.set('voz', opciones.voz);
    }

    const response = await fetch(`/api/asistente/voz-parte?${params.toString()}`);
    if (!response.ok) {
      // La ruta dice si la voz del teléfono está prendida en Ajustes. Apagada: no se habla.
      const motivo = await response.json().catch(() => ({} as { vozTelefonoActiva?: boolean }));
      if (motivo?.vozTelefonoActiva === false) {
        reproduciendo = false;
        opciones?.onEnd?.();
        return;
      }
    } else {
      const blob = await response.blob();
      if (blob.size > 100) {
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioActual = audio;

        audio.onplay = () => {
          opciones?.onStart?.();
        };

        audio.onended = () => {
          reproduciendo = false;
          URL.revokeObjectURL(audioUrl);
          audioActual = null;
          opciones?.onEnd?.();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          audioActual = null;
          reproducirConNavegador(textoLimpio, opciones);
        };

        await audio.play();
        return;
      }
    }
  } catch {
    // Continuar a fallback de navegador
  }

  // 2. Fallback a voz del navegador
  reproducirConNavegador(textoLimpio, opciones);
}

function reproducirConNavegador(
  texto: string,
  opciones?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    reproduciendo = false;
    opciones?.onEnd?.();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const bestVoice = selectBestSpanishVoice();
    const utterance = new SpeechSynthesisUtterance(texto);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = 'es-UY';
    }
    utterance.rate = 1.02;

    utterance.onstart = () => {
      opciones?.onStart?.();
    };

    utterance.onend = () => {
      reproduciendo = false;
      opciones?.onEnd?.();
    };

    utterance.onerror = () => {
      reproduciendo = false;
      opciones?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    reproduciendo = false;
    opciones?.onEnd?.();
  }
}

/**
 * Detiene cualquier audio en reproducción en el cliente.
 */
export function detenerVozReal(): void {
  reproduciendo = false;
  if (audioActual) {
    try {
      audioActual.pause();
      audioActual.currentTime = 0;
    } catch {}
    audioActual = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function isVozReproduciendose(): boolean {
  return reproduciendo;
}
