import type { ColorPalette, PaletaTipoPropuesta } from '@/types/fiesta';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace(/^#/, '').trim();
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (!/^[0-9a-fA-F]{6}$/.test(fullHex)) {
    // Default quinceañera rose si el color ingresado no es válido
    return { r: 236, g: 72, b: 153 };
  }
  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generarPaletaPorTipo(colorBase: string, tipo: PaletaTipoPropuesta): ColorPalette {
  const { r, g, b } = hexToRgb(colorBase);
  const { h, s, l } = rgbToHsl(r, g, b);
  const primaryHex = hslToHex(h, s, l);

  switch (tipo) {
    case 'analoga':
      return {
        primary: primaryHex,
        secondary: hslToHex(h + 30, Math.min(Math.max(s, 0.35), 0.55), 0.22),
        accent: hslToHex(h - 30, Math.min(s, 0.4), 0.92),
      };
    case 'contraste':
      return {
        primary: primaryHex,
        secondary: hslToHex(h + 180, Math.max(s, 0.6), 0.2),
        accent: hslToHex(h + 180, Math.max(s, 0.7), 0.85),
      };
    case 'suave':
    default:
      return {
        primary: hslToHex(h, Math.min(s * 0.75, 0.45), Math.max(l, 0.62)),
        secondary: hslToHex(h + 15, 0.15, 0.32),
        accent: hslToHex(h, 0.2, 0.95),
      };
  }
}

export function generarTresPaletas(colorBase: string): Record<PaletaTipoPropuesta, ColorPalette> {
  return {
    analoga: generarPaletaPorTipo(colorBase, 'analoga'),
    contraste: generarPaletaPorTipo(colorBase, 'contraste'),
    suave: generarPaletaPorTipo(colorBase, 'suave'),
  };
}
