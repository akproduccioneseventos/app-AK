import { armarHojaDeCocina } from '@/lib/catering/hoja-de-cocina';
import { getGuestCountForItem } from '@/lib/calculations';
import { comprasDelMenuAsignado } from '@/lib/compras/compras-del-menu-asignado';

describe('Orden 357 — La cocina y compras cuentan a los niños igual que el costo', () => {
  it('armarHojaDeCocina usa getGuestCountForItem y no confunde palabras con "nin" ni ignora platos infantiles', () => {
    const hoja = armarHojaDeCocina(
      { id: 'f1', configuracion: { nombreEvento: 'Cumple' }, invitados: [] } as any,
      [
        { nombre: 'Panini de jamón', categoria: 'Entrada' },
        { nombre: 'Asado completo', categoria: 'Plato Principal' },
        { nombre: 'Milanesitas infantiles con papas', categoria: 'Plato Principal' },
        { nombre: 'Torta', categoria: 'Postre' },
      ],
      { adultos: 80, chicos: 15 },
    );

    const panini = hoja.platos.find((p) => p.nombre === 'Panini de jamón')!;
    const asado = hoja.platos.find((p) => p.nombre === 'Asado completo')!;
    const mila = hoja.platos.find((p) => p.nombre === 'Milanesitas infantiles con papas')!;
    const torta = hoja.platos.find((p) => p.nombre === 'Torta')!;

    expect(panini.porciones).toBe(getGuestCountForItem({ nombreServicio: 'Panini de jamón', categoriaServicio: 'Entrada' }, 80, 0, 15));
    expect(panini.porciones).toBe(95);
    expect(asado.porciones).toBe(80);
    expect(mila.porciones).toBe(15);
    expect(torta.porciones).toBe(95);
  });

  it('comprasDelMenuAsignado separa adultos y chicos por tipo/nombre de plato', () => {
    const res = comprasDelMenuAsignado(
      {
        items: [
          {
            id: 'p_adultos',
            name: 'Peceto al champignon',
            type: 'Plato Principal',
            ingredients: [{ name: 'Peceto', quantityPerPerson: 0.25, unit: 'kg', origenId: 'i1' }],
          },
          {
            id: 'p_chicos',
            name: 'Menú infantil nuggets',
            type: 'Menú Infantil',
            ingredients: [{ name: 'Nuggets', quantityPerPerson: 0.15, unit: 'kg', origenId: 'i2' }],
          },
        ],
      },
      new Set(),
      { adultos: 60, chicos: 10 },
      [],
    );

    expect(res.compras.find((c) => c.nombre === 'Peceto')?.cantidadNecesaria).toBe(15);
    expect(res.compras.find((c) => c.nombre === 'Nuggets')?.cantidadNecesaria).toBe(1.5);
  });
});
