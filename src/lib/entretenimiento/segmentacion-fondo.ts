/**
 * Módulo de segmentación y cambio de fondo en canvas para estaciones de entretenimiento.
 *
 * Soporta:
 * 1. Fondo de la pantalla ("Telón" / Tema): lo que se ve alrededor de la cámara mientras esperan.
 * 2. Telón verde/azul (Chroma Keying) con suavizado de bordes en canvas local sin costo.
 * 3. Fondo desenfocado ('desenfocar') para resaltar a la persona.
 * 4. Fondos virtuales de la foto (imágenes cargadas por el cliente).
 * 5. Modo sin cambiar (original).
 *
 * 100% offline, sin dependencias de pago en la nube.
 */

export interface FondoPantallaConfig {
  id: string;
  nombre: string;
  descripcion: string;
  className: string;
  bordeCamara: string;
  badge: string;
}

export const FONDOS_DE_PANTALLA: FondoPantallaConfig[] = [
  {
    id: 'telon-rojo',
    nombre: 'Cortina roja',
    descripcion: 'Telón clásico de terciopelo estilo teatro',
    className: 'bg-gradient-to-b from-red-950 via-red-900 to-black',
    bordeCamara: 'border-red-700/60 shadow-[0_0_50px_rgba(220,38,38,0.3)]',
    badge: '🎭 Clásico',
  },
  {
    id: 'dorado-gala',
    nombre: 'Dorado de gala',
    descripcion: 'Elegante y sofisticado para bodas y eventos formales',
    className: 'bg-gradient-to-b from-amber-950 via-zinc-900 to-black',
    bordeCamara: 'border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.25)]',
    badge: '👑 Gala',
  },
  {
    id: 'neon-fiesta',
    nombre: 'Neón de fiesta',
    descripcion: 'Colores vibrantes y luces para boliche y cumpleaños',
    className: 'bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950',
    bordeCamara: 'border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.3)]',
    badge: '⚡ Fiesta',
  },
  {
    id: 'campo',
    nombre: 'Campo rústico',
    descripcion: 'Textura cálida y tonos tierra',
    className: 'bg-gradient-to-b from-stone-900 via-stone-950 to-black',
    bordeCamara: 'border-amber-800/40 shadow-[0_0_50px_rgba(180,83,9,0.2)]',
    badge: '🌿 Rústico',
  },
  {
    id: 'blanco-minimal',
    nombre: 'Blanco minimalista',
    descripcion: 'Limpio, luminoso y moderno',
    className: 'bg-gradient-to-b from-slate-900 via-slate-950 to-zinc-950',
    bordeCamara: 'border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.15)]',
    badge: '✨ Minimal',
  },
  {
    id: 'quince-glam',
    nombre: 'Quince años glam',
    descripcion: 'Destellos rosados y brillo para quinceañeras',
    className: 'bg-gradient-to-br from-rose-950 via-purple-950 to-black',
    bordeCamara: 'border-rose-400/50 shadow-[0_0_50px_rgba(251,113,133,0.3)]',
    badge: '💖 15 Años',
  },
];

export function obtenerFondoDePantalla(id?: string): FondoPantallaConfig {
  const encontrado = FONDOS_DE_PANTALLA.find((f) => f.id === id);
  return encontrado || FONDOS_DE_PANTALLA[0];
}

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
 * Procesa un fotograma aplicando el fondo virtual, desenfoque o chroma key seleccionado.
 * Garantiza que nunca quede mancha negra dibujando el fondo virtual debajo del sujeto aislado.
 */
export function procesarFondoCanvas({
  canvasDestino,
  videoOrigen,
  fondoSeleccionado,
  imagenFondo,
  toleranciaChroma = 90,
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
    // Dibujar fondo desenfocado primero
    ctx.save();
    ctx.filter = 'blur(16px)';
    ctx.drawImage(videoOrigen, -20, -20, ancho + 40, alto + 40);
    ctx.restore();

    // Dibujar sujeto al centro
    ctx.save();
    ctx.drawImage(videoOrigen, 0, 0, ancho, alto);
    ctx.restore();
    return;
  }

  if (fondoSeleccionado.tipo === 'imagen' || fondoSeleccionado.tipo === 'chroma') {
    // 1. Dibujar el fondo virtual nuevo detrás (si no hay imagen, usar color elegante en vez de negro)
    if (imagenFondo && imagenFondo.complete) {
      ctx.drawImage(imagenFondo, 0, 0, ancho, alto);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, ancho, alto);
    }

    // 2. Crear un canvas auxiliar para aislar al sujeto por chroma key
    const auxCanvas = document.createElement('canvas');
    auxCanvas.width = ancho;
    auxCanvas.height = alto;
    const auxCtx = auxCanvas.getContext('2d', { willReadFrequently: true });
    if (auxCtx) {
      auxCtx.drawImage(videoOrigen, 0, 0, ancho, alto);
      // Aplicar chroma verde o azul
      const colorChroma: [number, number, number] = fondoSeleccionado.colorChroma === 'azul'
        ? [0, 80, 255]
        : [30, 200, 30];
      aplicarChromaKey(auxCtx, ancho, alto, colorChroma, toleranciaChroma);
      // Superponer el sujeto recortado sobre el fondo nuevo
      ctx.drawImage(auxCanvas, 0, 0);
    }
  }
}
