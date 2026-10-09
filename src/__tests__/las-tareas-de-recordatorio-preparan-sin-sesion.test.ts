/** @jest-environment node */
/**
 * Codex, auditoría 81 (puntos 1 y 2): dos tareas automáticas no preparaban nada desde el
 * despertador, que no tiene sesión de nadie.
 *
 * - Cuotas: `ejecutarEscaneoDeRecordatorios` pasaba la guardia con la llave interna y después
 *   leía las facturas con `getInvoices()`, que vuelve a pedir permiso de contabilidad. Sin sesión
 *   tiraba y no quedaba ningún recordatorio armado.
 * - Invitados: guardaba cada recordatorio sin la llave interna, el guardado pedía sesión y fallaba,
 *   y la tarea contestaba "ok" y se anotaba corrida.
 *
 * Probado rompiéndolo: con `getInvoices()` de vuelta, o sin la llave en el guardado de invitados,
 * estas pruebas se ponen en rojo.
 */
const SIN_SESION = { ok: false, error: 'Sesión no autorizada' };
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => SIN_SESION),
  requireAppSession: jest.fn(async () => SIN_SESION),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: false })) }));

const guardados: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => d),
  writeData: jest.fn(async () => undefined),
  createDataItem: jest.fn(async (_f: string, _c: string, _id: string, item: any) => { guardados.push(item); }),
  mutateDataItem: jest.fn(),
}));

const facturas = jest.fn();
jest.mock('@/lib/invoices/leer-facturas', () => ({ leerFacturasSinGuardia: () => facturas() }));
const disparos: any[] = [];
jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: jest.fn(async (trigger: string, ctx: any) => {
    disparos.push({ trigger, ctx });
    return { scheduled: 1, errors: [] };
  }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: jest.fn(), markPresupuestoAsFacturado: jest.fn(), getPresupuestos: jest.fn(async () => []),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ addInvoiceId: jest.fn(), removeInvoiceId: jest.fn() }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/firebase-sync', () => ({ forceDeleteDocFromFirestore: jest.fn() }));

const marcar = jest.fn();
jest.mock('@/lib/automatico/tareas-automaticas', () => ({ marcarCorrida: (...a: any[]) => marcar(...a) }));
jest.mock('@/lib/automatico/puerta-de-las-tareas', () => ({
  abrirPuertaDeLaTarea: jest.fn(async () => ({ permitido: true, conClave: true })),
}));
const fiestas = jest.fn();
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: () => fiestas() }));

import { WHATSAPP_AUTOMATION_INTERNAL_TOKEN } from '@/lib/whatsapp/internal-token';

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

beforeEach(() => {
  guardados.length = 0;
  disparos.length = 0;
  marcar.mockReset();
  process.env.AK_USE_LOCAL_JSON_ONLY = 'false';
});

describe('la tarea de cuotas prepara recordatorios sin sesión', () => {
  it('con la llave interna lee las facturas y arma el recordatorio de la cuota vencida', async () => {
    facturas.mockResolvedValue([{
      id: 'inv_1', invoiceNumber: 'A-1',
      customer: { id: 'cli_1', name: 'Cliente', phone: '099123456' },
      issueDate: enDias(-30), dueDate: enDias(-2),
      items: [], payments: [], subtotal: 1000, taxRate: 0, taxAmount: 0, totalAmount: 1000,
      status: 'Sent', currency: 'UYU',
    }]);
    const { ejecutarEscaneoDeRecordatorios } = await import('@/app/actions/invoices');
    const r = await ejecutarEscaneoDeRecordatorios(WHATSAPP_AUTOMATION_INTERNAL_TOKEN);
    expect(r.errors).toEqual([]);
    expect(r.success).toBe(true);
    expect(disparos.map((d) => d.trigger)).toEqual(['pago_vencido']);
    expect(disparos[0].ctx.targetPhone).toBe('099123456');
  });

  it('sin la llave y sin sesión sigue rechazando', async () => {
    const { ejecutarEscaneoDeRecordatorios } = await import('@/app/actions/invoices');
    const r = await ejecutarEscaneoDeRecordatorios();
    expect(r.success).toBe(false);
    expect(disparos).toHaveLength(0);
  });
});

describe('la tarea de invitados guarda el recordatorio sin sesión', () => {
  const fiesta = (telefono: string) => ({
    id: 'f1',
    configuracion: { fechaEvento: enDias(2), nombreEvento: 'Los 15 de Ana', horaInicio: '21:00', nombreLugar: 'Salón' },
    invitados: [{ id: 'i1', nombre: 'Pedro', rsvp: 'Confirmado', contacto: telefono }],
  });

  it('deja el mensaje en la bandeja y recién ahí la anota corrida', async () => {
    fiestas.mockResolvedValue([fiesta('099111222')]);
    const { GET } = await import('@/app/api/cron/recordatorio-a-los-invitados/route');
    const res = await GET(new Request('http://x/api/cron/recordatorio-a-los-invitados'));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.mensajesPreparados).toBe(1);
    expect(guardados).toHaveLength(1);
    expect(guardados[0]).toMatchObject({ targetPhone: '099111222', status: 'pendiente', sendingMode: 'manual_click' });
    expect(marcar).toHaveBeenCalledWith('recordatorio-a-los-invitados');
  });

  it('si el guardado falla no dice ok ni se anota corrida', async () => {
    fiestas.mockResolvedValue([fiesta('099111222')]);
    const ds = jest.requireMock('@/lib/data-service');
    ds.createDataItem.mockImplementationOnce(async () => { throw new Error('base caída'); });
    const { GET } = await import('@/app/api/cron/recordatorio-a-los-invitados/route');
    const res = await GET(new Request('http://x/api/cron/recordatorio-a-los-invitados'));
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(marcar).not.toHaveBeenCalled();
  });
});
