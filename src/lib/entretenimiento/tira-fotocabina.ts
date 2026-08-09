/**
 * Armado de la tira de la fotocabina.
 *
 * La fotocabina saca una tanda de fotos (3 por defecto, como las cabinas
 * clasicas) y despues las pega en una sola imagen. Esa imagen es la que se sube
 * al muro o la que se manda a imprimir.
 *
 * El formato es 2:3 (1200x1800), que entra derecho en una hoja de 10x15 sin
 * tener que cortar nada en plena fiesta. La tira finita de 5x15 se descarto a
 * proposito: obliga a una impresora con cortadora.
 */

export const FOTOS_POR_TANDA = 3;

/**
 * La primera cuenta es larga a proposito: el invitado recien se para frente a
 * la camara, acomoda a los que vienen con el y busca la pose. Las cabinas
 * comerciales hacen lo mismo y despues acortan, porque para la segunda y la
 * tercera la gente ya esta ubicada y una espera larga aburre y hace cola.
 */
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
const ALTO_PIE = 190;

export interface DatosDeLaTira {
  /** Fotos ya capturadas, en orden, como data URL. */
  fotos: string[];
  nombreDelEvento: string;
  fechaDelEvento: string;
  /** Color de la marca de la estacion, para el pie. */
  colorDeAcento: string;
  /** Texto chico del pie. Si viene vacio no se dibuja. */
  textoDeMarca?: string;
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer una de las fotos de la tanda.'));
    img.src = src;
  });
}

/**
 * Dibuja la foto recortada al centro del hueco, sin deformarla. Una foto
 * estirada se nota en el papel y es lo primero que hace ver barato el recuerdo.
 */
function dibujarRecortada(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  ancho: number,
  alto: number,
) {
  const escala = Math.max(ancho / img.width, alto / img.height);
  const anchoFinal = img.width * escala;
  const altoFinal = img.height * escala;
  const desplazamientoX = x + (ancho - anchoFinal) / 2;
  const desplazamientoY = y + (alto - altoFinal) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, ancho, alto);
  ctx.clip();
  ctx.drawImage(img, desplazamientoX, desplazamientoY, anchoFinal, altoFinal);
  ctx.restore();
}

function formatearFecha(fecha: string): string {
  if (!fecha) return '';
  const partes = fecha.split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }
  return fecha;
}

/**
 * Devuelve la tanda pegada en una sola imagen, lista para subir o imprimir.
 * Tira si alguna foto no se puede leer: es preferible avisar a mandar a
 * imprimir una hoja con un hueco en blanco.
 */
export async function componerTiraDeFotos(datos: DatosDeLaTira): Promise<string> {
  const { fotos, nombreDelEvento, fechaDelEvento, colorDeAcento, textoDeMarca } = datos;
  if (fotos.length === 0) {
    throw new Error('No hay fotos para armar el recuerdo.');
  }

  const imagenes = await Promise.all(fotos.map(cargarImagen));

  const canvas = document.createElement('canvas');
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar la hoja del recuerdo.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  const anchoDeFoto = ANCHO - MARGEN * 2;
  const alturaDisponible = ALTO - MARGEN * 2 - ALTO_PIE - SEPARACION * (imagenes.length - 1);
  const altoDeFoto = alturaDisponible / imagenes.length;

  imagenes.forEach((img, indice) => {
    const y = MARGEN + indice * (altoDeFoto + SEPARACION);
    dibujarRecortada(ctx, img, MARGEN, y, anchoDeFoto, altoDeFoto);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGEN, y, anchoDeFoto, altoDeFoto);
  });

  const pieY = ALTO - ALTO_PIE;
  ctx.fillStyle = colorDeAcento || '#d97706';
  ctx.fillRect(0, pieY, ANCHO, 8);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#18181b';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(nombreDelEvento || 'Evento AK', ANCHO / 2, pieY + 82, ANCHO - MARGEN * 2);

  const fecha = formatearFecha(fechaDelEvento);
  if (fecha) {
    ctx.fillStyle = '#71717a';
    ctx.font = '36px sans-serif';
    ctx.fillText(fecha, ANCHO / 2, pieY + 134);
  }

  if (textoDeMarca) {
    ctx.fillStyle = '#a1a1aa';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(textoDeMarca.toUpperCase(), ANCHO / 2, pieY + 172);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}
