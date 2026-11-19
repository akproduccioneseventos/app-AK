export interface TamanoAuditoria {
  nombre: string;
  width: number;
  height: number;
}

export const TAMANOS_AUDITORIA: TamanoAuditoria[] = [
  { nombre: '390x844', width: 390, height: 844 },
  { nombre: '820x1180', width: 820, height: 1180 },
  { nombre: '1440x1000', width: 1440, height: 1000 },
];

export interface FallaVisual {
  regla: 'desborde' | 'palabra-por-palabra' | 'contraste' | 'simbolo-roto';
  elemento: string;
  detalle: string;
}

const SIMBOLOS_ROTOS_RE = /(?:\u00C3[\u0080-\u00BF]|\u00E2[\u0080-\u00BF]{1,2}|\uFFFD|\u2605\s*RECOMENDADO|\u00E2\u02DC\u2026|\u00E2\u20AC\u0153|\u00C2\u00BF|\u00C2\u00A1)/;

export function parseRgbColor(colorStr: string): [number, number, number, number] | null {
  const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (!m) {
    const hex = colorStr.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!hex) return null;
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] !== undefined ? Number(m[4]) : 1];
}

function luminanciaRelativa(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function ratioContraste(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = luminanciaRelativa(fg[0], fg[1], fg[2]);
  const l2 = luminanciaRelativa(bg[0], bg[1], bg[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function tieneSimboloRoto(texto: string): boolean {
  return SIMBOLOS_ROTOS_RE.test(texto);
}

/**
 * Audita un Document (JSDOM o navegador) contra las 4 reglas de la Orden 313.
 * En entornos JSDOM sin layout real, lee también estilos inline (`width`, `left`, `color`, `backgroundColor`)
 * cuando `getBoundingClientRect().width === 0`.
 */
export function auditarDocumentoVisual(doc: Document, innerWidth: number): FallaVisual[] {
  const fallas: FallaVisual[] = [];
  const win = doc.defaultView;

  const docScroll = doc.documentElement?.scrollWidth || 0;
  if (docScroll > innerWidth + 1) {
    fallas.push({
      regla: 'desborde',
      elemento: 'document.documentElement',
      detalle: `scrollWidth (${docScroll}) > innerWidth (${innerWidth})`,
    });
  }

  const bodyText = (doc.body?.textContent || '').trim();
  if (tieneSimboloRoto(bodyText)) {
    const match = bodyText.match(SIMBOLOS_ROTOS_RE);
    fallas.push({
      regla: 'simbolo-roto',
      elemento: 'body',
      detalle: `Símbolo roto detectado: "${match?.[0] || ''}"`,
    });
  }

  const getStyle = (el: HTMLElement) => (win ? win.getComputedStyle(el) : el.style);

  const getFondoEfectivo = (el: HTMLElement): [number, number, number] => {
    let cur: HTMLElement | null = el;
    while (cur) {
      const bgStr = getStyle(cur).backgroundColor || cur.style.backgroundColor || '';
      const parsed = parseRgbColor(bgStr);
      if (parsed && parsed[3] > 0.1) {
        return [parsed[0], parsed[1], parsed[2]];
      }
      cur = cur.parentElement;
    }
    return [255, 255, 255];
  };

  const elementos = Array.from(doc.querySelectorAll('h1,h2,h3,h4,p,span,a,button,input,select,textarea,label')) as HTMLElement[];
  for (const el of elementos) {
    const style = getStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;

    const rect = el.getBoundingClientRect();
    const inlineLeft = parseFloat(el.style.left || '0') || 0;
    const inlineWidth = parseFloat(el.style.width || '0') || 0;
    const widthEfectivo = rect.width > 0 ? rect.width : inlineWidth;
    const rightEfectivo = rect.right > 0 ? rect.right : inlineLeft + inlineWidth;

    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();

    // 1. Desborde horizontal en botones, campos o títulos
    if (['button', 'input', 'select', 'textarea', 'h1', 'h2', 'h3'].includes(tag)) {
      if (rightEfectivo > innerWidth + 1) {
        fallas.push({
          regla: 'desborde',
          elemento: `${tag}:${text.slice(0, 25)}`,
          detalle: `right (${Math.round(rightEfectivo)}) > innerWidth (${innerWidth})`,
        });
      }
    }

    // 2. Texto palabra por palabra (> 3 palabras con ancho < 90px)
    if (['p', 'h1', 'h2', 'h3', 'h4'].includes(tag) && text.length > 0) {
      const palabras = text.split(/\s+/).filter(Boolean);
      if (palabras.length > 3 && widthEfectivo > 0 && widthEfectivo < 90) {
        fallas.push({
          regla: 'palabra-por-palabra',
          elemento: `${tag}:${text.slice(0, 25)}`,
          detalle: `${palabras.length} palabras en ancho ${Math.round(widthEfectivo)}px (< 90px)`,
        });
      }
    }

    // 3. Contraste mínimo (3:1 títulos, 4.5:1 texto)
    if (text.length > 0) {
      const fgStr = style.color || el.style.color || '';
      const fg = parseRgbColor(fgStr);
      if (fg && fg[3] > 0.1) {
        const bg = getFondoEfectivo(el);
        const ratio = ratioContraste([fg[0], fg[1], fg[2]], bg);
        const esTitulo = ['h1', 'h2', 'h3', 'h4'].includes(tag);
        const minRatio = esTitulo ? 3 : 4.5;
        if (ratio < minRatio) {
          fallas.push({
            regla: 'contraste',
            elemento: `${tag}:${text.slice(0, 25)}`,
            detalle: `Contraste ${ratio.toFixed(2)}:1 (< ${minRatio}:1)`,
          });
        }
      }
    }
  }

  return fallas;
}
