/**
 * MATAFUEGO — La lista de compras suma en la misma unidad (orden 139, COM88-UNIDADES).
 *
 * Lo que se rompio: la clave juntaba 200 g y 2 kg en un solo renglon, pero las pantallas
 * sumaban los numeros crudos: "202.00 G" y $20 en lugar de 2,20 kg y $220 (precio 100
 * UYU/kg). El stock y el precio del catalogo tampoco se pasaban a la unidad del renglon.
 * La prueba vieja solo miraba que el helper convirtiera y que el nombre estuviera en el
 * archivo, no el RESULTADO de la pantalla.
 *
 * Aca se prueba el resultado de `consolidarCompras`, la funcion que llaman las dos
 * pantallas (lista-compras y resumen-planificacion).
 *
 * Probado rompiendolo: sumando `raw.cantidadNecesaria` sin convertir (en lugar de
 * `enBase`) se ponen en rojo los casos g/kg, ml/l, stock y costo.
 */
import fs from 'fs';
import path from 'path';
import { consolidarCompras, type CompraCruda } from '@/lib/compras/consolidar-compras';
import { convertir } from '@/lib/compras/unidades';

const base = (o: Partial<CompraCruda>): CompraCruda => ({
  nombre: 'Manteca',
  cantidadNecesaria: 1,
  unit: 'kg',
  costoUnitario: 100,
  unidadCosto: 'kg',
  proveedor: 'Lacteos SA',
  origen: 'Plato',
  isOrder: false,
  stockDisponible: 0,
  unidadStock: 'kg',
  ...o,
});

const lista = { redondeo: 'arriba' as const, plataEntera: true, juntarOrigenes: true };
const resumen = { redondeo: 'ninguno' as const };

describe('consolidarCompras suma en la misma unidad', () => {
  it.each([['lista', lista], ['resumen', resumen]])(
    'el caso de Codex (%s): 1 adulto, 200 g + 2 kg, stock 0, 100 UYU/kg da 2,2 kg y $220',
    (_n, op) => {
      const r = consolidarCompras(
        [
          base({ cantidadNecesaria: 200 * 1, unit: 'g', origen: 'A' }),
          base({ cantidadNecesaria: 2 * 1, unit: 'kg', origen: 'B' }),
        ],
        op,
      );
      expect(r).toHaveLength(1);
      expect(r[0].cantidadNecesaria).toBeCloseTo(2.2, 9);
      expect(r[0].unit).toBe('kg');
      expect(r[0].cantidadAComprar).toBeCloseTo(2.2, 9);
      expect(r[0].costoTotalFaltante).toBeCloseTo(220, 6);
    },
  );

  it('kg y despues g (orden inverso) da lo mismo', () => {
    const r = consolidarCompras(
      [base({ cantidadNecesaria: 2, unit: 'kg' }), base({ cantidadNecesaria: 200, unit: 'g' })],
      lista,
    );
    expect(r).toHaveLength(1);
    expect(r[0].cantidadNecesaria).toBeCloseTo(2.2, 9);
    expect(r[0].unit).toBe('kg');
    expect(r[0].costoTotalFaltante).toBe(220);
  });

  it('ml y l se suman en litros', () => {
    const r = consolidarCompras(
      [
        base({ nombre: 'Leche', cantidadNecesaria: 500, unit: 'ml', unidadCosto: 'l', unidadStock: 'l', costoUnitario: 50 }),
        base({ nombre: 'Leche', cantidadNecesaria: 1, unit: 'l', unidadCosto: 'l', unidadStock: 'l', costoUnitario: 50 }),
      ],
      resumen,
    );
    expect(r).toHaveLength(1);
    expect(r[0].cantidadNecesaria).toBeCloseTo(1.5, 9);
    expect(r[0].unit).toBe('l');
    expect(r[0].costoTotalFaltante).toBeCloseTo(75, 6);
  });

  it('el stock en otra unidad se resta ya convertido', () => {
    // Receta 200 g + 2 kg; stock del catalogo 500 g (catalogo en gramos, precio $0,1 el gramo).
    const r = consolidarCompras(
      [
        base({ cantidadNecesaria: 200, unit: 'g', unidadCosto: 'g', unidadStock: 'g', stockDisponible: 500, costoUnitario: 0.1 }),
        base({ cantidadNecesaria: 2, unit: 'kg', unidadCosto: 'g', unidadStock: 'g', stockDisponible: 500, costoUnitario: 0.1 }),
      ],
      resumen,
    );
    expect(r[0].stockDisponible).toBeCloseTo(0.5, 9);
    expect(r[0].cantidadAComprar).toBeCloseTo(1.7, 9);
    expect(r[0].costoTotalFaltante).toBeCloseTo(170, 6);
  });

  it('el precio del catalogo en otra unidad se pasa a la del renglon', () => {
    // Receta en g, catalogo en kg a $100: 500 g cuestan $50.
    const r = consolidarCompras([base({ cantidadNecesaria: 500, unit: 'g' })], resumen);
    expect(r[0].costoTotalFaltante).toBeCloseTo(50, 6);
  });

  it('adultos y menores: las cantidades por persona se suman en la misma unidad', () => {
    // 1 adulto x 200 g + 2 menores x 0,5 kg
    const adultos = 1;
    const menores = 2;
    const r = consolidarCompras(
      [
        base({ cantidadNecesaria: 200 * adultos, unit: 'g' }),
        base({ cantidadNecesaria: 0.5 * menores, unit: 'kg' }),
      ],
      lista,
    );
    expect(r[0].cantidadNecesaria).toBeCloseTo(1.2, 9);
    expect(r[0].costoTotalFaltante).toBe(120);
  });

  it('unidades desconocidas quedan separadas y no se convierten', () => {
    const r = consolidarCompras(
      [
        base({ cantidadNecesaria: 2, unit: 'bandeja', unidadCosto: 'bandeja', unidadStock: 'bandeja' }),
        base({ cantidadNecesaria: 300, unit: 'g' }),
        base({ cantidadNecesaria: 3, unit: 'cajon', unidadCosto: 'cajon', unidadStock: 'cajon' }),
      ],
      resumen,
    );
    expect(r).toHaveLength(3);
    expect(r.find(x => x.unit === 'bandeja')?.cantidadNecesaria).toBe(2);
    expect(r.find(x => x.unit === 'cajon')?.cantidadNecesaria).toBe(3);
  });

  it('nunca mezcla peso con volumen', () => {
    expect(convertir(1, 'kg', 'l')).toBeNull();
    expect(convertir(1, 'bandeja', 'kg')).toBeNull();
    const r = consolidarCompras(
      [base({ cantidadNecesaria: 1, unit: 'kg' }), base({ cantidadNecesaria: 1, unit: 'l' })],
      resumen,
    );
    expect(r).toHaveLength(2);
  });

  it('los pedidos fijos no descuentan stock y quedan aparte de la receta de otra unidad', () => {
    const r = consolidarCompras(
      [base({ isOrder: true, cantidadNecesaria: 3, unit: 'kg', stockDisponible: 10 })],
      lista,
    );
    expect(r[0].cantidadAComprar).toBe(3);
  });

  it('la regla de compra se mantiene: una sola unidad grande se redondea para arriba al entero', () => {
    const r = consolidarCompras(
      [base({ nombre: 'Gaseosa', cantidadNecesaria: 20.75, unit: 'l', unidadCosto: 'l', costoUnitario: 10 })],
      lista,
    );
    expect(r[0].cantidadAComprar).toBe(21);
    expect(r[0].costoTotalFaltante).toBe(210);
  });
});

describe('Las dos pantallas usan consolidarCompras', () => {
  const PANTALLAS = [
    'src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx',
    'src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx',
  ];
  it.each(PANTALLAS)('%s la llama', ruta => {
    const fuente = fs.readFileSync(path.join(process.cwd(), ruta), 'utf8');
    expect(fuente).toMatch(/import\s*\{[^}]*consolidarCompras[^}]*\}\s*from\s*'@\/lib\/compras\/consolidar-compras'/);
    expect(fuente).toMatch(/consolidarCompras\(\s*crudos/);
    expect(fuente).not.toMatch(/\.cantidadNecesaria \+= raw\.cantidadNecesaria/);
  });
});
