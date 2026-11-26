const mockArchivos: Record<string, any> = {};

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn().mockResolvedValue({ id: 'f_361' }),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  exigirQueSePuedaGuardar: jest.fn().mockResolvedValue(undefined),
  exigirQueNoSalgaAfuera: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    await new Promise((r) => setTimeout(r, 15));
    const val = mockArchivos[file];
    return val === undefined ? JSON.parse(JSON.stringify(def)) : JSON.parse(JSON.stringify(val));
  }),
  readDataConDetalle: jest.fn(async (file: string, def: any) => {
    await new Promise((r) => setTimeout(r, 15));
    const val = mockArchivos[file];
    return {
      valor: val === undefined ? JSON.parse(JSON.stringify(def)) : JSON.parse(JSON.stringify(val)),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (file: string, data: any) => {
    mockArchivos[file] = JSON.parse(JSON.stringify(data));
  }),
}));

import { recordarQueVinoDeLaPublicidad } from '@/lib/whatsapp/vino-de-la-publicidad';
import { updateEtapaEstado } from '@/app/actions/mission-control';

describe('Orden 361: los documentos enteros tienen turno y no se pisan en paralelo', () => {
  beforeEach(() => {
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    mockArchivos['whatsapp-conversaciones-de-publicidad.json'] = { conversaciones: [] };
    mockArchivos['mission-control/f_361.json'] = {
      fiestaId: 'f_361',
      etapas: [
        { id: 'etapa-1', nombre: 'Montaje', estado: 'Pendiente', checklist: [], orden: 1 },
        { id: 'etapa-2', nombre: 'Recepción', estado: 'Pendiente', checklist: [], orden: 2 },
      ],
      ultimaActualizacion: '2026-11-26T00:00:00.000Z',
    };
  });

  it('dos marcas de "vino de la publicidad" concurrentes quedan las dos', async () => {
    const ahora = new Date('2026-11-26T10:00:00.000Z');
    await Promise.all([
      recordarQueVinoDeLaPublicidad('099111111', { source_type: 'ad', headline: 'Boda' }, ahora),
      recordarQueVinoDeLaPublicidad('099222222', { source_type: 'ad', headline: '15' }, ahora),
    ]);

    const guardadas = mockArchivos['whatsapp-conversaciones-de-publicidad.json'].conversaciones;
    expect(guardadas.map((c: any) => c.telefono).sort()).toEqual(['099111111', '099222222']);
  });

  it('dos actualizaciones de etapas de mission-control concurrentes quedan las dos', async () => {
    await Promise.all([
      updateEtapaEstado('f_361', 'etapa-1', 'Completada' as any),
      updateEtapaEstado('f_361', 'etapa-2', 'En Curso' as any),
    ]);

    const etapas = mockArchivos['mission-control/f_361.json'].etapas;
    expect(etapas.find((e: any) => e.id === 'etapa-1').estado).toBe('Completada');
    expect(etapas.find((e: any) => e.id === 'etapa-2').estado).toBe('En Curso');
  });
});
