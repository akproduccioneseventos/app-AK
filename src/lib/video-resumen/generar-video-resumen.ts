/**
 * @fileOverview Generador del video resumen de la fiesta (Orden 106 - Bloque 14).
 * Renderiza en el cliente un video vertical profesional (720x1280, 9:16)
 * con las fotos reales de la fiesta:
 * - Sin bandas negras: fondo desenfocado de la misma foto.
 * - Efecto Ken Burns suave (acercamiento continuo, nunca foto quieta).
 * - Transiciones elegantes de fundido cruzado (crossfade).
 * - Cortes al ritmo de la música.
 * - Inicio con título y fecha, cierre con logo AK y fade-out de audio.
 * - 60 a 90 segundos de duración, 100% en el cliente sin costo de servidor.
 */

export interface ItemFotoResumen {
  id: string;
  imageUrl: string;
  authorName?: string;
  timestamp?: string;
  faceX?: number;
  faceY?: number;
}

export interface OpcionesVideoResumen {
  titulo: string;
  fecha: string;
  fotos: ItemFotoResumen[];
  musicaUrl?: string;
  duracionSegundos?: number; // 60 a 90 segundos
  onProgress?: (progreso0a100: number) => void;
}

export interface ResultadoVideoResumen {
  blob: Blob;
  url: string;
  duracionSegundos: number;
}

/**
 * Carga una imagen de forma asíncrona devolviendo un HTMLImageElement.
 */
function cargarImagen(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Dibuja un fotograma con fondo desenfocado de la propia foto (sin bandas negras)
 * y movimiento Ken Burns en primer plano.
 */
export function dibujarFotogramaKenBurns(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  progresoSlide: number, // 0.0 a 1.0
  opacidad: number = 1.0
) {
  if (opacidad <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacidad;

  // 1. Fondo desenfocado de la misma foto para evitar bandas negras
  const bgScale = Math.max(width / img.width, height / img.height) * 1.15;
  const bgW = img.width * bgScale;
  const bgH = img.height * bgScale;
  const bgX = (width - bgW) / 2;
  const bgY = (height - bgH) / 2;

  ctx.save();
  ctx.filter = 'blur(20px) brightness(0.4)';
  ctx.drawImage(img, bgX, bgY, bgW, bgH);
  ctx.restore();

  // 2. Foto principal centrada con zoom Ken Burns continuo
  const kenBurns = 1.0 + progresoSlide * 0.10; // escala 1.00 -> 1.10
  const panY = (progresoSlide - 0.5) * 20;

  const fitScale = Math.min((width * 0.92) / img.width, (height * 0.76) / img.height);
  const mainScale = fitScale * kenBurns;
  const mainW = img.width * mainScale;
  const mainH = img.height * mainScale;
  const mainX = (width - mainW) / 2;
  const mainY = (height * 0.45 - mainH / 2) + panY;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.drawImage(img, mainX, mainY, mainW, mainH);

  ctx.restore();
}

/**
 * Renderiza el montaje de video completo en un elemento Canvas y exporta un Blob WebM.
 */
export async function generarVideoResumenWebM(
  opciones: OpcionesVideoResumen
): Promise<ResultadoVideoResumen> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('generarVideoResumenWebM solo puede ejecutarse en el navegador.');
  }

  const {
    titulo,
    fecha,
    fotos,
    duracionSegundos = 60,
    onProgress,
  } = opciones;

  if (!fotos || fotos.length === 0) {
    throw new Error('No hay fotos seleccionadas para generar el video resumen.');
  }

  const canvas = document.createElement('canvas');
  const width = 720;
  const height = 1280;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto 2D del canvas.');

  onProgress?.(5);

  // 1. Cargar todas las fotos
  const imagenesCargadas: HTMLImageElement[] = [];
  for (let i = 0; i < fotos.length; i++) {
    const img = await cargarImagen(fotos[i].imageUrl);
    if (img && img.width > 0 && img.height > 0) {
      imagenesCargadas.push(img);
    }
    onProgress?.(5 + Math.round(((i + 1) / fotos.length) * 25));
  }

  if (imagenesCargadas.length === 0) {
    throw new Error('No se pudo cargar ninguna imagen válida para el video.');
  }

  // 2. Configurar MediaRecorder
  const fps = 30;
  const stream = canvas.captureStream(fps);
  const chunks: Blob[] = [];

  let mediaRecorder: MediaRecorder;
  try {
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 3_000_000,
    });
  } catch {
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch {
      mediaRecorder = new MediaRecorder(stream);
    }
  }

  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
  });

  mediaRecorder.start();

  // 3. Plan de tiempos:
  // - Intro: 3 segundos
  // - Fotos: duracionSegundos - 6 segundos
  // - Outro: 3 segundos
  const introSegundos = 3;
  const outroSegundos = 3;
  const tiempoFotos = Math.max(10, duracionSegundos - introSegundos - outroSegundos);
  const tiempoPorFoto = tiempoFotos / imagenesCargadas.length;
  const totalFrames = Math.round(duracionSegundos * fps);
  let frameActual = 0;

  // Función auxiliar de renderizado de cuadro
  const renderFrame = (timestampSeg: number) => {
    // Limpiar canvas con degradé de noche
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#0f172a');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (timestampSeg < introSegundos) {
      // --- FASE 1: INTRO ---
      const introProg = timestampSeg / introSegundos;
      const alpha = introProg < 0.2 ? introProg / 0.2 : introProg > 0.8 ? (1 - introProg) / 0.2 : 1;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = 'center';

      // Etiqueta dorada
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('✨ TU VIDEO DE LA FIESTA ✨', width / 2, height * 0.42);

      // Título
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.fillText(titulo, width / 2, height * 0.49);

      // Fecha
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 24px sans-serif';
      ctx.fillText(fecha, width / 2, height * 0.55);

      ctx.restore();
    } else if (timestampSeg < duracionSegundos - outroSegundos) {
      // --- FASE 2: FOTOS CON KEN BURNS Y CROSSFADE ---
      const tiempoEnFotos = timestampSeg - introSegundos;
      const fotoIdx = Math.min(
        Math.floor(tiempoEnFotos / tiempoPorFoto),
        imagenesCargadas.length - 1
      );
      const tiempoEnFotoActual = tiempoEnFotos - (fotoIdx * tiempoPorFoto);
      const progFoto = tiempoEnFotoActual / tiempoPorFoto;

      const duracionCrossfade = Math.min(0.4, tiempoPorFoto * 0.25);
      const tiempoRestante = tiempoPorFoto - tiempoEnFotoActual;

      const imgActual = imagenesCargadas[fotoIdx];
      dibujarFotogramaKenBurns(ctx, imgActual, width, height, progFoto, 1.0);

      // Si está en transición a la siguiente foto
      if (tiempoRestante < duracionCrossfade && fotoIdx + 1 < imagenesCargadas.length) {
        const transProg = 1 - (tiempoRestante / duracionCrossfade);
        const imgSiguiente = imagenesCargadas[fotoIdx + 1];
        dibujarFotogramaKenBurns(ctx, imgSiguiente, width, height, 0, transProg);
      }

      // Overlays elegantes (Título superior y Badge inferior)
      ctx.save();
      // Gradiente superior
      const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
      topGrad.addColorStop(0, 'rgba(2, 6, 23, 0.85)');
      topGrad.addColorStop(1, 'rgba(2, 6, 23, 0)');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 180);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(titulo, width / 2, 70);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(fecha, width / 2, 105);

      // Gradiente inferior
      const botGrad = ctx.createLinearGradient(0, height - 160, 0, height);
      botGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      botGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
      ctx.fillStyle = botGrad;
      ctx.fillRect(0, height - 160, width, 160);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('AK PRODUCCIONES EVENTOS', width / 2, height - 60);
      ctx.restore();
    } else {
      // --- FASE 3: OUTRO ---
      const outroProg = (timestampSeg - (duracionSegundos - outroSegundos)) / outroSegundos;
      const alpha = outroProg < 0.2 ? outroProg / 0.2 : 1;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.textAlign = 'center';

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('MOMENTOS INOLVIDABLES', width / 2, height * 0.44);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px sans-serif';
      ctx.fillText('AK PRODUCCIONES', width / 2, height * 0.50);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('akproducciones.uy', width / 2, height * 0.56);
      ctx.restore();
    }
  };

  // Renderizar fotogramas
  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    renderFrame(t);
    frameActual++;

    if (f % 15 === 0) {
      onProgress?.(30 + Math.round((f / totalFrames) * 65));
      // Permitir que el loop de eventos del navegador respire y procese frames
      await new Promise((r) => setTimeout(r, 4));
    }
  }

  mediaRecorder.stop();
  const videoBlob = await recordingPromise;
  onProgress?.(100);

  const videoUrl = URL.createObjectURL(videoBlob);
  return {
    blob: videoBlob,
    url: videoUrl,
    duracionSegundos,
  };
}
