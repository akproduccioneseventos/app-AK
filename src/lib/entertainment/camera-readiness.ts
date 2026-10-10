export interface VideoFrameState {
  readyState: number;
  videoWidth: number;
  videoHeight: number;
}

export function isVideoFrameReady(video: VideoFrameState | null | undefined) {
  return Boolean(
    video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0
  );
}

/** Lo mínimo que se necesita de un <video> para asegurarse de que muestre imagen. */
export interface VideoReproducible extends VideoFrameState {
  paused: boolean;
  play(): Promise<void> | void;
  addEventListener(tipo: string, escucha: () => void): void;
  removeEventListener(tipo: string, escucha: () => void): void;
  requestVideoFrameCallback?: (escucha: () => void) => number;
  cancelVideoFrameCallback?: (id: number) => void;
}

/** La cámara no pudo entregar un cuadro real: la pantalla avisa y deja reintentar. */
export class CamaraSinCuadroError extends Error {
  constructor(public motivo: 'no-reproduce' | 'sin-cuadro', detalle?: string) {
    super(detalle || motivo);
    this.name = 'CamaraSinCuadroError';
  }
}

/**
 * Antes de dibujar el video en un lienzo hay que asegurarse de que esté
 * REPRODUCIÉNDOSE y de que haya llegado un cuadro de verdad. Un video pausado
 * (el navegador pausa los videos ocultos con `autoplay`) tiene la señal viva y
 * `readyState` 4, pero se dibuja en negro.
 *
 * Si está pausado, llama a `play()`; después espera un cuadro nuevo
 * (`requestVideoFrameCallback`, o `playing`/`timeupdate` si no existe). Si no
 * llega en `timeoutMs`, o `play()` es rechazado, tira `CamaraSinCuadroError`
 * y quien llama NO debe guardar ni entregar la captura.
 *
 * No mide qué tan oscura es la imagen: una foto oscura de verdad es válida.
 */
export async function asegurarCuadroDeVideo(
  video: VideoReproducible,
  { timeoutMs = 3000 }: { timeoutMs?: number } = {},
): Promise<void> {
  if (!video.paused && isVideoFrameReady(video)) return;

  if (video.paused) {
    try {
      await video.play();
    } catch (err) {
      throw new CamaraSinCuadroError('no-reproduce', err instanceof Error ? err.message : String(err));
    }
    if (video.paused) throw new CamaraSinCuadroError('no-reproduce', 'el video sigue en pausa');
  }

  await new Promise<void>((resolve, reject) => {
    let cerrado = false;
    let idCuadro: number | undefined;
    const limpiar = () => {
      cerrado = true;
      clearTimeout(reloj);
      video.removeEventListener('playing', alLlegar);
      video.removeEventListener('timeupdate', alLlegar);
      if (idCuadro !== undefined && video.cancelVideoFrameCallback) video.cancelVideoFrameCallback(idCuadro);
    };
    const alLlegar = () => {
      if (cerrado || !isVideoFrameReady(video)) return;
      limpiar();
      resolve();
    };
    const reloj = setTimeout(() => {
      if (cerrado) return;
      limpiar();
      // Una señal quieta (una imagen fija) no manda cuadros nuevos: si el video ya está andando
      // y tiene un cuadro, ese cuadro sirve. Sólo se corta si sigue sin imagen.
      if (!video.paused && isVideoFrameReady(video)) resolve();
      else reject(new CamaraSinCuadroError('sin-cuadro', 'no llegó ningún cuadro a tiempo'));
    }, timeoutMs);
    if (video.requestVideoFrameCallback) {
      idCuadro = video.requestVideoFrameCallback(alLlegar);
    }
    video.addEventListener('playing', alLlegar);
    video.addEventListener('timeupdate', alLlegar);
  });
}
