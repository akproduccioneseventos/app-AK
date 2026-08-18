/**
 * El panel de presencia digital no puede mostrar números inventados.
 *
 * Qué pasaba: mostraba 1420 seguidores en Instagram, 2850 en Facebook, 48
 * seguidores nuevos por semana, 5240 de alcance, 14,2% de crecimiento y una
 * ficha de Google con 4,9 de puntaje y 38 opiniones. Ninguno existía: estaban
 * escritos a mano. Y la tarea diaria los guardaba, así que el historial de
 * crecimiento era falso de punta a punta y parecía real porque se movía.
 *
 * Regla: si no se midió, va vacío y la pantalla lo dice. Un número inventado es
 * peor que un casillero vacío, porque se toman decisiones con él.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildDailySnapshots } from '@/lib/presencia-digital/metricas-historicas';

const RAIZ = process.cwd();

describe('La foto diaria de las redes', () => {
  const snapshots = buildDailySnapshots({
    dateIso: '2026-08-18',
    connections: [
      { platform: 'Instagram', isConnected: true } as any,
      { platform: 'Facebook', isConnected: true } as any,
    ],
    posts: [],
    adsSummary: null,
    leadsCountToday: 0,
    contractsCountToday: 0,
    revenueToday: 0,
    existingSnapshots: [],
  } as any);

  it('no guarda seguidores inventados', () => {
    expect(snapshots.every((s) => s.followers === null)).toBe(true);
  });

  it('no guarda un alcance calculado a ojo', () => {
    expect(snapshots.every((s) => s.reach === null)).toBe(true);
  });

  it('sigue guardando lo que sí se cuenta de verdad', () => {
    // Las interacciones y la cantidad de posteos salen de los posteos reales,
    // así que esos no se tocan.
    expect(snapshots.every((s) => typeof s.interactions === 'number')).toBe(true);
    expect(snapshots.every((s) => typeof s.postsCount === 'number')).toBe(true);
  });
});

describe('Los números grandes del panel', () => {
  const accion = readFileSync(join(RAIZ, 'src/app/actions/presencia-digital.ts'), 'utf-8');
  const historico = readFileSync(
    join(RAIZ, 'src/lib/presencia-digital/metricas-historicas.ts'),
    'utf-8',
  );

  // Los que estaban escritos a mano y se mostraban como medidos.
  const INVENTADOS = ['1420', '2850', '5240', '14.2', '4.9', '2450', '1200'];

  it.each(INVENTADOS)('ya no aparece el número inventado %s', (numero) => {
    // Se mira sólo lo que se devuelve, no los comentarios que explican el
    // porqué: ahí los números aparecen a propósito.
    const sinComentarios = accion.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(sinComentarios).not.toContain(numero);
  });

  it('el histórico tampoco los tiene', () => {
    const sinComentarios = historico.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const numero of ['1420', '2850', '680', '210', '980']) {
      expect(sinComentarios).not.toContain(numero);
    }
  });

  it('la pantalla sabe mostrar "sin dato" en vez de romperse', () => {
    const pantalla = readFileSync(
      join(RAIZ, 'src/app/(app)/empresa/presencia-digital/presencia-digital-client.tsx'),
      'utf-8',
    );
    expect(pantalla).toContain('Sin dato');
    expect(pantalla).toContain('totalFollowers === null');
    expect(pantalla).toContain('googleRating === null');
  });
});
