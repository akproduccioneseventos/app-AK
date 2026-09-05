/**
 * Módulo de segmentación y cambio de fondo en canvas para estaciones de entretenimiento.
 *
 * Soporta:
 * 1. Telón verde/azul (Chroma Keying) con suavizado de bordes en canvas local sin costo.
 * 2. Fondo desenfocado ('desenfocar') para resaltar a la persona (estilo Simple Booth).
 * 3. Fondos virtuales de la fiesta (imágenes cargadas por el cliente).
 * 4. Modo sin cambiar (original).
 *
 * 100% offline, sin dependencias de pago en la nube.
 */

export interface OpcionFondo {
  id: string;
  nombre: string;
  tipo: 'ninguno' | 'desenfoque' | 'imagen' | 'chroma';
  url?: string;
  colorChroma?: string;
}

export interface ProcesarFondoParams {
  canvasDestino: HTMLCanvasElement;
  videoOrigen: HTMLVideoElement | HTMLImageElement;
  fondoSeleccionado?: OpcionFondo | null;
  imagenFondo?: HTMLImageElement | null;
  toleranciaChroma?: number;
  recorteSinTela?: boolean;
}

/**
 * Aplica el filtro Chroma Key (verde o azul) sobre una imagen o video en canvas.
 */
export function aplicarChromaKey(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  colorObjetivo: [number, number, number] = [0, 255, 0], // Verde por defecto
  tolerancia: number = 80,
  suavizado: number = 20
) {
  const frame = ctx.getImageData(0, 0, ancho, alto);
  const data = frame.data;
  const len = data.length;
  const [targetR, targetG, targetB] = colorObjetivo;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Distancia Euclidiana en espacio RGB
    const diff = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );

    if (diff < tolerancia) {
      data[i + 3] = 0; // Transparente
    } else if (diff < tolerancia + suavizado) {
      // Suavizado de bordes anti-aliasing
      const factor = (diff - tolerancia) / suavizado;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(frame, 0, 0);
}

/**
 * RECORTAR A LA PERSONA SIN TELA VERDE.
 *
 * **Que hace:** le pregunta al modelo, pixel por pixel, que parte de la imagen es
 * una persona y que parte es fondo, y borra el fondo. Sin tela, sin luces
 * especiales y sin que la gente tenga que pararse en un lugar determinado.
 *
 * **Que NO hace, y es lo que habia antes:** no dibuja un ovalo en el medio. Esa
 * primera version parecia andar con una persona sola y centrada, y con alguien
 * corrido a un lado o de a dos **cortaba gente por la mitad**. Se descarto el 4 de
 * septiembre de 2026.
 *
 * **Se carga sola y solo cuando el operador prende la opcion.** El modelo pesa un
 * cuarto de mega y el motor esta guardado en la propia app: no se le baja nada al
 * invitado que solo entra a mirar, y no se paga ningun servicio por mes.
 *
 * **Mientras no este lista, NO recorta**: deja la imagen entera. Es preferible que
 * el fondo no cambie por unos segundos a que salga alguien cortado en la foto.
 */
let segmentador: any = null;
let cargandoSegmentador: Promise<any> | null = null;

/** El motor y el modelo viven en la propia app, no en un servicio de afuera. */
const RUTA_WASM = '/mediapipe/wasm';
const RUTA_MODELO = '/models/segmentacion/selfie_segmenter.tflite';

export function cargarSegmentadorSinTela(): Promise<any> | null {
  if (typeof window === 'undefined') return null;
  if (segmentador) return Promise.resolve(segmentador);
  if (!cargandoSegmentador) {
    cargandoSegmentador = (async () => {
      try {
        const vision = await import('@mediapipe/tasks-vision');
        const fileset = await vision.FilesetResolver.forVisionTasks(RUTA_WASM);
        segmentador = await vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: RUTA_MODELO, delegate: 'GPU' },
          runningMode: 'VIDEO',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
        return segmentador;
      } catch {
        // Si el modelo no esta o el equipo no puede, se sigue sin recortar.
        segmentador = null;
        return null;
      }
    })();
  }
  return cargandoSegmentador;
}

/**
 * Borra el fondo dejando solo a las personas.
 *
 * Devuelve `true` si de verdad recorto. Si devuelve `false`, el que llama tiene que
 * dejar la imagen como estaba: **nunca inventar un recorte**.
 */
export function recortarPersonaSinTela(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  origen?: HTMLVideoElement | HTMLImageElement
): boolean {
  if (!segmentador || !origen) {
    // Todavia no cargo: se pide la carga para la proxima vuelta y no se toca nada.
    cargarSegmentadorSinTela();
    return false;
  }

  let mascara: Uint8Array | null = null;
  try {
    const resultado = segmentador.segmentForVideo(origen, performance.now());
    const cat = resultado?.categoryMask;
    if (cat) {
      mascara = cat.getAsUint8Array();
      cat.close?.();
    }
    resultado?.close?.();
  } catch {
    return false;
  }
  if (!mascara || mascara.length < ancho * alto) return false;

  const frame = ctx.getImageData(0, 0, ancho, alto);
  const data = frame.data;
  for (let pixel = 0; pixel < ancho * alto; pixel += 1) {
    // El modelo marca 0 = fondo. Todo lo que no sea persona se vuelve transparente.
    if (mascara[pixel] === 0) {
      data[pixel * 4 + 3] = 0;
    }
  }
  ctx.putImageData(frame, 0, 0);
  return true;
}

/**
 * Procesa un fotograma aplicando el fondo virtual, desenfoque o chroma key seleccionado.
 */
export function procesarFondoCanvas({
  canvasDestino,
  videoOrigen,
  fondoSeleccionado,
  imagenFondo,
  toleranciaChroma = 90,
  recorteSinTela = false,
}: ProcesarFondoParams): void {
  const ctx = canvasDestino.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const ancho = canvasDestino.width;
  const alto = canvasDestino.height;

  if (!fondoSeleccionado || fondoSeleccionado.tipo === 'ninguno') {
    ctx.drawImage(videoOrigen, 0, 0, ancho, alto);
    return;
  }

  if (fondoSeleccionado.tipo === 'desenfoque') {
    // 1. Dibujar fondo desenfocado en los bordes
    ctx.save();
    ctx.filter = 'blur(20px)';
    ctx.drawImage(videoOrigen, -20, -20, ancho + 40, alto + 40);
    ctx.restore();

    // 2. Dibujar sujeto nítido al centro con máscara elíptica de retrato
    ctx.save();
    ctx.beginPath();
    const centroX = ancho / 2;
    const centroY = alto / 2;
    const radioX = ancho * 0.38;
    const radioY = alto * 0.46;
    ctx.ellipse(centroX, centroY, radioX, radioY, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(videoOrigen, 0, 0, ancho, alto);
    ctx.restore();
    return;
  }

  if (fondoSeleccionado.tipo === 'imagen' || fondoSeleccionado.tipo === 'chroma') {
    // 1. Dibujar el fondo virtual nuevo detrás
    if (imagenFondo && imagenFondo.complete) {
      ctx.drawImage(imagenFondo, 0, 0, ancho, alto);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, ancho, alto);
    }

    // 2. Crear un canvas auxiliar para aislar al sujeto por chroma key o recorte sin tela
    const auxCanvas = document.createElement('canvas');
    auxCanvas.width = ancho;
    auxCanvas.height = alto;
    const auxCtx = auxCanvas.getContext('2d', { willReadFrequently: true });
    if (auxCtx) {
      auxCtx.drawImage(videoOrigen, 0, 0, ancho, alto);
      // Si el recorte sin tela no pudo hacerse -el modelo todavia carga, o el equipo
      // no da- se cae a la tela verde de siempre. Lo que NUNCA se hace es inventar
      // un recorte: sale gente cortada al medio y eso llega a la foto del invitado.
      const recorto = recorteSinTela && recortarPersonaSinTela(auxCtx, ancho, alto, videoOrigen);
      if (!recorto) {
        // Aplicar chroma verde o azul
        const colorChroma: [number, number, number] = fondoSeleccionado.colorChroma === 'azul'
          ? [0, 80, 255]
          : [30, 200, 30];
        aplicarChromaKey(auxCtx, ancho, alto, colorChroma, toleranciaChroma);
      }
      // Superponer el sujeto recortado sobre el fondo nuevo
      ctx.drawImage(auxCanvas, 0, 0);
    }
  }
}
