jest.mock('@/lib/data-service', () => {
  let memoryStore: Record<string, any> = {};
  return {
    readData: jest.fn(async (file: string, fallback: any) => {
      return memoryStore[file] !== undefined ? memoryStore[file] : fallback;
    }),
    writeData: jest.fn(async (file: string, data: any) => {
      memoryStore[file] = data;
      return true;
    }),
    __clearMemory: () => {
      memoryStore = {};
    },
  };
});

import {
  pausarCampana,
  reactivarCampana,
  ajustarPresupuestoCampana,
  crearCampana,
  getAccionesPublicidadEjecutadas,
} from '@/lib/marketing/meta-ads-acciones';
import { guardarTopeDeGasto, type CampanaConPresupuesto } from '@/lib/marketing/tope-de-gasto-publicidad';

describe('Publicidad Autónoma de Meta Ads con Freno de Mano', () => {
  const campanasSimuladas: CampanaConPresupuesto[] = [
    { nombre: 'Campaña Bodas 15', presupuestoDiarioUYU: 200, activa: true },
    { nombre: 'Campaña XV Años', presupuestoDiarioUYU: 100, activa: true },
  ];

  beforeEach(async () => {
    // Resetear memoria y tope mensual en 0
    (require('@/lib/data-service') as any).__clearMemory();
    await guardarTopeDeGasto(0);
  });

  it('pausar una campaña siempre se ejecuta con éxito porque reduce el gasto', async () => {
    const res = await pausarCampana('camp_123', 'Campaña Bodas', 'Gasto excesivo');
    expect(res.success).toBe(true);

    const historial = await getAccionesPublicidadEjecutadas();
    const accion = historial.find((a) => a.campanaId === 'camp_123' && a.tipo === 'pausar');
    expect(accion).toBeDefined();
    expect(accion?.ejecutadoConExito).toBe(true);
  });

  it('no permite escalar presupuesto si no hay tope configurado (tope = 0)', async () => {
    const res = await ajustarPresupuestoCampana({
      campaignId: 'camp_123',
      campaignName: 'Campaña Bodas',
      presupuestoDiarioActualUYU: 200,
      nuevoPresupuestoDiarioUYU: 400,
      campanas: campanasSimuladas,
      motivo: 'Buen rendimiento',
    });

    expect(res.success).toBe(false);
    expect(res.motivoRechazo).toContain('No hay ningun tope de gasto mensual cargado');

    const historial = await getAccionesPublicidadEjecutadas();
    const accion = historial.find((a) => a.campanaId === 'camp_123' && a.tipo === 'ajustar_presupuesto');
    expect(accion?.ejecutadoConExito).toBe(false);
  });

  it('permite escalar presupuesto si está dentro del tope mensual', async () => {
    await guardarTopeDeGasto(50000);

    const res = await ajustarPresupuestoCampana({
      campaignId: 'camp_123',
      campaignName: 'Campaña Bodas',
      presupuestoDiarioActualUYU: 200,
      nuevoPresupuestoDiarioUYU: 300,
      campanas: campanasSimuladas,
      motivo: 'Buen rendimiento',
    });

    expect(res.success).toBe(true);
    expect(res.motivoRechazo).toBeUndefined();

    const historial = await getAccionesPublicidadEjecutadas();
    const accion = historial.find((a) => a.campanaId === 'camp_123' && a.tipo === 'ajustar_presupuesto');
    expect(accion?.ejecutadoConExito).toBe(true);
  });

  it('permite crear una campaña si el compromiso entra en el tope', async () => {
    await guardarTopeDeGasto(50000);

    const res = await crearCampana({
      nombre: 'Nueva Promo Primavera',
      presupuestoDiarioUYU: 150,
      campanas: campanasSimuladas,
      motivo: 'Lanzamiento de temporada',
    });

    expect(res.success).toBe(true);
    expect(res.id).toBeDefined();

    const historial = await getAccionesPublicidadEjecutadas();
    const accion = historial.find((a) => a.campanaNombre === 'Nueva Promo Primavera' && a.tipo === 'crear_campana');
    expect(accion?.ejecutadoConExito).toBe(true);
  });
});
