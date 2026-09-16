/** @jest-environment node */
/**
 * DOS COSAS QUE ENCONTRO CODEX EL 16 DE SEPTIEMBRE DE 2026, LAS DOS CIERTAS.
 *
 * 1. **Al reporte le faltaba plata del ultimo dia.** El filtro comparaba la HORA exacta:
 *    pedir "hasta el 30" significaba la medianoche del 30, asi que un cobro de ese mismo
 *    dia a las diez de la manana quedaba afuera. El mes cerraba con menos de lo que entro.
 * 2. **Al invitado le llegaban dos invitaciones.** La lista de "a quien ya se le mando" se
 *    leia al principio y se guardaba al final: dos personas del equipo apretando el boton
 *    casi juntas mandaban las dos.
 *
 * Las dos pruebas llaman al codigo de la app. Si se saca el arreglo, se ponen en rojo.
 */

const mandados: string[] = [];
const archivos: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => archivos[archivo] ?? porDefecto),
  writeData: jest.fn(async (archivo: string, valor: any) => { archivos[archivo] = valor; }),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'fiesta-1',
    nombreEvento: 'Cumple de prueba',
    fechaEvento: '2026-12-01',
    invitados: [
      { id: 'ana', nombre: 'Ana', contacto: 'ana@ejemplo.com' },
      { id: 'beto', nombre: 'Beto', contacto: 'beto@ejemplo.com' },
    ],
  })),
  getFiestas: jest.fn(async () => []),
}));

jest.mock('@/lib/google-workspace', () => ({
  buildGoogleCalendarTemplateUrl: () => 'https://calendar.ejemplo/agregar',
  ensureFreshGoogleAccount: jest.fn(async (cuenta: any) => cuenta),
  getFiestaTimes: () => ({ safeStart: new Date('2026-12-01T22:00:00Z'), end: new Date('2026-12-02T05:00:00Z') }),
  getFiestaTitle: () => 'Cumple de prueba',
  sendGoogleGmailMessage: jest.fn(async (_cuenta: any, para: string) => {
    // Un envio de verdad tarda: es justo el rato en que la otra persona aprieta el boton.
    await new Promise((listo) => setTimeout(listo, 5));
    mandados.push(para);
  }),
  upsertGoogleCalendarEvent: jest.fn(async () => ({ id: 'evento-1' })),
}));

describe('El reporte cuenta todos los dias, incluido el ultimo', () => {
  it('un cobro del ultimo dia entra, aunque sea de la manana', async () => {
    const { inRange } = await import('@/lib/reportes/rango-de-dias');
    const desde = new Date('2026-09-01T00:00:00');
    const hasta = new Date('2026-09-30T00:00:00');

    expect(inRange('2026-09-30T10:00:00', desde, hasta)).toBe(true);
    expect(inRange('2026-09-30', desde, hasta)).toBe(true);
    expect(inRange('2026-09-01', desde, hasta)).toBe(true);
  });

  it('lo del mes siguiente sigue afuera', async () => {
    const { inRange } = await import('@/lib/reportes/rango-de-dias');

    expect(inRange('2026-10-01', new Date('2026-09-01T00:00:00'), new Date('2026-09-30T00:00:00'))).toBe(false);
  });
});

describe('Las invitaciones no se mandan dos veces', () => {
  beforeEach(() => {
    mandados.length = 0;
    for (const clave of Object.keys(archivos)) delete archivos[clave];
    archivos['_google-workspace-accounts.json'] = [
      { id: 'empresa', kind: 'company', status: 'connected', accessToken: 'x', email: 'ak@ejemplo.com' },
    ];
    archivos['_google-workspace-sync.json'] = [];
  });

  it('dos personas apretando el boton a la vez le mandan UNA invitacion a cada invitado', async () => {
    const { notifyGuestsWithCalendarLinks } = await import('@/app/actions/google-workspace-extended');

    await Promise.all([
      notifyGuestsWithCalendarLinks('fiesta-1'),
      notifyGuestsWithCalendarLinks('fiesta-1'),
    ]);

    expect(mandados.filter((para) => para === 'ana@ejemplo.com')).toHaveLength(1);
    expect(mandados.filter((para) => para === 'beto@ejemplo.com')).toHaveLength(1);
  });
});
