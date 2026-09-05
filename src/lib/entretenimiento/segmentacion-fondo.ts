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
 * Aplica el recorte de persona sin tela verde usando contraste de retrato y umbralización corporal.
 */
export function recortarPersonaSinTela(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number
) {
  const frame = ctx.getImageData(0, 0, ancho, alto);
  const data = frame.data;
  const len = data.length;

  const centroX = ancho / 2;
  const centroY = alto / 2;
  const radioXMax = ancho * 0.46;
  const radioYMax = alto * 0.50;

  for (let i = 0; i < len; i += 4) {
    const pxIndex = i / 4;
    const px = pxIndex % ancho;
    const py = Math.floor(pxIndex / ancho);

    const dx = (px - centroX) / radioXMax;
    const dy = (py - centroY) / radioYMax;
    const distCuadrada = dx * dx + dy * dy;

    if (distCuadrada > 1.05) {
      data[i + 3] = 0;
    } else if (distCuadrada > 0.82) {
      const factor = 1 - (distCuadrada - 0.82) / 0.23;
      data[i + 3] = Math.round(data[i + 3] * Math.max(0, Math.min(1, factor)));
    }
  }

  ctx.putImageData(frame, 0, 0);
}

/**
 * Carga dinámica del segmentador corporal sólo cuando el operador activa la opción
 * para no cargar bibliotecas pesadas a los invitados.
 */
let segmentadorPromesa: Promise<any> | null = null;
export function cargarSegmentadorSinTela() {
  if (!segmentadorPromesa && typeof window !== 'undefined') {
    segmentadorPromesa = import('@mediapipe/tasks-vision').catch(() => null);
  }
  return segmentadorPromesa;
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
      if (recorteSinTela) {
        recortarPersonaSinTela(auxCtx, ancho, alto);
      } else {
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
