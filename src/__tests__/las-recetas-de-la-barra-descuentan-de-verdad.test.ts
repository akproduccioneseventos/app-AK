/**
 * La carta definitiva de 12 tragos del dueño (27/10/2026), con alcohol reducido (15 ml).
 * Botella = 750 ml, litro = 1000 ml. El descuento resta la cantidad tal cual del insumo con ese id,
 * así que cada ingrediente tiene que ser un insumo real y en su misma unidad.
 */
import fs from 'fs';
import path from 'path';
import { defaultCartaTragosData } from '@/lib/fiesta-defaults';

const insumos: Array<{ id: string; unidad: string }> = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/insumos.json'), 'utf8'),
);
const porId = new Map(insumos.map((i) => [i.id, i]));
const ML: Record<string, number> = { Botella: 750, Litro: 1000 };
const ALCOHOLES = ['ing-ron', 'ing-vodka', 'ing-gin', 'ing-fernet', 'ing-cana-uruguaya'];
const items = defaultCartaTragosData.items;
const ml = (id: string) => {
  const t = items.find((x) => x.id === id)!;
  return Object.fromEntries((t.recetaIngredientes || []).map((i) => [i.insumoId, Math.round(i.cantidad * ML[i.unidad] * 10) / 10]));
};

describe('La carta de 12 tragos descuenta de verdad', () => {
  it('son 12 tragos, sólo para mayores, con su receta sin alcohol guardada', () => {
    expect(items).toHaveLength(12);
    for (const t of items) {
      expect(t.soloMayores).toBe(true);
      expect((t.recetaSinAlcohol || []).length).toBeGreaterThan(0);
    }
  });

  it('cada trago tiene su foto en public', () => {
    for (const t of items) {
      expect(t.imageUrl).toMatch(/^\/images\/tragos\/\d\d_.+\.jpg$/);
      expect(fs.existsSync(path.join(process.cwd(), 'public', t.imageUrl!))).toBe(true);
    }
  });

  it('cada ingrediente es un insumo que existe, en su misma unidad', () => {
    for (const t of items) {
      for (const ing of t.recetaIngredientes || []) {
        const insumo = porId.get(ing.insumoId);
        expect({ trago: t.nombre, id: ing.insumoId, existe: !!insumo }).toEqual({ trago: t.nombre, id: ing.insumoId, existe: true });
        expect(ing.unidad).toBe(insumo!.unidad);
        expect(ing.cantidad).toBeGreaterThan(0);
        expect(ing.cantidad).toBeLessThan(1);
      }
    }
  });

  it('el alcohol principal es 15 ml en todos', () => {
    for (const t of items) {
      const alc = (t.recetaIngredientes || []).filter((i) => ALCOHOLES.includes(i.insumoId));
      expect(alc).toHaveLength(1);
      expect(Math.round(alc[0].cantidad * 750 * 10) / 10).toBe(15);
    }
  });

  it('la Caipirinha usa caña uruguaya y no vodka ni cachaça', () => {
    const r = ml('caipirinha');
    expect(r['ing-cana-uruguaya']).toBe(15);
    expect(r['ing-vodka']).toBeUndefined();
    expect(r['ing-cachaca']).toBeUndefined();
  });

  it('completar hasta 300 ml descuenta 300 menos lo demás y menos ~100 de hielo', () => {
    expect(ml('atomic-green')).toEqual({ 'ing-vodka': 15, 'ing-blue-curacao-sin-alcohol': 15, 'ing-naranja': 170 });
    expect(ml('arizona')).toEqual({ 'ing-vodka': 15, 'ing-naranja': 150, 'ing-jugo-anana': 30, 'ing-granadina-sin-alcohol': 5 });
    expect(ml('fernet-con-coca')).toEqual({ 'ing-fernet': 15, 'ing-coca': 185 });
  });

  it('las versiones con nombre propio sin alcohol', () => {
    const nombre = (id: string) => items.find((x) => x.id === id)!.nombreSinAlcohol;
    expect(nombre('fernet-con-coca')).toBe('Cola con naranja');
    expect(nombre('destornillador')).toBe('Naranjada');
    expect(nombre('ron-cola')).toBe('Cola con limón');
    expect(nombre('gin-con-pomelo')).toBe('Pomelo con limón');
  });

  it('no quedan los insumos de las recetas viejas', () => {
    for (const id of ['ing-pina-colada', 'ing-blue-curacao', 'ing-martini', 'ing-licor-frutilla']) expect(porId.has(id)).toBe(false);
  });
});
