export interface FallaPdf {
  pagina: number;
  motivo: string;
}

export interface ResultadoInspeccionPdf {
  ok: boolean;
  motor: 'pdfjs-dist' | 'fallback-estructural';
  paginas: number;
  paginasVacias: number[];
  desbordes: FallaPdf[];
  fallas: string[];
}

interface TextItemLike {
  str?: string;
  transform?: number[];
  width?: number;
}

function analizarPdfEstructural(bytes: Uint8Array): ResultadoInspeccionPdf {
  const textoLatin = Buffer.from(bytes).toString('latin1');
  if (!textoLatin.startsWith('%PDF-')) {
    return {
      ok: false,
      motor: 'fallback-estructural',
      paginas: 0,
      paginasVacias: [],
      desbordes: [],
      fallas: ['El archivo descargado no tiene encabezado PDF válido (%PDF-).'],
    };
  }

  const pageMatches = textoLatin.match(/\/Type\s*\/Page\b(?!s)/g) || [];
  const countMatches = [...textoLatin.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const paginas = pageMatches.length > 0 ? pageMatches.length : Math.max(0, ...countMatches, 0);

  const fallas: string[] = [];
  if (paginas === 0) {
    fallas.push('El PDF tiene 0 páginas.');
  }

  const mediaBoxMatch = textoLatin.match(/\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/);
  const anchoPagina = mediaBoxMatch ? Number(mediaBoxMatch[3]) - Number(mediaBoxMatch[1]) : 595;

  const textBlocks = [...textoLatin.matchAll(/\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*Tj/g)].map((m) => m[1]);
  const tieneTextoOStreams = textBlocks.some((t) => t.trim().length > 0) || /\/Subtype\s*\/Image\b/.test(textoLatin);
  const paginasVacias: number[] = [];
  if (paginas > 0 && !tieneTextoOStreams) {
    paginasVacias.push(1);
    fallas.push('El PDF no contiene texto ni imágenes visibles (página vacía).');
  }

  // En modo fallback estructural revisamos también si hay traslaciones Tm fuera del ancho
  const desbordes: FallaPdf[] = [];
  for (const tm of textoLatin.matchAll(/1\s+0\s+0\s+1\s+([\d.-]+)\s+([\d.-]+)\s+Tm/g)) {
    const x = Number(tm[1]);
    if (Number.isFinite(x) && x > anchoPagina + 2) {
      desbordes.push({ pagina: 1, motivo: `Texto posicionado en x=${x.toFixed(1)} > ancho=${anchoPagina.toFixed(1)}` });
      fallas.push(`Desborde de ancho en PDF (x=${x.toFixed(1)} > ${anchoPagina.toFixed(1)}).`);
      break;
    }
  }

  return {
    ok: fallas.length === 0,
    motor: 'fallback-estructural',
    paginas,
    paginasVacias,
    desbordes,
    fallas,
  };
}

export async function inspeccionarPdfBuffer(buffer: Buffer | Uint8Array): Promise<ResultadoInspeccionPdf> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength === 0) {
    return {
      ok: false,
      motor: 'fallback-estructural',
      paginas: 0,
      paginasVacias: [],
      desbordes: [],
      fallas: ['El archivo PDF descargado está vacío (0 bytes).'],
    };
  }

  try {
    // Carga dinámica para que typecheck y build no fallen si pdfjs-dist todavía no se instaló en node_modules.
    const modulo: string = 'pdfjs-dist/legacy/build/pdf.mjs';
    const pdfjs = (await import(/* webpackIgnore: true */ modulo)) as {
      getDocument: (src: { data: Uint8Array; disableWorker?: boolean }) => {
        promise: Promise<{
          numPages: number;
          getPage: (n: number) => Promise<{
            getViewport: (opts: { scale: number }) => { width: number; height: number };
            getTextContent: () => Promise<{ items: TextItemLike[] }>;
          }>;
        }>;
      };
    };

    const doc = await pdfjs.getDocument({ data: bytes, disableWorker: true }).promise;
    const paginas = doc.numPages;
    const paginasVacias: number[] = [];
    const desbordes: FallaPdf[] = [];
    const fallas: string[] = [];

    if (paginas === 0) {
      fallas.push('El PDF tiene 0 páginas.');
    }

    for (let i = 1; i <= paginas; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const items = (textContent.items || []).filter((it) => typeof it.str === 'string' && it.str.trim().length > 0);

      if (items.length === 0) {
        paginasVacias.push(i);
        fallas.push(`La página ${i} del PDF está vacía.`);
        continue;
      }

      for (const item of items) {
        const x = Array.isArray(item.transform) ? Number(item.transform[4] || 0) : 0;
        const w = Number(item.width || 0);
        if (x < -2 || x + w > viewport.width + 4) {
          desbordes.push({
            pagina: i,
            motivo: `"${(item.str || '').slice(0, 30)}" se sale del ancho (${Math.round(x + w)} > ${Math.round(viewport.width)})`,
          });
        }
      }
    }

    if (desbordes.length > 0) {
      fallas.push(`Desborde de ancho en PDF (${desbordes.length} elemento(s)): ${desbordes[0].motivo}`);
    }

    return {
      ok: fallas.length === 0,
      motor: 'pdfjs-dist',
      paginas,
      paginasVacias,
      desbordes,
      fallas,
    };
  } catch {
    return analizarPdfEstructural(bytes);
  }
}
