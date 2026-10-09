/** @jest-environment node */
/**
 * Si la base repite la transacción de la fiesta, el recordatorio no puede salir dos veces.
 */
jest.mock('server-only', () => ({}));

const fiestaBase = () => ({
  id: 'f1',
  configuracion: { nombreEvento: 'Boda', fechaEvento: '2026-10-31' },
  invitados: [
    { id: 'i1', nombre: 'Ana', contacto: 'ana@mail.com', guestAccessToken: 't1' },
    { id: 'i2', nombre: 'Beto', contacto: '099123456', guestAccessToken: 't2' },
  ],
});

const sendGmail = jest.fn();
const sendWa = jest.fn();
let almacen: any;

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, def: any) => {
    if (file === 'fiestas.json') return JSON.parse(JSON.stringify([almacen]));
    if (file === '_google-workspace-accounts.json') return [];
    return def;
  }),
  writeData: jest.fn(),
}));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: () => '2026-10-10' }));
jest.mock('@/lib/whatsapp/meta-sender', () => ({ sendMetaWhatsAppMessage: (...a: any[]) => sendWa(...a) }));
jest.mock('@/app/actions/scheduled-messages', () => ({ saveScheduledMessage: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/whatsapp/internal-token', () => ({ WHATSAPP_AUTOMATION_INTERNAL_TOKEN: 'tok' }));
jest.mock('@/lib/google-workspace', () => ({
  sendGoogleGmailMessage: (...a: any[]) => sendGmail(...a),
  ensureFreshGoogleAccount: jest.fn(async (a: any) => a),
  hasServiceAccountKey: () => true,
  getServiceAccountAccessToken: async () => 'tok',
  GOOGLE_WORKSPACE_SCOPES: [],
}));
// La transacción se repite: el callback corre DOS veces, cada una sobre una copia fresca.
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, fn: any) => {
    await fn(JSON.parse(JSON.stringify(almacen)));
    const segunda = await fn(JSON.parse(JSON.stringify(almacen)));
    almacen = segunda;
    return { success: true, updatedFiesta: segunda };
  }),
}));

import {
  correrTareaRecordarInvitacionNoAbierta,
  getAjustesRecordatorioInvitacion,
} from '@/lib/invitaciones/recordatorio-no-abiertas';

describe('recordatorio de invitación no abierta', () => {
  beforeEach(() => {
    almacen = fiestaBase();
    sendGmail.mockReset().mockResolvedValue({ id: 'm1' });
    sendWa.mockReset().mockResolvedValue({ success: true });
    process.env.META_WHATSAPP_TOKEN = 'x';
    process.env.META_WHATSAPP_PHONE_ID = 'y';
  });

  it('con la transacción repetida, cada invitado recibe UN solo mensaje', async () => {
    expect((await getAjustesRecordatorioInvitacion()).activo).toBe(true);
    const r = await correrTareaRecordarInvitacionNoAbierta(new Date('2026-10-10T15:00:00Z'));
    expect(sendGmail).toHaveBeenCalledTimes(1);
    expect(sendWa).toHaveBeenCalledTimes(1);
    expect(r.enviados).toBe(2);
  });
});
