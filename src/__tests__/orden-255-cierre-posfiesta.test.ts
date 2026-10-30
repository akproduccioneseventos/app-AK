const mockReadData = jest.fn(async (_file: string, fallback: unknown) => fallback);
const mockReadDetalle = jest.fn(async (_file: string, fallback: unknown) => ({ valor: fallback, huboFalla: false }));
const mockMutate = jest.fn(async (_file: string, update: (items: any[]) => any) => update([]));

jest.mock('@/lib/data-service', () => ({ readData: (...args: any[]) => mockReadData(...args), readDataConDetalle: (...args: any[]) => mockReadDetalle(...args) }));
jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: (...args: any[]) => mockMutate(...args) }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: jest.fn(async () => 'preguntar') }));

import { armarInformeAutomatico } from '@/lib/fiesta/informe-automatico';
import { dependenciasCierrePosfiestaProduccion, ejecutarCierrePosfiesta } from '@/lib/asistente/cierre-posfiesta';

describe('Orden 255, informe posfiesta', () => {
  const fiesta: any = { id: 'f-1', configuracion: { fechaEvento: '2026-10-28', horaInicio: '20:00', horaFin: '04:00' } };

  beforeEach(() => jest.clearAllMocks());

  it('does not invent unavailable report values', () => {
    const informe = armarInformeAutomatico({ fiesta, fechaGeneracion: new Date('2026-10-29T12:00:00.000Z') });
    expect(informe.finanzas).toEqual({ disponible: false, motivo: 'No hay datos confirmados de cierre financiero.' });
    expect(informe.catering.disponible).toBe(false);
    expect(informe.mejoresFotos.disponible).toBe(false);
  });

  it('keeps the prior helper input signature while returning only explicit available data', () => {
    const informe = armarInformeAutomatico({
      fiesta,
      invitados: [{ rsvp: 'Confirmado', checkedIn: true, partySize: 3 }],
      posts: [{ id: 'post-1', fiestaId: 'f-1', moderationStatus: 'approved', mediaType: 'image' }],
    });
    expect(informe.asistencia).toEqual({ disponible: true, valor: { confirmados: 3, asistieron: 3 } });
    expect(informe.multimedia).toEqual({ disponible: true, valor: { fotos: 1, videos: 0 } });
    expect(informe.finanzas.disponible).toBe(false);
    expect(informe).not.toHaveProperty('resumenCliente');
  });

  it('catches up a missed day, emits a stable internal proposal, and persists by stable report id', async () => {
    const guardar = jest.fn(async () => true);
    const deps: any = { leerFiestas: async () => [fiesta], leerInformes: async () => [], leerDatosConfirmados: async () => ({}), guardar };
    const now = new Date('2026-10-30T12:00:00.000Z');
    const result = await ejecutarCierrePosfiesta(now, deps);
    expect(guardar).toHaveBeenCalledWith(expect.objectContaining({ id: 'informe-posfiesta-f-1-2026-10-28' }));
    expect(result.propuestas[0]).toEqual(expect.objectContaining({ clave: 'informe-posfiesta-f-1-2026-10-28', fiestaId: 'f-1', estado: 'pendiente' }));
    expect(result.nuevasPropuestas).toEqual(result.propuestas);
  });

  it('returns a retryable error rather than a false success when persistence fails', async () => {
    const deps: any = { leerFiestas: async () => [fiesta], leerInformes: async () => [], leerDatosConfirmados: async () => ({}), guardar: async () => { throw new Error('offline'); } };
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), deps);
    expect(result.preparados).toBe(0);
    expect(result.errores).toEqual([{ fiestaId: 'f-1', error: 'offline' }]);
  });

  it('does not close an event that is still active after midnight', async () => {
    const guardar = jest.fn(async () => true);
    const deps: any = { leerFiestas: async () => [fiesta], leerInformes: async () => [], leerDatosConfirmados: async () => ({}), guardar };
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T03:15:00.000Z'), deps);
    expect(guardar).not.toHaveBeenCalled();
    expect(result.propuestas).toEqual([]);
  });

  it('recovers the cross-instance winner after a null transaction result before preparing a proposal', async () => {
    const ganador = armarInformeAutomatico({ fiesta, fechaGeneracion: new Date('2026-10-29T12:00:00.000Z') });
    const leerInformes = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([ganador]);
    const deps: any = { leerFiestas: async () => [fiesta], leerInformes, leerDatosConfirmados: async () => ({}), guardar: async () => false };
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), deps);
    expect(result.propuestas).toHaveLength(1);
    expect(result.propuestas[0].quePropone).toBe(ganador.propuestaResumenDuenio);
    expect(leerInformes).toHaveBeenCalledTimes(2);
  });

  it('reports invalid event range and excludes demo and archived fiestas', async () => {
    const invalid = { ...fiesta, id: 'invalid', configuracion: { fechaEvento: '2026-10-28' } };
    const demo = { ...fiesta, id: 'demo_test' };
    const archived = { ...fiesta, id: 'archived', estado: 'Archivada' };
    const guardar = jest.fn(async () => true);
    const deps: any = { leerFiestas: async () => [invalid, demo, archived], leerInformes: async () => [], leerDatosConfirmados: async () => ({}), guardar };
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), deps);
    expect(result.errores[0]).toMatchObject({ fiestaId: 'invalid' });
    expect(guardar).not.toHaveBeenCalled();
  });

  it('does not create an internal proposal when the confirmed-data read failed', async () => {
    const deps: any = {
      leerFiestas: async () => [fiesta], leerInformes: async () => [],
      leerDatosConfirmados: async () => { throw new Error('lectura fallida'); },
      guardar: jest.fn(async () => true),
    };
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), deps);
    expect(result.propuestas).toEqual([]);
    expect(result.errores).toEqual([{ fiestaId: 'f-1', error: 'lectura fallida' }]);
  });

  it('does not treat a failed fiesta collection read as an empty successful run', async () => {
    mockReadDetalle.mockResolvedValueOnce({ valor: [], huboFalla: true });
    await expect(dependenciasCierrePosfiestaProduccion.leerFiestas()).rejects.toThrow('No se pudo verificar la lista de fiestas');
  });

  it('uses reconciled invoice allocations when the linked budget payment list is stale', async () => {
    const linkedFiesta: any = { ...fiesta, presupuestoId: 'budget-1' };
    const presupuesto: any = { id: 'budget-1', invoiceId: 'invoice-1', contractSignatureInfo: { isSigned: true }, pagosCliente: [] };
    const invoice: any = {
      id: 'invoice-1', sourcePresupuestoId: 'budget-1', status: 'Paid', documentKind: 'invoice',
      invoiceNumber: 'AK-001', totalAmount: 100, currency: 'UYU', payments: [{ id: 'pay-1', paymentDate: '2026-10-29', amount: 100 }],
    };
    mockReadDetalle.mockImplementation(async (file: string, fallback: unknown) => ({
      valor: file === 'presupuestos.json' ? [presupuesto] : file === 'invoices.json' ? [invoice] : fallback,
      huboFalla: false,
    }));
    const datos = await dependenciasCierrePosfiestaProduccion.leerDatosConfirmados(linkedFiesta);
    expect(datos.finanzas).toEqual({ disponible: true, valor: { contratado: 100, pagado: 100, saldo: 0, moneda: 'UYU' } });
  });
});
