/**
 * @fileOverview El QR que se baja para guardar o imprimir (orden 147). El canvas de pantalla trae el
 * código pegado al borde y con módulos diminutos (el de la entrada, de 57 módulos en 170 px, da ~3 px
 * por módulo); el lector de la app (html5-qrcode) no lo leía en algunos casos. Acá se arma un archivo
 * nuevo con zona blanca de seguridad (4 módulos) y módulos de tamaño ENTERO (nítidos, sin suavizado).
 *
 * Se reconstruye desde los píxeles del canvas (sólo se mira, no se toca el texto del código ni el
 * token). Si no se logra interpretar el canvas, queda el respaldo: copia ampliada por un entero
 * (vecino más cercano) con borde blanco, nunca el canvas pelado.
 */

export interface ContextoDeCanvas {
  fillStyle: any;
  imageSmoothingEnabled?: boolean;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  drawImage?: (origen: any, x: number, y: number, w: number, h: number) => void;
  getImageData?: (x: number, y: number, w: number, h: number) => { data: ArrayLike<number> };
}
export interface CanvasLike {
  width: number;
  height: number;
  getContext: (tipo: '2d') => ContextoDeCanvas | null;
}

export interface OpcionesQrParaDescargar {
  /** Lado mínimo aproximado del archivo, en píxeles. */
  ladoDeseado?: number;
  /** Zona blanca de seguridad, en módulos. El estándar pide 4. */
  zonaEnModulos?: number;
  /** Cómo se crea un canvas nuevo (para pruebas). */
  crearCanvas?: (ancho: number, alto: number) => CanvasLike;
}

const LADO_DESEADO = 640;
const ZONA_EN_MODULOS = 4;

function crearCanvasDelNavegador(ancho: number, alto: number): CanvasLike {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  return c as unknown as CanvasLike;
}

/** Respaldo: copia ampliada por un entero, vecino más cercano, con borde blanco proporcional. */
export function conZonaBlanca(origen: CanvasLike, opciones: OpcionesQrParaDescargar = {}): CanvasLike {
  const crear = opciones.crearCanvas || crearCanvasDelNavegador;
  const lado = opciones.ladoDeseado || LADO_DESEADO;
  const escala = Math.max(3, Math.ceil(lado / Math.max(1, origen.width)));
  const margen = 32 * escala;
  const ancho = origen.width * escala + margen * 2;
  const alto = origen.height * escala + margen * 2;
  const destino = crear(ancho, alto);
  const ctx = destino.getContext('2d');
  if (!ctx) return origen;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, ancho, alto);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage?.(origen, margen, margen, origen.width * escala, origen.height * escala);
  return destino;
}

/** Lee el canvas y devuelve la grilla de módulos (true = oscuro), o null si no se entiende. */
export function leerModulos(origen: CanvasLike): boolean[][] | null {
  const ctx = origen.getContext('2d');
  const w = origen.width;
  const h = origen.height;
  if (!ctx?.getImageData || w < 21 || h < 21) return null;
  let datos: ArrayLike<number>;
  try { datos = ctx.getImageData(0, 0, w, h).data; } catch { return null; }
  const oscuro = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    const a = datos[i + 3] / 255;
    return (0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2]) * a + 255 * (1 - a) < 128;
  };
  let izq = w, arr = h, der = -1, aba = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!oscuro(x, y)) continue;
      if (x < izq) izq = x;
      if (x > der) der = x;
      if (y < arr) arr = y;
      if (y > aba) aba = y;
    }
  }
  if (der < 0) return null;
  const ancho = der - izq + 1;
  const alto = aba - arr + 1;
  if (Math.abs(ancho - alto) > 2) return null;
  // El tamaño (en módulos) no se adivina midiendo un borde: con módulos de ~3 px un píxel de error lo
  // corre varios módulos. Se prueba cada tamaño posible (21, 25, ... 177) y gana el que mejor calza con
  // las tres esquinas fijas del QR y con las dos líneas de puntos alternados (fila y columna 6).
  const lado = (n: number) => ancho / n;
  const muestrear = (n: number) => {
    const l = lado(n);
    const g: boolean[][] = [];
    for (let f = 0; f < n; f++) {
      const fila: boolean[] = [];
      for (let c = 0; c < n; c++) fila.push(oscuro(Math.floor(izq + (c + 0.5) * l), Math.floor(arr + (f + 0.5) * l)));
      g.push(fila);
    }
    return g;
  };
  const puntaje = (g: boolean[][]) => {
    const n = g.length;
    let bien = 0, total = 0;
    const origenes = [[0, 0], [0, n - 7], [n - 7, 0]];
    for (const [f0, c0] of origenes) {
      for (let f = 0; f < 7; f++) for (let c = 0; c < 7; c++) {
        total++;
        if (g[f0 + f][c0 + c] === (Math.max(Math.abs(f - 3), Math.abs(c - 3)) !== 2)) bien++;
      }
    }
    for (let i = 8; i <= n - 9; i++) {
      total += 2;
      if (g[6][i] === (i % 2 === 0)) bien++;
      if (g[i][6] === (i % 2 === 0)) bien++;
    }
    return bien / total;
  };
  let mejor: boolean[][] | null = null;
  let mejorPuntaje = 0;
  for (let n = 21; n <= 177; n += 4) {
    const g = muestrear(n);
    const p = puntaje(g);
    if (p > mejorPuntaje) { mejorPuntaje = p; mejor = g; }
  }
  return mejorPuntaje >= 0.95 ? mejor : null;
}

/** El archivo a descargar: módulos enteros y nítidos, con zona blanca. Nunca el canvas pelado. */
export function qrParaDescargar(origen: CanvasLike, opciones: OpcionesQrParaDescargar = {}): CanvasLike {
  const crear = opciones.crearCanvas || crearCanvasDelNavegador;
  const zona = opciones.zonaEnModulos || ZONA_EN_MODULOS;
  const grilla = leerModulos(origen);
  if (!grilla) return conZonaBlanca(origen, opciones);
  const n = grilla.length;
  const px = Math.max(8, Math.ceil((opciones.ladoDeseado || LADO_DESEADO) / (n + zona * 2)));
  const lado = (n + zona * 2) * px;
  const destino = crear(lado, lado);
  const ctx = destino.getContext('2d');
  if (!ctx) return conZonaBlanca(origen, opciones);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, lado, lado);
  ctx.fillStyle = '#000000';
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      if (grilla[f][c]) ctx.fillRect((c + zona) * px, (f + zona) * px, px, px);
    }
  }
  return destino;
}
