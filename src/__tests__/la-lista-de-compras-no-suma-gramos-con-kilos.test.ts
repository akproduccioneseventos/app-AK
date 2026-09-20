/**
 * MATAFUEGO — La lista de compras no puede sumar gramos como si fueran kilos.
 *
 * Lo encontro Codex el 20 de septiembre de 2026: los renglones se juntaban por nombre
 * y proveedor, sin la unidad. 200 g de un plato y 2 kg de otro daban "202" de lo que
 * viniera primero. Si quedaba en kilos se compraba de mas; si quedaba en gramos, la
 * fiesta se quedaba sin comida.
 *
 * Se probo rompiendola a proposito: sacando la unidad de la clave, se pone en rojo.
 */
import {
  cantidadEnUnidadBase,
  claveDeConsolidado,
  costoEnUnidadBase,
  mostrarCantidad,
  normalizarUnidad,
} from '@/lib/compras/unidades';

describe('La lista de compras no suma gramos con kilos', () => {
  it('gramos y kilos del mismo insumo caen en el mismo renglon, ya convertidos', () => {
    expect(claveDeConsolidado('Manteca', 'Lacteos SA', 'g')).toBe(
      claveDeConsolidado('manteca', 'lacteos sa', 'kg'),
    );
    const enGramos = cantidadEnUnidadBase(200, 'g');
    const enKilos = cantidadEnUnidadBase(2, 'kg');
    expect(enGramos + enKilos).toBeCloseTo(2.2, 5);
  });

  it('mililitros y litros se suman en litros', () => {
    expect(cantidadEnUnidadBase(500, 'ml') + cantidadEnUnidadBase(1, 'L')).toBeCloseTo(1.5, 5);
  });

  it('la plata no cambia al convertir la unidad', () => {
    // $2 el gramo, 200 gramos = $400. En kilos: $2000 el kilo, 0,2 kg = $400.
    const total = cantidadEnUnidadBase(200, 'g') * costoEnUnidadBase(2, 'g');
    expect(total).toBeCloseTo(400, 5);
  });

  it('lo que no se reconoce queda en su propio renglon y no se mezcla', () => {
    expect(normalizarUnidad('bandeja').unidad).toBe('bandeja');
    expect(claveDeConsolidado('Pan', 'Panaderia', 'bandeja')).not.toBe(
      claveDeConsolidado('Pan', 'Panaderia', 'unidad'),
    );
  });

  it('en pantalla se lee como lo dice la gente', () => {
    expect(mostrarCantidad(0.2, 'kg')).toBe('200 g');
    expect(mostrarCantidad(2.2, 'kg')).toBe('2.2 kg');
    expect(mostrarCantidad(1.5, 'l')).toBe('1.5 l');
  });
});

/**
 * Y que este enganchado de verdad: las dos pantallas que arman la lista tienen que
 * juntar los renglones con la unidad adentro, no por nombre y proveedor nomas.
 */
describe('Las dos pantallas de compras usan la clave con unidad', () => {
  const fs = require('fs');
  const path = require('path');
  const PANTALLAS = [
    'src/app/(app)/fiestas/nueva/catering/lista-compras/page.tsx',
    'src/app/(app)/fiestas/nueva/resumen-planificacion/page.tsx',
  ];

  it.each(PANTALLAS)('%s junta los renglones con claveDeConsolidado', (pantalla) => {
    const contenido = fs.readFileSync(path.join(process.cwd(), pantalla), 'utf-8');
    expect(contenido).toContain('claveDeConsolidado(');
    // La clave vieja, por nombre y proveedor sola, no puede volver.
    expect(contenido).not.toMatch(/const key = `\$\{raw\.nombre\.toLowerCase\(\)\}-\$\{raw(Proveedor|\.proveedor)/);
  });
});
