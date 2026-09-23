/**
 * MATAFUEGO — Guardar una lista vieja de presupuestos, facturas o cupones no borra ni
 * pisa plata (23 de septiembre de 2026).
 *
 * El guardado de una coleccion escribe la lista entera que el que guarda leyo un rato
 * antes. Tres cosas se perdian si mientras tanto otro servidor habia escrito:
 *  - el presupuesto o la factura que el otro CREO (se borraba "lo que no esta en la lista");
 *  - el cobro que el otro ANOTO (la lista vieja traia los cobros de antes);
 *  - el uso de cupon que el otro CONTO (un cupon de un uso servia dos veces).
 *
 * La base de mentira guarda documentos y los devuelve copiados, como la de verdad.
 * Se probo rompiendolo: sacando `protegerLaPlata` o la guarda de borrado por omision,
 * las comprobaciones correspondientes se ponen en rojo.
 */
const base: Record<string, Record<string, any>> = {};
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function coleccion(nombre: string) {
  base[nombre] = base[nombre] || {};
  const docs = () => Object.entries(base[nombre]).map(([id, datos]) => ({
    id, data: () => copia(datos), ref: { coleccion: nombre, id },
  }));
  return {
    doc: (id: string) => ({ coleccion: nombre, id }),
    get: async () => ({ docs: docs(), size: docs().length }),
    _docs: docs,
  };
}

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: {
    collection: (nombre: string) => coleccion(nombre),
    runTransaction: async (fn: (t: any) => Promise<void>) => {
      const escrituras: Array<() => void> = [];
      await fn({
        get: async (ref: any) => (ref._docs ? { docs: ref._docs() } : { exists: !!base[ref.coleccion]?.[ref.id], data: () => copia(base[ref.coleccion][ref.id]) }),
        set: (ref: any, datos: any, opciones?: { merge?: boolean }) => escrituras.push(() => {
          base[ref.coleccion][ref.id] = opciones?.merge ? { ...(base[ref.coleccion][ref.id] || {}), ...copia(datos) } : copia(datos);
        }),
        delete: (ref: any) => escrituras.push(() => { delete base[ref.coleccion][ref.id]; }),
      });
      escrituras.forEach((escribir) => escribir());
    },
    batch: () => ({ set: jest.fn(), delete: jest.fn(), commit: jest.fn() }),
  },
}));
jest.mock('@/lib/logger', () => ({
  shouldSkipFirestoreDuringBuild: () => false,
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

import { syncToFirestore } from '@/lib/firebase-sync';

const PRES_A = { id: 'pres-a', clienteNombre: 'A', totalConDescuento: 100000, costoTotalEstimado: 100000, itemsPresupuestados: [], pagosCliente: [] as any[] };

describe('Una lista vieja no borra ni pisa plata', () => {
  beforeEach(() => { for (const k of Object.keys(base)) delete base[k]; });

  it('no borra el presupuesto que otro creo mientras tanto', async () => {
    base.presupuestos = { 'pres-a': copia(PRES_A), 'pres-nuevo': { id: 'pres-nuevo', clienteNombre: 'Nuevo' } };
    await syncToFirestore('presupuestos.json', [{ ...PRES_A, clienteNombre: 'A corregido' }]);
    expect(base.presupuestos['pres-nuevo']).toBeDefined();
    expect(base.presupuestos['pres-a'].clienteNombre).toBe('A corregido');
  });

  it('no pisa el cobro que otro anoto mientras tanto', async () => {
    const cobro = { id: 'pago-1', monto: 30000, estadoPago: 'confirmado', fecha: '2026-09-01', metodoPago: 'Efectivo' };
    base.presupuestos = { 'pres-a': { ...copia(PRES_A), pagosCliente: [cobro] } };
    await syncToFirestore('presupuestos.json', [{ ...PRES_A, clienteNombre: 'A corregido' }]);
    expect(base.presupuestos['pres-a'].pagosCliente).toEqual([cobro]);
    expect(base.presupuestos['pres-a'].saldo).toBe(70000);
  });

  it('una factura conserva el pago que otro anoto y suma el nuevo', async () => {
    base.facturas = {
      'fac-1': { id: 'fac-1', totalAmount: 1000, status: 'Sent', payments: [{ id: 'p-otro', amount: 400 }] },
      'fac-2': { id: 'fac-2', totalAmount: 50, payments: [] },
    };
    await syncToFirestore('invoices.json', [{ id: 'fac-1', totalAmount: 1000, status: 'Sent', payments: [{ id: 'p-mio', amount: 600 }] }]);
    const pagos = base.facturas['fac-1'].payments.map((p: any) => p.id).sort();
    expect(pagos).toEqual(['p-mio', 'p-otro']);
    expect(base.facturas['fac-1'].status).toBe('Paid');
    expect(base.facturas['fac-2']).toBeDefined();
  });

  it('una lista vieja de cupones no baja el contador de usos', async () => {
    base.cupones = { 'cup-1': { id: 'cup-1', codigo: 'X', usosActuales: 1, usosMaximos: 1, activo: true } };
    await syncToFirestore('cupones.json', [{ id: 'cup-1', codigo: 'X', usosActuales: 0, usosMaximos: 1, activo: false }]);
    expect(base.cupones['cup-1'].usosActuales).toBe(1);
    expect(base.cupones['cup-1'].activo).toBe(false);
  });

  it('una lista vieja de insumos o menus no borra el que otro creo', async () => {
    base.insumos = { 'ins-1': { id: 'ins-1', nombre: 'Harina' }, 'ins-nuevo': { id: 'ins-nuevo', nombre: 'Azucar' } };
    base.menus_catering = { 'menu-1': { id: 'menu-1', items: [] }, 'menu-nuevo': { id: 'menu-nuevo', items: [] } };
    await syncToFirestore('insumos.json', [{ id: 'ins-1', nombre: 'Harina 000' }]);
    await syncToFirestore('menus-catering.json', [{ id: 'menu-1', items: [] }]);
    expect(base.insumos['ins-nuevo']).toBeDefined();
    expect(base.menus_catering['menu-nuevo']).toBeDefined();
  });

  it('restaurar un respaldo SI repone los cobros y borra lo que no esta', async () => {
    base.presupuestos = { 'pres-a': { ...copia(PRES_A), pagosCliente: [{ id: 'malo', monto: 1 }] }, 'pres-x': { id: 'pres-x' } };
    await syncToFirestore('presupuestos.json', [PRES_A], { esRestauracion: true });
    expect(base.presupuestos['pres-a'].pagosCliente).toEqual([]);
    expect(base.presupuestos['pres-x']).toBeUndefined();
  });
});
