jest.mock('server-only', () => ({}));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(), readDataConDetalle: jest.fn(), writeData: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn() }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn() }));
jest.mock('@/app/actions/multiagent', () => ({ ejecutarAccionSecretario: jest.fn() }));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn() }));
jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({ aprenderDeLoAprobado: jest.fn(async () => []) }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: jest.fn(async () => 'preguntar') }));
import { readData, readDataConDetalle } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { saveScheduledMessage } from '@/app/actions/scheduled-messages';
import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { aprobarPlanMultipaso, type AsistentePropuesta } from './propuestas-service';

let propuestas: AsistentePropuesta[];
let mensajes: Map<string, any>;
const presupuesto = { id: 'p1', clienteNombre: 'Cliente real', clienteContacto: '099123456', estado: 'Enviado' };

beforeEach(() => {
  jest.clearAllMocks(); mensajes = new Map();
  propuestas = [{ id: 'plan-1', estado: 'pendiente', tipoPropuesta: 'plan_multi_paso', accion: {
    type: 'plan_multi_paso', data: { planTipo: 'seguimiento_presupuestos', borrador: { telefono: '099123456', texto: 'Hola, revisamos la propuesta?', presupuestoId: 'p1' } },
  } } as AsistentePropuesta];
  (getReglaParaTarea as jest.Mock).mockResolvedValue('preguntar');
  (readData as jest.Mock).mockImplementation(async (file, fallback) => file === 'asistente-propuestas.json' ? propuestas : fallback);
  (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [presupuesto], huboFalla: false });
  (mutateGenericJsonArray as jest.Mock).mockImplementation(async (_file, update) => {
    const next = update(JSON.parse(JSON.stringify(propuestas)));
    if (next) propuestas = next; return next;
  });
  (saveScheduledMessage as jest.Mock).mockImplementation(async (message, _token, opts) => {
    const guardado = mensajes.get(opts.idEstable) || { ...message, id: opts.idEstable };
    mensajes.set(opts.idEstable, guardado);
    return { success: true, message: guardado };
  });
});

it('approves only after saving the real manual draft, once under concurrent approvals', async () => {
  const result = await Promise.all([aprobarPlanMultipaso('plan-1', 'Dueño'), aprobarPlanMultipaso('plan-1', 'Dueño')]);
  expect(result.some(r => r.success)).toBe(true);
  expect(mensajes.size).toBe(1);
  expect(saveScheduledMessage).toHaveBeenCalledTimes(1);
  expect([...mensajes.values()][0]).toMatchObject({ status: 'pendiente', sendingMode: 'manual_click', messageText: 'Hola, revisamos la propuesta?', targetPhone: '099123456' });
  expect(propuestas[0]).toMatchObject({ estado: 'aceptada', planEjecucion: { mensajeId: expect.any(String) } });
});

it('leaves the proposal pending on a failed write and safely recovers a lost response', async () => {
  const guardar = (saveScheduledMessage as jest.Mock).getMockImplementation()!;
  (saveScheduledMessage as jest.Mock).mockImplementationOnce(async (...args) => {
    await guardar(...args); return { success: false, error: 'Respuesta perdida' };
  });
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(false);
  expect(propuestas[0].estado).toBe('pendiente');
  expect(propuestas[0].planIntento).toBeUndefined();
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(true);
  expect(mensajes.size).toBe(1);
});

it('does not write when the rule is off or the contact/state changed', async () => {
  (getReglaParaTarea as jest.Mock).mockResolvedValueOnce('apagada');
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(false);
  (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [{ ...presupuesto, estado: 'Aprobado' }], huboFalla: false });
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(false);
  (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [{ ...presupuesto, clienteContacto: '099987654' }], huboFalla: false });
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(false);
  expect(saveScheduledMessage).not.toHaveBeenCalled();
  expect(propuestas[0].estado).toBe('pendiente');
});

it('does not execute after a transaction retry loses its reservation', async () => {
  (mutateGenericJsonArray as jest.Mock).mockImplementationOnce(async (_file, update) => {
    update(JSON.parse(JSON.stringify(propuestas)));
    update([{ ...propuestas[0], estado: 'descartada' }]); return null;
  });
  expect((await aprobarPlanMultipaso('plan-1')).success).toBe(false);
  expect(saveScheduledMessage).not.toHaveBeenCalled();
});
