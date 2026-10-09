/**
 * @fileOverview Reproductor universal de voz para la IA en el cliente.
 * Prioriza la voz de Gemini (POST /api/asistente/voz-parte) y, si no está (apagada, tope del
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
    // Por POST: el texto no queda en la dirección, ni en el historial ni en los registros (auditoría 66).
    const response = await fetch('/api/asistente/voz-parte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto: textoLimpio, ...(opciones?.voz ? { voz: opciones.voz } : {}) }),
    });
    if (!response.ok) {
      // La ruta dice si la voz del teléfono está prendida en Ajustes. Apagada: no se habla.
      const motivo = await response.json().catch(() => ({} as { vozTelefonoActiva?: boolean }));
      if (motivo?.vozTelefonoActiva === false) {
        reproduciendo = false;
        // Se avisa: callarse sin decir por qué parecía que la voz no andaba (dueño, 9/10/2026).
        opciones?.onError?.(new Error('La voz está apagada en Ajustes → Asistente.'));
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
    opciones?.onError?.(new Error('Este equipo no tiene voz para leer la respuesta.'));
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

    utterance.onerror = (ev) => {
      reproduciendo = false;
      // `interrupted`/`canceled` es que se cortó a propósito (otra respuesta, el botón de parar).
      const motivo = (ev as SpeechSynthesisErrorEvent)?.error;
      if (motivo === 'interrupted' || motivo === 'canceled') opciones?.onEnd?.();
      else opciones?.onError?.(new Error('El navegador no dejó reproducir la voz. Tocá el parlante para escucharla.'));
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    reproduciendo = false;
    opciones?.onError?.(new Error('No se pudo reproducir la voz.'));
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
