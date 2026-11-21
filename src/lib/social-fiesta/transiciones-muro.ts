import { PAREJO, SALIR, SUAVE } from '@/lib/motion';

export type TransicionMuro = 'fundido' | 'deslizar' | 'zoom' | 'polaroid' | 'al_ritmo';

export interface TransicionMuroMeta {
  id: TransicionMuro;
  nombre: string;
  descripcion: string;
  cssClass: string;
}

export const TRANSICIONES_MURO: TransicionMuroMeta[] = [
  {
    id: 'fundido',
    nombre: 'Fundido suave',
    descripcion: 'Aparición elegante sin sobresaltos.',
    cssClass: 'ak-transicion-fundido',
  },
  {
    id: 'deslizar',
    nombre: 'Deslizar lateral',
    descripcion: 'Entrada horizontal fluida y rápida.',
    cssClass: 'ak-transicion-deslizar',
  },
  {
    id: 'zoom',
    nombre: 'Zoom cinematográfico',
    descripcion: 'Acercamiento sutil de pantalla grande.',
    cssClass: 'ak-transicion-zoom',
  },
  {
    id: 'polaroid',
    nombre: 'Polaroid flotante',
    descripcion: 'Marco instantáneo con inclinación suave.',
    cssClass: 'ak-transicion-polaroid',
  },
  {
    id: 'al_ritmo',
    nombre: 'Al ritmo de la música',
    descripcion: 'Cambia y pulsa sincronizada con el modo audiorrítmico.',
    cssClass: 'ak-transicion-al-ritmo',
  },
];

export function normalizarTransicionMuro(value?: string | null): TransicionMuro {
  if (
    value === 'fundido' ||
    value === 'deslizar' ||
    value === 'zoom' ||
    value === 'polaroid' ||
    value === 'al_ritmo'
  ) {
    return value;
  }
  return 'fundido';
}

export function getTransicionMuroClass(value?: string | null): string {
  const id = normalizarTransicionMuro(value);
  return TRANSICIONES_MURO.find((t) => t.id === id)?.cssClass ?? 'ak-transicion-fundido';
}

export function getMotionVariantsParaTransicion(
  transicion: TransicionMuro,
  options: { index: number; kenBurns: boolean; reducedMotion: boolean; beatScale?: number }
) {
  const { index, kenBurns, reducedMotion, beatScale = 1 } = options;

  if (reducedMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 1 },
      transition: { duration: 0.01 },
    };
  }

  const kbScale = kenBurns ? [1, 1.04] : 1;
  const kbX = kenBurns ? [0, index % 2 === 0 ? 8 : -8] : 0;
  const kbY = kenBurns ? [0, index % 3 === 0 ? 6 : -6] : 0;

  switch (transicion) {
    case 'deslizar':
      return {
        initial: { opacity: 0, x: 24 },
        animate: {
          opacity: 1,
          x: kbX,
          y: kbY,
          scale: kbScale,
          transition: {
            opacity: { duration: 0.35, ease: SUAVE },
            x: { duration: 0.4, ease: SUAVE },
            scale: { duration: 6, ease: 'linear' },
            y: { duration: 6, ease: 'linear' },
          },
        },
        exit: { opacity: 0, x: -24, transition: { duration: 0.2, ease: SALIR } },
      };

    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: {
          opacity: 1,
          scale: kenBurns ? [0.98, 1.04] : 1,
          x: kbX,
          y: kbY,
          transition: {
            opacity: { duration: 0.4, ease: SUAVE },
            scale: { duration: 0.45, ease: SUAVE },
            x: { duration: 6, ease: 'linear' },
            y: { duration: 6, ease: 'linear' },
          },
        },
        exit: { opacity: 0, scale: 1.04, transition: { duration: 0.2, ease: SALIR } },
      };

    case 'polaroid':
      return {
        initial: { opacity: 0, y: 20, rotate: index % 2 === 0 ? -3 : 3, scale: 0.96 },
        animate: {
          opacity: 1,
          y: 0,
          rotate: index % 2 === 0 ? -1.5 : 1.5,
          scale: 1,
          transition: {
            duration: 0.45,
            ease: SUAVE,
          },
        },
        exit: {
          opacity: 0,
          y: -16,
          rotate: index % 2 === 0 ? 2 : -2,
          transition: { duration: 0.2, ease: SALIR },
        },
      };

    case 'al_ritmo':
      return {
        initial: { opacity: 0, scale: 0.94, y: 14 },
        animate: {
          opacity: 1,
          scale: beatScale,
          y: 0,
          transition: {
            opacity: { duration: 0.3, ease: SUAVE },
            y: { duration: 0.3, ease: SUAVE },
            scale: { duration: 0.18, ease: PAREJO },
          },
        },
        exit: { opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: SALIR } },
      };

    case 'fundido':
    default:
      return {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          scale: kbScale,
          x: kbX,
          y: kbY,
          transition: {
            opacity: { duration: 0.4, ease: SUAVE },
            scale: { duration: 6, ease: 'linear' },
            x: { duration: 6, ease: 'linear' },
            y: { duration: 6, ease: 'linear' },
          },
        },
        exit: { opacity: 0, transition: { duration: 0.2, ease: SALIR } },
      };
  }
}
