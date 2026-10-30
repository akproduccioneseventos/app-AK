jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async (_file, fallback) => fallback), writeData: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn(async (_file, update) => update([])) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn() }));
jest.mock('@/app/actions/multiagent', () => ({ ejecutarAccionSecretario: jest.fn() }));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn() }));
jest.mock('@/lib/asistente/planes-ejecutor', () => ({ prepararMensajeDelPlan: jest.fn() }));
jest.mock('@/lib/ia/aprender-de-lo-aprobado', () => ({
  ...jest.requireActual('@/lib/ia/aprender-de-lo-aprobado'),
  aprenderDeLoAprobado: jest.fn(async () => ['Con vos coordinamos lo de la familia EjemploPrivado.']),
}));
import { agregarPropuestasDeduplicadas } from './propuestas-service';

it('adapts only the heading using approved tone, preserving facts and excluding examples', async () => {
  const { agregadas } = await agregarPropuestasDeduplicadas([{
    clave: 'test:plan', tipoPropuesta: 'plan_multi_paso', area: 'fiestas', titulo: 'Preparar plan',
    quePasa: 'Hay una reunión', porQueImporta: 'Revisión interna', quePropone: '1. Revisar 150 invitados\n2. Preparar mensaje\n3. Revisar presupuesto',
  }]);
  expect(agregadas[0].quePropone).toBe('Te propongo:\n1. Revisar 150 invitados\n2. Preparar mensaje\n3. Revisar presupuesto');
  expect(JSON.stringify(agregadas)).not.toContain('EjemploPrivado');
});
