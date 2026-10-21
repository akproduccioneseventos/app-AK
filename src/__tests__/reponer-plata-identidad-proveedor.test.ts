/**
 * Orden 185 (Codex 146/147): al guardar la fiesta, el pago de cada compra se repone desde lo guardado. Se
 * buscaba por nombre del proveedor: con dos proveedores que se llaman igual, el pago del primero se le
 * copiaba al segundo, y el del segundo se perdía.
 */
import { compraGuardadaDeCadaUna } from '@/lib/fiesta/reponer-la-plata';

describe('el pago de una compra no se le copia a otro proveedor del mismo nombre', () => {
  it('sin id: dos del mismo nombre se emparejan en orden', () => {
    const antes = [
      { proveedor: 'Hielo', pagado: true, montoPagado: 1000 },
      { proveedor: 'Hielo', pagado: false, montoPagado: 0 },
    ];
    const nuevas = [{ proveedor: 'Hielo' }, { proveedor: 'Hielo' }];
    const previos = compraGuardadaDeCadaUna(antes, nuevas);
    expect(previos[0]?.montoPagado).toBe(1000);
    expect(previos[1]?.montoPagado).toBe(0);
  });

  it('con id: manda el id aunque el nombre coincida y el orden cambie', () => {
    const antes = [
      { proveedorId: 'p1', proveedor: 'Hielo', montoPagado: 1000 },
      { proveedorId: 'p2', proveedor: 'Hielo', montoPagado: 5 },
    ];
    const previos = compraGuardadaDeCadaUna(antes, [{ proveedorId: 'p2', proveedor: 'Hielo' }, { proveedorId: 'p1', proveedor: 'Hielo' }]);
    expect(previos.map((p) => p?.montoPagado)).toEqual([5, 1000]);
  });

  it('una compra nueva con id no toma el pago de otra con id distinto', () => {
    const antes = [{ proveedorId: 'p1', proveedor: 'Hielo', montoPagado: 1000 }];
    expect(compraGuardadaDeCadaUna(antes, [{ proveedorId: 'p9', proveedor: 'Hielo' }])[0]).toBeUndefined();
  });

  it('una compra que no estaba no hereda nada', () => {
    const antes = [{ proveedor: 'Hielo', montoPagado: 1000 }];
    const previos = compraGuardadaDeCadaUna(antes, [{ proveedor: 'Hielo' }, { proveedor: 'Hielo' }]);
    expect(previos[1]).toBeUndefined();
  });
});
