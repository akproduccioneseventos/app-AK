import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { numerosDeMenuInvalidos } from '@/lib/catering/numeros-de-menu';
import type { FullMenu } from '@/types/catering';

/**
 * Defecto real: los campos de cantidad por persona y de costo del ingrediente
 * aceptaban numeros negativos, sin control ni en la pantalla ni al guardar. Un
 * costo en menos hace que el plato "cueste" menos que nada, y ese numero entra
 * derecho al presupuesto del cliente y a la rentabilidad del evento: se ve una
 * ganancia que no existe.
 */

function menu(ingrediente: Record<string, unknown>): Pick<FullMenu, 'items'> {
  return {
    items: [
      {
        id: 'dish_1',
        name: 'Lomo al horno',
        ingredients: [{ id: 'ing_1', name: 'Lomo', unit: 'kg', ...ingrediente }],
      },
    ],
  } as unknown as Pick<FullMenu, 'items'>;
}

describe('numeros de un menu antes de guardarlo', () => {
  it('numeros normales pasan', () => {
    expect(numerosDeMenuInvalidos(menu({ quantityPerPerson: 0.25, costoUnitario: 450 }))).toBeNull();
  });

  it('cero esta permitido: hay ingredientes que todavia no se cargaron', () => {
    expect(numerosDeMenuInvalidos(menu({ quantityPerPerson: 0, costoUnitario: 0 }))).toBeNull();
  });

  it('una cantidad por persona negativa no se guarda', () => {
    const aviso = numerosDeMenuInvalidos(menu({ quantityPerPerson: -2, costoUnitario: 450 }));
    expect(aviso).toContain('Lomo al horno');
    expect(aviso).toContain('cantidad por persona negativa');
  });

  it('un costo negativo no se guarda, y explica por que', () => {
    const aviso = numerosDeMenuInvalidos(menu({ quantityPerPerson: 0.25, costoUnitario: -450 }));
    expect(aviso).toContain('costo negativo');
    expect(aviso).toContain('presupuesto');
  });

  it('un menu vacio o sin ingredientes no rompe', () => {
    expect(numerosDeMenuInvalidos({ items: [] } as unknown as Pick<FullMenu, 'items'>)).toBeNull();
    expect(
      numerosDeMenuInvalidos({ items: [{ id: 'd', name: 'Sopa' }] } as unknown as Pick<FullMenu, 'items'>),
    ).toBeNull();
  });

  it('un valor escrito como texto tampoco pasa si es negativo', () => {
    expect(numerosDeMenuInvalidos(menu({ quantityPerPerson: '-3', costoUnitario: 100 }))).toContain(
      'cantidad por persona negativa',
    );
  });
  it('serializes menu saves so an older autosave cannot overwrite a newer edit', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/catering/MenuForm.tsx'),
      'utf8',
    );

    expect(source).toContain('const autoSaveRevision = useRef(0)');
    expect(source).toContain('const saveQueue = useRef<Promise<void>>(Promise.resolve())');
    expect(source).toContain('const pending = saveQueue.current');
    expect(source).toContain('if (revision !== autoSaveRevision.current) return');
    expect(source).toContain("if (!result.success) throw new Error(result.error || 'No se pudo guardar automáticamente.')");
  });

});
