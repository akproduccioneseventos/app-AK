import { getUruguayParts } from '@/lib/utils';
import type { SocialPlatform, SocialPost } from '@/types/social-media';

const NOMBRES_DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

export interface ResultadoMejorHorario {
  dia: string;
  diaNumero?: number;
  hora: number;
  horaFin?: number;
  promedio: number;
  basadoEn: number;
}

/**
 * Encuentra el mejor horario para publicar en base a los resultados históricos reales.
 * - Agrupa por día de la semana y franja de 2 horas en horario de Uruguay.
 * - Devuelve null si hay menos de 8 publicaciones con resultados de esa red.
 */
export function mejorHorario(
  posts: SocialPost[],
  red: SocialPlatform,
): ResultadoMejorHorario | null {
  if (!posts || !Array.isArray(posts)) return null;

  const validos = posts.filter(
    (p) =>
      p.platform === red &&
      p.performance &&
      (typeof p.performance.interactions === 'number' ||
        typeof p.performance.likes === 'number'),
  );

  // Menos de 8 publicaciones con resultados: no inventar un horario
  if (validos.length < 8) {
    return null;
  }

  const grupos = new Map<
    string,
    { diaNombre: string; diaNumero: number; franja: number; total: number; count: number }
  >();

  for (const post of validos) {
    const fecha = new Date(post.publishDate);
    if (isNaN(fecha.getTime())) continue;

    const { year, month, day, hour } = getUruguayParts(fecha);
    const diaNumero = new Date(year, month - 1, day).getDay();
    const diaNombre = NOMBRES_DIAS[diaNumero];
    const franja = Math.floor(hour / 2) * 2; // franja de dos horas: 0, 2, ..., 20, 22

    const clave = `${diaNumero}_${franja}`;
    const actual = grupos.get(clave) || {
      diaNombre,
      diaNumero,
      franja,
      total: 0,
      count: 0,
    };

    const interacciones =
      typeof post.performance?.interactions === 'number'
        ? post.performance.interactions
        : post.performance?.likes ?? 0;

    actual.total += interacciones;
    actual.count += 1;
    grupos.set(clave, actual);
  }

  if (grupos.size === 0) return null;

  let mejor: { diaNombre: string; diaNumero: number; franja: number; promedio: number } | null = null;

  for (const g of grupos.values()) {
    const promedio = g.total / g.count;
    if (!mejor || promedio > mejor.promedio) {
      mejor = {
        diaNombre: g.diaNombre,
        diaNumero: g.diaNumero,
        franja: g.franja,
        promedio,
      };
    }
  }

  if (!mejor) return null;

  return {
    dia: mejor.diaNombre,
    diaNumero: mejor.diaNumero,
    hora: mejor.franja,
    horaFin: (mejor.franja + 2) % 24,
    promedio: Math.round(mejor.promedio * 10) / 10,
    basadoEn: validos.length,
  };
}
