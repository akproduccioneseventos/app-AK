import { reponerLaPlata } from '@/lib/fiesta/reponer-la-plata';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

describe('Orden 185: preservar pagos por identidad de proveedor', () => {
  it('diferentes IDs y nombres distintos preservan su pago correcto', () => {
    const guardada = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'a', proveedor: 'Proveedor A', montoPagado: 60.30, pagado: true },
        { proveedorId: 'b', proveedor: 'Proveedor B', montoPagado: 200, pagado: true },
      ],
    } as unknown as FiestaEnPlanificacion;

    const nueva = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'b', proveedor: 'Proveedor B' },
      ],
    } as unknown as FiestaEnPlanificacion;

    const res = reponerLaPlata(nueva, guardada, { puedeContabilidad: false });
    expect(res.estadosCompra?.[0].montoPagado).toBe(200);
    expect(res.estadosCompra?.[0].pagado).toBe(true);
  });

  it('diferentes IDs con el mismo nombre en pantalla preservan el pago por ID sin mezclar', () => {
    const guardada = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'a', proveedor: 'Proveedor QA', montoPagado: 60.30, pagado: true },
        { proveedorId: 'b', proveedor: 'Proveedor QA', montoPagado: 200, pagado: true },
      ],
    } as unknown as FiestaEnPlanificacion;

    const nueva = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'b', proveedor: 'Proveedor QA' },
      ],
    } as unknown as FiestaEnPlanificacion;

    const res = reponerLaPlata(nueva, guardada, { puedeContabilidad: false });
    // Debe preservar B (200), NO A (60.30)
    expect(res.estadosCompra?.[0].montoPagado).toBe(200);
  });

  it('un proveedor nuevo con ID distinto no hereda pagos de otro proveedor con mismo nombre', () => {
    const guardada = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'a', proveedor: 'Proveedor QA', montoPagado: 60.30, pagado: true },
      ],
    } as unknown as FiestaEnPlanificacion;

    const nueva = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedorId: 'new', proveedor: 'Proveedor QA' },
      ],
    } as unknown as FiestaEnPlanificacion;

    const res = reponerLaPlata(nueva, guardada, { puedeContabilidad: false });
    expect(res.estadosCompra?.[0].montoPagado).toBeUndefined();
    expect(res.estadosCompra?.[0].pagado).toBeUndefined();
  });

  it('filas antiguas sin ID conservan compatibilidad buscando por nombre', () => {
    const guardada = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedor: 'A', montoPagado: 60.30, pagado: true },
        { proveedor: 'B', montoPagado: 200, pagado: true },
      ],
    } as unknown as FiestaEnPlanificacion;

    const nueva = {
      id: 'fiesta-1',
      estadosCompra: [
        { proveedor: 'B' },
      ],
    } as unknown as FiestaEnPlanificacion;

    const res = reponerLaPlata(nueva, guardada, { puedeContabilidad: false });
    expect(res.estadosCompra?.[0].montoPagado).toBe(200);
    expect(res.estadosCompra?.[0].pagado).toBe(true);
  });
});
