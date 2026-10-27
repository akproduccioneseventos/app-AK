/** @jest-environment node */
let usuario: any = null;
const fiesta = { id: 'qa718', configuracion: { nombreEvento: 'QA718' }, personalAsignado: [{ empleadoId: 'op1' }] };
jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => usuario ? { success: true, user: usuario } : { success: false }) }));
jest.mock('@/app/actions/empleados', () => ({ getEmpleados: jest.fn(async () => [{ id: 'op1', email: 'op1@qa.invalid' }]) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getFiestaById: jest.fn(async () => fiesta), saveFiesta: jest.fn(async () => { throw new Error('QA escritura no permitida'); }) }));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null, authAdmin: null }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(async () => { throw new Error('QA subida no permitida'); }) }));
jest.mock('@/lib/data-service', () => ({
  ...jest.requireActual('@/lib/data-service'),
  readData: jest.fn(async (_path: string, fallback: any) => fallback),
  writeData: jest.fn(async () => { throw new Error('QA escritura no permitida'); }),
}));
import { requireEventPermission } from '@/lib/auth/event-access';
import { PERMISOS } from '@/lib/auth/perfiles';
import { writeData } from '@/lib/data-service';
import { saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getBarraTecnologicaDashboard, saveBarraTecnologicaSettings, updateBarDrinkOrderStatus, guardarAperturaDeBarraAction, guardarCierreDeBarra } from '@/app/actions/fiesta/barra-tecnologica.actions';

const permiso = [PERMISOS.NOCHE, PERMISOS.INSUMOS];
const permitidos = [
  ['dueno', { perfil: 'dueno', role: 'admin' }],
  ['secretaria', { perfil: 'secretaria', role: 'user' }],
  ['operador asignado', { perfil: 'operador', role: 'user', userId: 'op1', email: 'op1@qa.invalid' }],
] as const;
const denegados = [
  ['anonimo', null], ['personal', { perfil: 'personal', role: 'user' }],
  ['cliente', { perfil: 'cliente', role: 'user' }], ['invitado', { perfil: 'invitado', role: 'user' }],
  ['operador otra fiesta', { perfil: 'operador', role: 'user', userId: 'op-otro', email: 'otro@qa.invalid' }],
  ['perfil invalido con role viejo admin', { perfil: 'perfil-qa-invalido', role: 'admin' }],
] as const;
beforeEach(() => { usuario = null; jest.clearAllMocks(); });
describe('QA718: guardia real de la barra y asignacion de evento', () => {
  it.each(permitidos)('%s pasa la guardia', async (_nombre, user) => {
    usuario = user;
    await expect(requireEventPermission('qa718', permiso)).resolves.toMatchObject({ id: 'qa718' });
  });
  it.each(denegados)('%s queda fuera', async (_nombre, user) => {
    usuario = user;
    await expect(requireEventPermission('qa718', permiso)).rejects.toThrow(/permiso|asignado/);
  });
});
const acciones = [
  ['panel privado', () => getBarraTecnologicaDashboard('qa718')],
  ['ajustes', () => saveBarraTecnologicaSettings('qa718', { enabled: false })],
  ['estado pedido', () => updateBarDrinkOrderStatus('qa718', 'pedido-qa', 'entregado')],
  ['apertura', () => guardarAperturaDeBarraAction('qa718', { 'botella-qa': 1 })],
  ['cierre', () => guardarCierreDeBarra('qa718', { 'botella-qa': 1 }, true)],
] as const;
describe('QA718: acciones reales no saltan la guardia', () => {
  for (const [accion, correr] of acciones) {
    it.each(denegados)(`${accion}: %s rechazado sin escribir`, async (_nombre, user) => {
      usuario = user;
      const r = await correr();
      expect(r.success).toBe(false);
      expect(r.error).toMatch(/permiso|asignado/);
      expect(writeData).not.toHaveBeenCalled();
      expect(saveFiesta).not.toHaveBeenCalled();
    });
  }
});
