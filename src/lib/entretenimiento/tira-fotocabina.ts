/**
 * Armado de la tira y lámina de recuerdo de las estaciones de entretenimiento.
 *
 * Formato estándar de impresión: 10 x 15 cm vertical (1200 x 1800 px).
 * Entra derecho en la impresora térmica o de fotos sin cortes.
 *
 * - Fotocabina (3 fotos): 1 foto grande arriba a lo ancho + 2 fotos chicas abajo lado a lado.
 * - Espejo Mágico y 360 con IA (1 foto): 1 foto grande arriba ocupando la parte superior.
 * - Pie de recuerdo personalizado: nombre del homenajeado en letra manuscrita grande,
 *   motivo debajo, fecha y logo de AK abajo a la izquierda sobre el fondo de la fiesta.
 */

export const FOTOS_POR_TANDA = 3;

export const SEGUNDOS_PRIMERA_FOTO = 10;

/** Lo que se le dice al invitado antes de cada foto. */
export const GUIA_POR_FOTO = [
  'Ubicate frente a la cámara. Va la primera de tres.',
  '¡Cambiá la pose! Va la segunda.',
  'Última: la mejor sonrisa.',
];

const ANCHO = 1200;
const ALTO = 1800;
const MARGEN = 48;
const SEPARACION = 24;

export interface DatosDeLaTira {
  /** Fotos ya capturadas, en orden (1 o 3 fotos), como data URL. */
  fotos: string[];
  nombreDelEvento?: string;
  nombreHomenajeado?: string;
  motivoDelEvento?: string;
  fechaDelEvento?: string;
  /** Color de la marca de la fiesta o estación. */
  colorDeAcento?: string;
  /** Color de fondo decorado de la fiesta (opcional). */
  colorFondo?: string;
  /** Imagen de fondo decorada de la fiesta (opcional). */
  imagenFondoUrl?: string;
  /** Texto chico del pie. */
  textoDeMarca?: string;
  /** Plantilla de diseño de impresión: strip_3 (clásica), single_photo (foto única), strip_4 (4 fotos) */
  printLayout?: 'strip_3' | 'single_photo' | 'strip_4';
  /** Logo personalizado del cliente */
  logoUrl?: string;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer una de las fotos de la tanda.'));
    img.src = src;
  });
}

/**
 * Dibuja la foto recortada al centro del hueco, sin deformarla.
 */
function dibujarRecortada(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radioBorde = 8,
) {
  const escala = Math.max(ancho / img.width, alto / img.height);
  const anchoFinal = img.width * escala;
  const altoFinal = img.height * escala;
  const desplazamientoX = x + (ancho - anchoFinal) / 2;
  const desplazamientoY = y + (alto - altoFinal) / 2;

  ctx.save();
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, ancho, alto, radioBorde);
  } else {
    ctx.rect(x, y, ancho, alto);
  }
  ctx.clip();
  ctx.drawImage(img, desplazamientoX, desplazamientoY, anchoFinal, altoFinal);
  ctx.restore();

  // Borde sutil
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 2;
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(x, y, ancho, alto, radioBorde);
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, ancho, alto);
  }
  ctx.restore();
}

function formatearFecha(fecha?: string): string {
  if (!fecha) return '';
  const partes = fecha.split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }
  return fecha;
}

/**
 * Dibuja el logo oficial de AK Producciones abajo a la izquierda.
 */
function dibujarLogoAk(ctx: CanvasRenderingContext2D, x: number, y: number, colorAcento: string) {
  ctx.save();
  // Caja de isotipo AK
  ctx.fillStyle = colorAcento || '#d4a574';
  if (typeof (ctx as any).roundRect === 'function') {
    ctx.beginPath();
    (ctx as any).roundRect(x, y - 32, 44, 38, 6);
    ctx.fill();
  } else {
    ctx.fillRect(x, y - 32, 44, 38);
  }

  // Letras AK
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AK', x + 22, y - 13);

  // Texto "PRODUCCIONES"
  ctx.fillStyle = '#27272a';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('PRODUCCIONES', x + 52, y - 13);
  ctx.restore();
}

/**
 * Devuelve la lámina de 10x15 pegada y personalizada, lista para subir o imprimir.
 */
export async function componerTiraDeFotos(datos: DatosDeLaTira): Promise<string> {
  const {
    fotos,
    nombreDelEvento,
    nombreHomenajeado,
    motivoDelEvento,
    fechaDelEvento,
    colorDeAcento = '#d4a574',
    colorFondo,
    imagenFondoUrl,
    textoDeMarca,
  } = datos;

  if (!fotos || fotos.length === 0) {
    throw new Error('No hay fotos para armar el recuerdo.');
  }

  const imagenes = await Promise.all(fotos.map(cargarImagen));

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la hoja del recuerdo.');

  // ── 1. Fondo decorado de la fiesta ──
  if (imagenFondoUrl) {
    try {
      const imgFondo = await cargarImagen(imagenFondoUrl);
      dibujarRecortada(ctx, imgFondo, 0, 0, ANCHO, ALTO, 0);
    } catch {
      ctx.fillStyle = colorFondo || '#faf7f2';
      ctx.fillRect(0, 0, ANCHO, ALTO);
    }
  } else if (colorFondo) {
    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  } else {
    // Fondo suave degradado sutil con tono de la fiesta
    const grad = ctx.createLinearGradient(0, 0, 0, ALTO);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#f8f6f0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }

  // ── 2. Distribución de fotos según plantilla o cantidad ──
  const anchoTotal = ANCHO - MARGEN * 2;
  const layout = datos.printLayout || (imagenes.length === 1 ? 'single_photo' : imagenes.length >= 4 ? 'strip_4' : 'strip_3');

  if (layout === 'single_photo' || imagenes.length === 1) {
    // ── Plantilla Single Photo (1 sola foto grande arriba) ──
    const altoFotoGrande = 1100;
    dibujarRecortada(ctx, imagenes[0], MARGEN, MARGEN, anchoTotal, altoFotoGrande, 12);
  } else if (layout === 'strip_4' || imagenes.length >= 4) {
    // ── Plantilla Strip 4 (cuadrícula 2x2 de 4 fotos) ──
    const anchoFoto = (anchoTotal - SEPARACION) / 2;
    const altoFoto = (1140 - SEPARACION) / 2;
    dibujarRecortada(ctx, imagenes[0], MARGEN, MARGEN, anchoFoto, altoFoto, 12);
    dibujarRecortada(ctx, imagenes[1] || imagenes[0], MARGEN + anchoFoto + SEPARACION, MARGEN, anchoFoto, altoFoto, 12);
    dibujarRecortada(ctx, imagenes[2] || imagenes[0], MARGEN, MARGEN + altoFoto + SEPARACION, anchoFoto, altoFoto, 12);
    dibujarRecortada(ctx, imagenes[3] || imagenes[0], MARGEN + anchoFoto + SEPARACION, MARGEN + altoFoto + SEPARACION, anchoFoto, altoFoto, 12);
  } else {
    // ── Plantilla Strip 3 (1 grande arriba + 2 chicas abajo) ──
    const altoFotoGrande = 640;
    const altoFotosChicas = 480;
    const anchoFotoChica = (anchoTotal - SEPARACION) / 2;
    const yFotosChicas = MARGEN + altoFotoGrande + SEPARACION;

    dibujarRecortada(ctx, imagenes[0], MARGEN, MARGEN, anchoTotal, altoFotoGrande, 12);
    dibujarRecortada(ctx, imagenes[1] || imagenes[0], MARGEN, yFotosChicas, anchoFotoChica, altoFotosChicas, 12);
    dibujarRecortada(ctx, imagenes[2] || imagenes[0], MARGEN + anchoFotoChica + SEPARACION, yFotosChicas, anchoFotoChica, altoFotosChicas, 12);
  }

  // ── 3. Pie personalizado ──
  const pieY = 1200;
  const centroX = ANCHO / 2;

  // Línea divisoria decorativa sutil
  ctx.save();
  const gradLinea = ctx.createLinearGradient(MARGEN + 80, 0, ANCHO - MARGEN - 80, 0);
  gradLinea.addColorStop(0, 'rgba(0,0,0,0)');
  gradLinea.addColorStop(0.5, colorDeAcento || '#d4a574');
  gradLinea.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.strokeStyle = gradLinea;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGEN + 80, pieY + 20);
  ctx.lineTo(ANCHO - MARGEN - 80, pieY + 20);
  ctx.stroke();
  ctx.restore();

  // Nombre del homenajeado en letra manuscrita grande
  const nombreParaMostrar = nombreHomenajeado?.trim() || (nombreDelEvento && !nombreDelEvento.toLowerCase().includes('evento') ? nombreDelEvento.trim() : '');

  if (nombreParaMostrar) {
    ctx.save();
    ctx.fillStyle = '#18181b';
    ctx.font = 'italic 700 68px "Dancing Script", "Caveat", "Great Vibes", "Brush Script MT", "Segoe Script", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nombreParaMostrar, centroX, pieY + 110, anchoTotal - 60);
    ctx.restore();
  }

  // Motivo del evento debajo (ej: "Mis 15 Años", "Nuestra Boda")
  const motivoParaMostrar = motivoDelEvento?.trim() || (nombreDelEvento && nombreDelEvento !== nombreParaMostrar ? nombreDelEvento.trim() : '');
  if (motivoParaMostrar) {
    ctx.save();
    ctx.fillStyle = '#52525b';
    ctx.font = '600 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(motivoParaMostrar, centroX, pieY + 190, anchoTotal - 60);
    ctx.restore();
  }

  // Fecha del evento
  const fechaStr = formatearFecha(fechaDelEvento);
  if (fechaStr) {
    ctx.save();
    ctx.fillStyle = '#71717a';
    ctx.font = '500 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fechaStr, centroX, pieY + 245);
    ctx.restore();
  }

  // Logo de AK abajo a la izquierda
  dibujarLogoAk(ctx, MARGEN + 10, ALTO - MARGEN - 10, colorDeAcento);

  // Logo del cliente o texto de marca a la derecha
  if (datos.logoUrl) {
    try {
      const imgLogo = await cargarImagen(datos.logoUrl);
      dibujarRecortada(ctx, imgLogo, ANCHO - MARGEN - 120, ALTO - MARGEN - 50, 110, 44, 4);
    } catch {
      if (textoDeMarca) {
        ctx.save();
        ctx.fillStyle = '#a1a1aa';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(textoDeMarca.toUpperCase(), ANCHO - MARGEN - 10, ALTO - MARGEN - 10);
        ctx.restore();
      }
    }
  } else if (textoDeMarca) {
    ctx.save();
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(textoDeMarca.toUpperCase(), ANCHO - MARGEN - 10, ALTO - MARGEN - 10);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
