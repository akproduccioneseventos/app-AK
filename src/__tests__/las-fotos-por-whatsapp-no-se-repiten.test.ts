/**
 * @jest-environment node
 */
jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/firebase/modo-local', () => ({
  sinBaseDisponible: jest.fn(() => true),
  sinDepositoDisponible: jest.fn(() => true),
}));

jest.mock('@/lib/firebase/server', () => ({
  dbAdmin: null,
}));

jest.mock('firebase-admin', () => ({
  __esModule: true,
  default: { firestore: { FieldValue: { serverTimestamp: jest.fn(), increment: jest.fn(), arrayUnion: jest.fn() } } },
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(),
  writeData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({
  getFiestaByIdRaw: jest.fn(),
}));

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(),
}));

jest.mock('@/lib/auth/require-session', () => ({
  hasAppSession: jest.fn(async () => true),
  requireAppSession: jest.fn(async () => ({ userId: 'staff-1', role: 'admin' })),
  requirePermiso: jest.fn(),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/auth/entertainment-token', () => ({
  verifyEntertainmentAccessToken: jest.fn(),
}));

jest.mock('@/lib/firebase/server-messaging', () => ({
  sendNotificationToTargets: jest.fn().mockResolvedValue({ success: true, sentCount: 0 }),
}));

jest.mock('@/lib/whatsapp/meta-sender', () => ({
  sendMetaWhatsAppMessage: jest.fn(),
}));

jest.mock('@/app/actions/whatsapp', () => ({
  getWhatsAppConfig: jest.fn(),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

import { guardarCarasDeFiesta } from '@/app/actions/social-gallery';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { readData } from '@/lib/data-service';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { getWhatsAppConfig } from '@/app/actions/whatsapp';
import type { FiestaEnPlanificacion } from '@/types/fiesta';

const mockGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockReadData = readData as jest.MockedFunction<typeof readData>;
const mockActualizarFiesta = actualizarFiesta as jest.MockedFunction<typeof actualizarFiesta>;
const mockSendMetaWhatsApp = sendMetaWhatsAppMessage as jest.MockedFunction<typeof sendMetaWhatsAppMessage>;
const mockGetWhatsAppConfig = getWhatsAppConfig as jest.MockedFunction<typeof getWhatsAppConfig>;

function clonar<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

function vectorBase(): number[] {
  return new Array(128).fill(0.15);
}

describe('Orden 371 B4.1: las fotos por WhatsApp no se repiten ante delivery uncertain', () => {
  let dbFiesta: FiestaEnPlanificacion;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadData.mockImplementation(async (_file: string, defaultVal: any) => clonar(defaultVal));
    dbFiesta = {
      id: 'fiesta-wa-371',
      configuracion: { nombreEvento: 'Boda Ana y Juan', fechaEvento: '2026-11-26' } as any,
      socialGallerySettings: {
        enabled: true,
        whatsappFotosInvitadosActivo: true,
        carasPreparadas: true,
      },
      invitados: [
        {
          id: 'inv-1',
          nombre: 'Lucía',
          rsvp: 'Confirmado',
          contacto: '099111222',
          guestAccessToken: 'tok-lucia',
        } as any,
      ],
      vectoresCarasInvitados: {
        'inv-1': {
          vector: vectorBase(),
          registradoAt: '2026-11-26T20:00:00.000Z',
        },
      },
    } as any;

    mockGetFiestaById.mockImplementation(async () => clonar(dbFiesta));
    mockGetWhatsAppConfig.mockResolvedValue({
      enabled: true,
      apiKey: 'meta-token',
      phoneNumberId: 'phone-1',
    } as any);
  });

  it('cuando Meta responde delivery: uncertain, registra como enviado y no reenvía en la tanda siguiente', async () => {
    mockActualizarFiesta.mockImplementation(async (_id, mutator) => {
      const updated = mutator(clonar(dbFiesta));
      dbFiesta = clonar(updated);
      return { success: true, fiesta: clonar(updated) } as any;
    });

    mockSendMetaWhatsApp.mockResolvedValueOnce({
      success: false,
      delivery: 'uncertain',
      error: 'Meta no respondió dentro de 10 segundos.',
    });

    const t0 = Date.parse('2026-11-26T22:00:00.000Z');
    await guardarCarasDeFiesta(
      'fiesta-wa-371',
      [{ fotoId: 'foto-1', vector: vectorBase() }],
      { incremental: true, ahoraMs: t0 },
    );

    expect(mockSendMetaWhatsApp).toHaveBeenCalledTimes(1);
    const inv = dbFiesta.invitados?.[0];
    expect(inv?.fotosYaNotificadasWhatsapp).toContain('foto-1');
    expect(inv?.ultimoWhatsappFotosAt).toBe(new Date(t0).toISOString());

    // Pasada la ventana (20 minutos después), una tanda con la misma foto no la reenvía
    const t20m = t0 + 20 * 60 * 1000;
    await guardarCarasDeFiesta(
      'fiesta-wa-371',
      [{ fotoId: 'foto-1', vector: vectorBase() }],
      { incremental: true, ahoraMs: t20m },
    );

    expect(mockSendMetaWhatsApp).toHaveBeenCalledTimes(1);
  });

  it('si falla el guardado del historial después de enviar, reintenta el guardado para no perder el registro', async () => {
    let llamadasHistorial = 0;
    mockActualizarFiesta.mockImplementation(async (_id, mutator) => {
      const siguiente = mutator(clonar(dbFiesta));
      const esGuardadoHistorial = Boolean(
        siguiente.invitados?.[0]?.fotosYaNotificadasWhatsapp?.length,
      );
      if (esGuardadoHistorial) {
        llamadasHistorial += 1;
        if (llamadasHistorial === 1) {
          return { success: false, error: 'Error transitorio de red' } as any;
        }
      }
      dbFiesta = clonar(siguiente);
      return { success: true, fiesta: clonar(siguiente) } as any;
    });

    mockSendMetaWhatsApp.mockResolvedValueOnce({
      success: true,
      messageId: 'wamid-ok',
    });

    await guardarCarasDeFiesta(
      'fiesta-wa-371',
      [{ fotoId: 'foto-2', vector: vectorBase() }],
      { incremental: true, ahoraMs: Date.parse('2026-11-26T23:00:00.000Z') },
    );

    expect(llamadasHistorial).toBe(2);
    expect(dbFiesta.invitados?.[0]?.fotosYaNotificadasWhatsapp).toContain('foto-2');
  });
});
