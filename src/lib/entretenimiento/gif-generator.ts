/**
 * Generador liviano de GIF animado en el navegador a partir de una secuencia de fotos.
 *
 * Crea una imagen GIF animada estándar sin requerir librerías pesadas externas,
 * ideal para que el invitado la descargue o comparta directo por WhatsApp.
 */

export interface OpcionesGif {
  ancho?: number;
  alto?: number;
  delayMs?: number;
  repetir?: number; // 0 = loop infinito
}

/**
 * Convierte un arreglo de imágenes (data URLs o ImageElements) en un GIF animado empaquetado.
 * Implementa codificación GIF89a optimizada en puro TypeScript.
 */
export async function generarGifDesdeImagenes(
  imagenesUrls: string[],
  opciones: OpcionesGif = {}
): Promise<string> {
  if (!imagenesUrls || imagenesUrls.length === 0) {
    throw new Error('Se requieren al menos 2 imágenes para armar un GIF animado.');
  }

  const {
    ancho = 600,
    alto = 800,
    delayMs = 400,
  } = opciones;

  // Cargar elementos de imagen
  const imgs = await Promise.all(
    imagenesUrls.map((src) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('No se pudo cargar una de las fotos para el GIF.'));
        img.src = src;
      });
    })
  );

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo inicializar el lienzo para el GIF.');

  // Encabezado GIF89a y bloques de control
  const framesData: ImageData[] = [];

  for (const img of imgs) {
    ctx.clearRect(0, 0, ancho, alto);
    // Dibujar recortado al centro
    const escala = Math.max(ancho / img.width, alto / img.height);
    const anchoFinal = img.width * escala;
    const altoFinal = img.height * escala;
    const dx = (ancho - anchoFinal) / 2;
    const dy = (alto - altoFinal) / 2;
    ctx.drawImage(img, dx, dy, anchoFinal, altoFinal);
    framesData.push(ctx.getImageData(0, 0, ancho, alto));
  }

  // Generar buffer GIF binario
  const bytes = codificarGif89a(framesData, ancho, alto, delayMs);
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'image/gif' });
  return URL.createObjectURL(blob);
}

/**
 * Codificador compacto GIF89a con paleta global de 256 colores.
 */
function codificarGif89a(
  frames: ImageData[],
  ancho: number,
  alto: number,
  delayMs: number
): Uint8Array {
  const buffer: number[] = [];

  const pushString = (str: string) => {
    for (let i = 0; i < str.length; i++) buffer.push(str.charCodeAt(i));
  };
  const pushShort = (val: number) => {
    buffer.push(val & 0xff);
    buffer.push((val >> 8) & 0xff);
  };

  // Header: GIF89a
  pushString('GIF89a');

  // Logical Screen Descriptor
  pushShort(ancho);
  pushShort(alto);
  // GCT Flag = 1, Color Res = 7 (8 bits), Sort = 0, GCT Size = 7 (256 colores)
  buffer.push(0xf7);
  buffer.push(0x00); // Background Color Index
  buffer.push(0x00); // Pixel Aspect Ratio

  // Paleta Global estándar 6x6x6 web safe + 40 escala de grises
  const palette: number[][] = [];
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette.push([Math.round((r * 255) / 5), Math.round((g * 255) / 5), Math.round((b * 255) / 5)]);
      }
    }
  }
  for (let i = 0; i < 40; i++) {
    const val = Math.round((i * 255) / 39);
    palette.push([val, val, val]);
  }
  while (palette.length < 256) palette.push([0, 0, 0]);

  // Escribir paleta global
  for (const [r, g, b] of palette) {
    buffer.push(r, g, b);
  }

  // Netscape Application Extension para Loop Infinito
  buffer.push(0x21, 0xff, 0x0b);
  pushString('NETSCAPE2.0');
  buffer.push(0x03, 0x01, 0x00, 0x00, 0x00); // sub-block: repeat forever

  const delayUnits = Math.max(1, Math.round(delayMs / 10)); // en centésimas de segundo

  // Cuadros
  for (const frame of frames) {
    // Graphic Control Extension
    buffer.push(0x21, 0xf9, 0x04);
    buffer.push(0x04); // Disposal Method = 1 (do not dispose), user input = 0, transparent = 0
    pushShort(delayUnits);
    buffer.push(0x00); // Transparent color index
    buffer.push(0x00); // Block terminator

    // Image Descriptor
    buffer.push(0x2c);
    pushShort(0); // Left
    pushShort(0); // Top
    pushShort(ancho);
    pushShort(alto);
    buffer.push(0x00); // Local Color Table Flag = 0

    // Quantizar frame a índices de paleta
    const data = frame.data;
    const indices: number[] = new Array(ancho * alto);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Mapeo rápido a la paleta 6x6x6
      const ri = Math.min(5, Math.round((r * 5) / 255));
      const gi = Math.min(5, Math.round((g * 5) / 255));
      const bi = Math.min(5, Math.round((b * 5) / 255));
      indices[p] = ri * 36 + gi * 6 + bi;
    }

    // LZW Compression
    buffer.push(0x08); // LZW Minimum Code Size (8 for 256 colors)
    comprimirLzw(indices, 8, buffer);
    buffer.push(0x00); // Block terminator
  }

  // Trailer
  buffer.push(0x3b);

  return new Uint8Array(buffer);
}

/**
 * Compresión LZW estándar para bloques GIF.
 */
function comprimirLzw(indices: number[], minCodeSize: number, output: number[]) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  const dictionary = new Map<string, number>();

  const initDict = () => {
    dictionary.clear();
    for (let i = 0; i < clearCode; i++) {
      dictionary.set(String(i), i);
    }
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  initDict();

  let curBit = 0;
  let curByte = 0;
  const subBlock: number[] = [];

  const writeBits = (code: number) => {
    let tempCode = code;
    let tempBits = codeSize;
    while (tempBits > 0) {
      curByte |= (tempCode & 1) << curBit;
      curBit++;
      tempCode >>= 1;
      tempBits--;
      if (curBit === 8) {
        subBlock.push(curByte);
        if (subBlock.length === 254) {
          output.push(subBlock.length);
          for (const b of subBlock) output.push(b);
          subBlock.length = 0;
        }
        curByte = 0;
        curBit = 0;
      }
    }
  };

  writeBits(clearCode);

  let prefix = String(indices[0]);
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const combined = prefix + ',' + k;
    if (dictionary.has(combined)) {
      prefix = combined;
    } else {
      writeBits(dictionary.get(prefix)!);
      if (nextCode < 4096) {
        dictionary.set(combined, nextCode++);
        if (nextCode === (1 << codeSize) && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode);
        initDict();
      }
      prefix = String(k);
    }
  }

  if (prefix !== '') {
    writeBits(dictionary.get(prefix)!);
  }
  writeBits(eoiCode);

  if (curBit > 0) {
    subBlock.push(curByte);
  }
  if (subBlock.length > 0) {
    output.push(subBlock.length);
    for (const b of subBlock) output.push(b);
  }
}
