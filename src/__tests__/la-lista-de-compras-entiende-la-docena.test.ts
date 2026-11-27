import { consolidarCompras, CompraCruda } from '@/lib/compras/consolidar-compras';
import { calcularCostoIngredienteEnReceta } from '@/lib/catering/unidades';

describe('La lista de compras entiende la docena y consolidación de pedidos fijos vs receta', () => {
  it('calcula correctamente 24 unidades de huevo a $240 la docena = $480', () => {
    const costo = calcularCostoIngredienteEnReceta(24, 240, 'unidad', 'docena');
    expect(costo).toBe(480);
  });

  it('suma pedido fijo 40 + receta 60 con stock 20 dando 80 sin importar el orden de entrada', () => {
    const raw1: CompraCruda[] = [
      {
        nombre: 'Harina',
        cantidadNecesaria: 40,
        unit: 'kg',
        costoUnitario: 10,
        proveedor: 'Proveedor A',
        origen: 'Pedido Fijo',
        isOrder: true,
        stockDisponible: 20,
      },
      {
        nombre: 'Harina',
        cantidadNecesaria: 60,
        unit: 'kg',
        costoUnitario: 10,
        proveedor: 'Proveedor A',
        origen: 'Receta',
        isOrder: false,
        stockDisponible: 20,
      },
    ];

    const raw2: CompraCruda[] = [
      {
        nombre: 'Harina',
        cantidadNecesaria: 60,
        unit: 'kg',
        costoUnitario: 10,
        proveedor: 'Proveedor A',
        origen: 'Receta',
        isOrder: false,
        stockDisponible: 20,
      },
      {
        nombre: 'Harina',
        cantidadNecesaria: 40,
        unit: 'kg',
        costoUnitario: 10,
        proveedor: 'Proveedor A',
        origen: 'Pedido Fijo',
        isOrder: true,
        stockDisponible: 20,
      },
    ];

    const res1 = consolidarCompras(raw1, { redondeo: 'ninguno' });
    const res2 = consolidarCompras(raw2, { redondeo: 'ninguno' });

    expect(res1).toHaveLength(1);
    expect(res2).toHaveLength(1);

    expect(res1[0].cantidadAComprar).toBe(80);
    expect(res2[0].cantidadAComprar).toBe(80);
  });
});
