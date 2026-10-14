export interface RectanguloUI {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PosicionAsistente {
  bottom: number;
  right: number;
}

const MARGEN = 12;
const SEPARACION = 12;

function intersecta(a: RectanguloUI, b: RectanguloUI): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function elegirPosicionAsistente(
  viewport: { width: number; height: number },
  size: { width: number; height: number },
  preferida: PosicionAsistente,
  obstaculos: RectanguloUI[],
): PosicionAsistente {
  const maxRight = Math.max(MARGEN, viewport.width - size.width - MARGEN);
  const maxBottom = Math.max(MARGEN, viewport.height - size.height - MARGEN);
  const clamp = (value: number, max: number) => Math.min(max, Math.max(MARGEN, value));
  const inicial = { bottom: clamp(preferida.bottom, maxBottom), right: clamp(preferida.right, maxRight) };
  const rect = ({ bottom, right }: PosicionAsistente): RectanguloUI => ({
    left: viewport.width - right - size.width,
    right: viewport.width - right,
    top: viewport.height - bottom - size.height,
    bottom: viewport.height - bottom,
  });
  const libres = (p: PosicionAsistente) => !obstaculos.some((o) => intersecta(rect(p), o));

  if (libres(inicial)) return inicial;

  const candidatos = new Map<string, PosicionAsistente>();
  const agregar = (bottom: number, right: number) => {
    const p = { bottom: clamp(bottom, maxBottom), right: clamp(right, maxRight) };
    candidatos.set(`${p.bottom}:${p.right}`, p);
  };
  for (const o of obstaculos) {
    agregar(viewport.height - o.top + SEPARACION, inicial.right);
    agregar(viewport.height - o.bottom - size.height - SEPARACION, inicial.right);
    agregar(inicial.bottom, viewport.width - o.left + SEPARACION);
    agregar(inicial.bottom, viewport.width - o.right - size.width - SEPARACION);
  }

  return [...candidatos.values()]
    .filter(libres)
    .sort((a, b) => Math.hypot(a.bottom - inicial.bottom, a.right - inicial.right)
      - Math.hypot(b.bottom - inicial.bottom, b.right - inicial.right))[0] ?? inicial;
}
