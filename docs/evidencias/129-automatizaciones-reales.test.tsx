import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';

const mockFiestas = jest.fn();
const mockAviso = jest.fn();
jest.mock('next/link', () => ({ __esModule: true, default: ({ children }: any) => <a>{children}</a> }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => ({})) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: (...args: any[]) => mockFiestas(...args) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
jest.mock('@/app/actions/crm', () => ({ getCrmLeads: jest.fn(async () => []) }));
jest.mock('@/app/actions/notifications', () => ({ getNotifications: jest.fn(async () => []) }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: (...args: any[]) => mockAviso(...args) }));
jest.mock('@/lib/multiagent/memory-store', () => ({ saveAgentLearning: jest.fn(async () => undefined) }));
import SmartAutomationsPage from '@/app/control-tower/automatizaciones/page';
import { runSmartAutomations } from '@/app/actions/smart-automations';

const fiesta = (id: string) => ({
  id, configuracion: { nombreEvento: `Fiesta ficticia ${id}`, fechaEvento: new Date(Date.now() + 10 * 86400000).toISOString() },
  menuAsignadoId: 'menu-qa129', invitados: [{ id: 'invitado-ficticio' }],
  tareas: [{ id: 'tarea-qa129', texto: 'Confirmar horario', completada: false, fechaLimite: new Date().toISOString() }],
});
beforeAll(() => Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true }));
afterAll(() => Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT'));
beforeEach(() => {
  jest.clearAllMocks();
  mockFiestas.mockResolvedValue([]);
  mockAviso.mockResolvedValue({ success: true, notification: { id: 'aviso-qa129' }, isDuplicate: false });
});
async function usarBoton() {
  const host = document.body.appendChild(document.createElement('div'));
  const root = createRoot(host);
  await act(async () => { root.render(<SmartAutomationsPage />); });
  const boton = Array.from(host.querySelectorAll('button')).find(b => b.textContent?.includes('Ejecutar revisión inteligente'));
  if (!boton) throw new Error('Boton real no encontrado');
  await act(async () => { boton.click(); });
  return { host, cerrar: () => { act(() => root.unmount()); host.remove(); } };
}
function anotar(caso: string, host: HTMLElement, extra: any = {}) {
  fs.writeFileSync(`docs/evidencias/129-auto-${caso}-observado.json`, JSON.stringify({
    applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    scope: 'REAL_REACT_PAGE_BUTTON_AND_REAL_ACTION_WITH_DATA_AUTH_NOTIFICATION_DOUBLES_NOT_NATIVE_BROWSER',
    visibleText: host.textContent, alerts: Array.from(host.querySelectorAll('[role=alert]')).map(n => n.textContent),
    notificationCalls: mockAviso.mock.calls.length, realAccountsOrMessagesTouched: false, ...extra,
  }, null, 2) + '\n');
}

test('control: cero fiestas leidas de verdad permite revision completa con cero avisos', async () => {
  const { host, cerrar } = await usarBoton();
  try { expect(host.textContent).toContain('Revisión completa. Avisos creados: 0'); expect(host.querySelector('[role=alert]')).toBeNull(); }
  finally { cerrar(); }
});

test.each([
  ['silenciado', { success: true, notification: undefined }],
  ['duplicado', { success: true, notification: { id: 'previo' }, isDuplicate: true }],
])('control: aviso %s no es un error ni se cuenta como creado', async (_caso, response) => {
  mockFiestas.mockResolvedValue([fiesta('qa129-unica')]); mockAviso.mockResolvedValue(response);
  const { host, cerrar } = await usarBoton();
  try { expect(host.textContent).toContain('Revisión completa. Avisos creados: 0'); expect(host.textContent).toContain('Detectado'); expect(host.querySelector('[role=alert]')).toBeNull(); }
  finally { cerrar(); }
});

test('control: una tarea pendiente crea y muestra un aviso real en el doble', async () => {
  mockFiestas.mockResolvedValue([fiesta('qa129-unica')]);
  const { host, cerrar } = await usarBoton();
  try { expect(host.textContent).toContain('Revisión completa. Avisos creados: 1'); expect(mockAviso).toHaveBeenCalledTimes(1); }
  finally { cerrar(); }
});

test('si no se pudieron leer las fiestas, el boton no anuncia revision completa vacia', async () => {
  mockFiestas.mockRejectedValue(new Error('QA129 lectura de fiestas caida'));
  const { host, cerrar } = await usarBoton();
  try {
    anotar('lectura', host, { injected: 'getAllFiestas rejects' });
    expect(host.textContent).not.toContain('Revisión completa.');
    expect(host.querySelector('[role=alert]')).not.toBeNull();
  } finally { cerrar(); }
});

test('si no se pudo guardar un aviso, el boton lo distingue de silenciado o duplicado', async () => {
  mockFiestas.mockResolvedValue([fiesta('qa129-unica')]);
  mockAviso.mockResolvedValue({ success: false, error: 'QA129 no se pudo guardar el aviso' });
  const { host, cerrar } = await usarBoton();
  try {
    anotar('aviso', host, { injected: 'createNotification returns success:false' });
    expect(host.textContent).not.toContain('Revisión completa.');
    expect(host.querySelector('[role=alert]')).not.toBeNull();
  } finally { cerrar(); }
});

test('un lote con un aviso creado y otro fallido conserva el creado pero informa el fallo parcial', async () => {
  mockFiestas.mockResolvedValue([fiesta('qa129-uno'), fiesta('qa129-dos')]);
  mockAviso.mockResolvedValueOnce({ success: true, notification: { id: 'aviso-uno' }, isDuplicate: false })
    .mockResolvedValueOnce({ success: false, error: 'QA129 segundo aviso no guardado' });
  const result: any = await runSmartAutomations();
  fs.writeFileSync('docs/evidencias/129-auto-lote-observado.json', JSON.stringify({
    applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    scope: 'REAL_ACTION_WITH_NOTIFICATION_DATA_AUTH_DOUBLES', result,
    expected: 'Conservar un aviso creado y comunicar explicitamente el otro fallo, no exito global sin advertencia',
    realAccountsOrMessagesTouched: false,
  }, null, 2) + '\n');
  expect(result.created).toBe(1);
  expect(result.results).toHaveLength(2);
  expect(result.success === false || Boolean(result.warning) || result.partial === true || (result.errors?.length > 0)).toBe(true);
});
