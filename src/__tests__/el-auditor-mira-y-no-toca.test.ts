/** @jest-environment node */

import { createSignedSessionToken } from '@/lib/auth/session-token';
import { MENSAJE_ERROR_AUDITOR } from '@/lib/auth/solo-lectura';
import { writeData } from '@/lib/data-service';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { dbAdmin } from '@/lib/firebase/server';
import { uploadToStorage } from '@/lib/firebase/storage';
import { sendMetaWhatsAppMessage } from '@/lib/whatsapp/meta-sender';
import { registrarConsumoIA } from '@/lib/ai/consumo-servidor';
import { sendGoogleGmailMessage, upsertGoogleCalendarEvent } from '@/lib/google-workspace';
import type { GoogleWorkspaceAccount, GoogleWorkspaceEventInput } from '@/types/google-workspace';

let currentCookieToken: string | undefined = undefined;

const mockUsers: Record<string, any> = {
  'usr-auditor-1': { activo: true, cerradoEl: null, perfil: 'auditor' },
};

jest.mock('@/lib/firebase/server', () => {
  const { wrapFirestoreWithReadOnlyLock } = jest.requireActual('@/lib/firebase/server');
  const rawDb = {
    collection: (col: string) => ({
      doc: (id: string) => ({
        get: jest.fn(async () => {
          if (col === 'users') {
            const u = mockUsers[id] || { activo: true, cerradoEl: null, perfil: 'auditor' };
            return { exists: true, data: () => u };
          }
          return { exists: false, data: () => undefined };
        }),
        set: jest.fn(async () => {}),
      }),
    }),
    runTransaction: jest.fn(async (fn: any) => fn({})),
  };
  return {
    dbAdmin: wrapFirestoreWithReadOnlyLock(rawDb),
    wrapFirestoreWithReadOnlyLock,
  };
});

jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name: string) => {
      if (name === 'ak_session' && currentCookieToken !== undefined) {
        return { name: 'ak_session', value: currentCookieToken };
      }
      return undefined;
    }),
  })),
}));

describe('Orden 276: El auditor mira y no toca', () => {
  const originalSecret = process.env.AK_SESSION_SECRET;

  beforeAll(() => {
    process.env.AK_SESSION_SECRET = 'secret-para-tests-auditor-solo-lectura-32-chars-long';
    process.env.AK_USE_LOCAL_JSON_ONLY = 'true';
    process.env.AK_ALLOW_LOCAL_JSON_WRITES = 'true';
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.AK_SESSION_SECRET;
    } else {
      process.env.AK_SESSION_SECRET = originalSecret;
    }
    const fs = require('node:fs');
    const path = require('node:path');
    for (const dir of ['data', 'src/data']) {
      const p = path.join(process.cwd(), dir, 'salones.json');
      if (fs.existsSync(p)) {
        try { fs.unlinkSync(p); } catch {}
      }
    }
  });

  beforeEach(() => {
    currentCookieToken = undefined;
  });

  it('con sesión de auditor, cada una tira el error del candado y no escribe nada', async () => {
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-auditor-1',
      email: 'auditor@externo.com',
      role: 'user',
      perfil: 'auditor',
    });

    // 1. writeData
    await expect(writeData('salones.json', [])).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 2. mutateGenericJsonArray
    await expect(mutateGenericJsonArray('salones.json', () => [])).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 3. un set con dbAdmin
    await expect(
      dbAdmin.collection('test_col').doc('doc1').set({ prueba: 1 }),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 4. un runTransaction con dbAdmin
    await expect(
      dbAdmin.runTransaction(async () => {}),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 5. uploadToStorage
    await expect(
      uploadToStorage(Buffer.from('fake'), 'test/doc.pdf', 'application/pdf'),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 6. el envío de WhatsApp
    await expect(
      sendMetaWhatsAppMessage({
        to: '59899123456',
        text: 'Mensaje de prueba',
        apiToken: 'fake-token',
        phoneNumberId: '12345678',
      }),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 7. registrarConsumoIA
    await expect(
      registrarConsumoIA('asistente_consulta', 1),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    // 8 y 9. Google Workspace (Gmail y Calendar)
    const fakeAccount: GoogleWorkspaceAccount = {
      accountKind: 'empresa',
      accountKey: 'empresa',
      label: 'AK Producciones',
      connectedAt: '2026-01-01T00:00:00Z',
      connectedBy: 'admin',
      scopes: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/gmail.send'],
      accessToken: 'fake-token',
    };

    const fakeEvent: GoogleWorkspaceEventInput = {
      summary: 'Evento de prueba',
      start: '2026-12-01T20:00:00Z',
      end: '2026-12-02T04:00:00Z',
    };

    const fetchSpy = jest.spyOn(global, 'fetch');

    await expect(
      sendGoogleGmailMessage(fakeAccount, 'cliente@ejemplo.com', 'Asunto', '<p>Hola</p>'),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    await expect(
      upsertGoogleCalendarEvent(fakeAccount, fakeEvent),
    ).rejects.toThrow(MENSAJE_ERROR_AUDITOR);

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('con sesión de dueño, las operaciones funcionan y no son frenadas por el candado de auditor', async () => {
    currentCookieToken = await createSignedSessionToken({
      userId: 'usr-dueno-1',
      email: 'dueno@akproducciones.com',
      role: 'admin',
      perfil: 'dueno',
    });

    // writeData funciona sin lanzar el error de auditor
    await expect(writeData('salones.json', [])).resolves.not.toThrow();

    // mutateGenericJsonArray funciona sin lanzar el error de auditor
    const resMutate = await mutateGenericJsonArray('salones.json', () => []);
    expect(resMutate).toEqual([]);

    // registrarConsumoIA no tira el error de auditor
    await expect(registrarConsumoIA('asistente_consulta', 1)).resolves.not.toThrow();
  });

  it('sin sesión (tarea automática o cron), las operaciones no son bloqueadas por el candado', async () => {
    currentCookieToken = undefined;

    // writeData funciona
    await expect(writeData('salones.json', [])).resolves.not.toThrow();

    // mutateGenericJsonArray funciona
    const resMutate = await mutateGenericJsonArray('salones.json', () => []);
    expect(resMutate).toEqual([]);

    // registrarConsumoIA funciona sin lanzar error
    await expect(registrarConsumoIA('asistente_consulta', 1)).resolves.not.toThrow();
  });
});
