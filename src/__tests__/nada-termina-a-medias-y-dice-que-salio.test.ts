/** @jest-environment node */
/**
 * LO QUE TERMINA A MEDIAS NO PUEDE DECIR QUE TERMINO.
 *
 * Es la octava pregunta del metodo, y salio de que Codex encontrara siete defectos con esa
 * misma forma en dos dias. Estos cuatro son los que quedaban en lo que toca plata y en lo
 * que sale para afuera:
 *
 * - Las invitaciones contestaban que si **sin una cuenta de Google conectada**: cero mails
 *   mandados y cartel verde.
 * - Los recordatorios de cobro contestaban que si con la lista de errores adentro: clientes
 *   con deuda se quedaban sin aviso.
 * - El borrado total contestaba "aplicacion limpia" habiendo borrado tres de siete cosas.
 * - La sena se registraba y, si el recibo no quedaba enganchado al evento, la pantalla decia
 *   "Sena Registrada" a secas: despues nadie encontraba el comprobante.
 */

const verifySession = jest.fn(async () => ({ success: true, user: { role: 'admin' } }));
const archivos: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
  requireAdminSession: jest.fn(async () => ({ ok: true })),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: (...args: unknown[]) => verifySession(...(args as [])),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => archivos[archivo] ?? porDefecto),
  writeData: jest.fn(async (archivo: string, valor: any) => { archivos[archivo] = valor; }),
}));


let borrarFacturasFalla = true;
const borradoOk = async () => ({ success: true, deletedCount: 3 });

jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/app/actions/customers', () => ({ resetAllCustomers: () => borradoOk() }));
jest.mock('@/app/actions/invoices', () => ({
  resetAllInvoices: async () => (borrarFacturasFalla ? { success: false, error: 'la base no contesta' } : { success: true, deletedCount: 3 }),
}));
jest.mock('@/app/actions/presupuestos', () => ({ resetAllPresupuestos: () => borradoOk() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  deleteAllFiestas: () => borradoOk(),
  getFiestaById: jest.fn(async () => ({
    id: 'fiesta-1',
    nombreEvento: 'Cumple de prueba',
    fechaEvento: '2026-12-01',
    invitados: [{ id: 'ana', nombre: 'Ana', contacto: 'ana@ejemplo.com' }],
  })),
  getFiestas: jest.fn(async () => []),
}));
jest.mock('@/app/actions/crm', () => ({ resetCrm: () => borradoOk() }));
jest.mock('@/app/actions/notifications', () => ({ resetAllNotifications: () => borradoOk() }));
jest.mock('@/app/actions/fiestas-historicas', () => ({ resetAllFiestasHistoricas: () => borradoOk() }));

jest.mock('@/lib/google-workspace', () => ({
  buildGoogleCalendarTemplateUrl: () => 'https://calendar.ejemplo/agregar',
  ensureFreshGoogleAccount: jest.fn(async (cuenta: any) => cuenta),
  getFiestaTimes: () => ({ safeStart: new Date('2026-12-01T22:00:00Z'), end: new Date('2026-12-02T05:00:00Z') }),
  getFiestaTitle: () => 'Cumple de prueba',
  sendGoogleGmailMessage: jest.fn(async () => undefined),
  upsertGoogleCalendarEvent: jest.fn(async () => ({ id: 'evento-1' })),
}));

describe('Las invitaciones sin cuenta conectada no son un exito', () => {
  beforeEach(() => {
    for (const clave of Object.keys(archivos)) delete archivos[clave];
    // Sin ninguna cuenta de empresa conectada.
    archivos['_google-workspace-accounts.json'] = [];
    archivos['_google-workspace-sync.json'] = [];
  });

  it('contesta que NO se pudo, y lo dice en criollo', async () => {
    const { notifyGuestsWithCalendarLinks } = await import('@/app/actions/google-workspace-extended');

    const resultado: any = await notifyGuestsWithCalendarLinks('fiesta-1');

    expect(resultado.success).toBe(false);
    expect(resultado.sent).toBe(0);
    expect(String(resultado.error)).toMatch(/cuenta de Google/i);
  });
});

describe('El borrado total avisa si quedo a medias', () => {
  it('si una parte no se pudo borrar, NO dice que quedo limpia y nombra lo que quedo', async () => {
    const { resetAppCompleto } = await import('@/app/actions/admin-reset');

    const resultado = await resetAppCompleto();

    expect(resultado.success).toBe(false);
    expect(String(resultado.error)).toMatch(/facturas/);
    expect(String(resultado.error)).toMatch(/a medias/i);
  });

  it('si se borro todo, si dice que quedo limpia', async () => {
    borrarFacturasFalla = false;
    const { resetAppCompleto } = await import('@/app/actions/admin-reset');

    const resultado = await resetAppCompleto();

    expect(resultado.success).toBe(true);
  });
});
