/**
 * Orden 127: la foto que se le muestra al cliente corresponde al plato que elige.
 *
 * Recorre TODOS los platos de `menus-catering.json` con la funcion REAL
 * (`getCateringDishImage`). Lo que suma sobre `la-foto-es-del-plato.test.ts` (que mira tres
 * platos sueltos): la regla vale para los 44 platos a la vez.
 *
 *  1. Cada plato muestra el archivo de ESE plato (`<su id>.jpeg|png`), salvo las excepciones
 *     declaradas abajo, escritas a mano y con su motivo: no se copia la tabla de la app.
 *  2. Dos platos distintos no comparten la misma foto.
 *  3. El archivo que se muestra existe en `public/` (no apunta a la nada).
 *  4. La pizarra vacia de la mesa bufet no aparece en ningun plato.
 */
import fs from 'node:fs';
import path from 'node:path';
import { getCateringDishImage } from '@/lib/catering/menu-images';
import menus from '@/data/menus-catering.json';

const BASE = '/catering/menus/xv';
const PIZARRA_VACIA = `${BASE}/dish_main_19.jpeg`;

// Excepciones DECLARADAS a proposito. Todo plato que no figure aqui debe mostrar su propio archivo.
const EXCEPCIONES: Record<string, string> = {
  // Los ARCHIVOS estan nombrados al reves (verificado a ojo el 7/10/2026): _22 es la tabla de
  // fiambres y _21 son los mariscos fritos. Cada nombre lleva su comida.
  dish_entrada_21: `${BASE}/dish_entrada_22.jpeg`, // PICADA CRIOLLA = tabla de fiambres
  dish_entrada_22: `${BASE}/dish_entrada_21.jpeg`, // PICADA DE MAR = mariscos fritos
  // Su archivo propio es una pizarra negra sin comida: va la foto de ejemplo de la mesa de AK.
  dish_main_19: '/media/catalogo-servicios/catering-mesa-ak-01.jpeg',
  // Su foto real es un .png.
  dish_child_1: `${BASE}/dish_child_1.png`,
};

type Plato = { id: string; name: string; imageUrl?: string };
const platos: Plato[] = (menus as any[]).flatMap((m) => m.items as Plato[]);

describe('cada plato muestra la foto de ese plato (orden 127)', () => {
  it('el catalogo tiene los platos que se esperan (el recorrido no corre en vacio)', () => {
    expect(platos.length).toBeGreaterThanOrEqual(40);
    expect(platos.map((p) => p.id)).toEqual(expect.arrayContaining(['dish_entrada_21', 'dish_main_19', 'dish_child_1']));
  });

  it.each(platos.map((p) => [p.id, p.name, p] as const))('%s (%s) muestra su propia foto', (id, _n, plato) => {
    const esperada = EXCEPCIONES[id] ?? `${BASE}/${id}.jpeg`;
    expect(getCateringDishImage(plato)).toBe(esperada);
  });

  it('dos platos distintos nunca comparten la misma foto', () => {
    const porFoto = new Map<string, string[]>();
    for (const p of platos) {
      const foto = getCateringDishImage(p);
      if (!foto) continue;
      porFoto.set(foto, [...(porFoto.get(foto) || []), p.id]);
    }
    const repetidas = [...porFoto.entries()].filter(([, ids]) => ids.length > 1);
    expect(repetidas).toEqual([]);
  });

  it('la foto que se muestra existe como archivo', () => {
    const faltan = platos
      .map((p) => ({ id: p.id, foto: getCateringDishImage(p) }))
      .filter((x) => x.foto && x.foto.startsWith('/'))
      .filter((x) => !fs.existsSync(path.join(process.cwd(), 'public', x.foto!)))
      .map((x) => `${x.id} -> ${x.foto}`);
    expect(faltan).toEqual([]);
  });

  it('ningun plato muestra la pizarra vacia, ni siquiera el que la tiene guardada', () => {
    for (const p of platos) expect(getCateringDishImage(p)).not.toBe(PIZARRA_VACIA);
    const buffet = platos.find((p) => p.id === 'dish_main_19')!;
    expect(buffet.imageUrl).toBe(PIZARRA_VACIA); // sigue guardada asi en la base: lo que se prueba es lo que se muestra
    expect(getCateringDishImage(buffet)).not.toBe(buffet.imageUrl);
  });
});
