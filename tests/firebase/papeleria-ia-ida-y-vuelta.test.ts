/** @jest-environment node */
/**
 * Prueba de ida y vuelta para papelería IA contra la base (emulador).
 */
process.env.AK_SESSION_SECRET = 'prueba-papeleria-secreto-con-suficiente-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: async () => undefined,
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: async () => null,
}));
jest.mock('@/lib/backup/schedule-after-write', () => ({
  scheduleAutoBackupAfterWrite: async () => undefined,
}));
jest.mock('@/lib/whatsapp-automation-engine', () => ({
  triggerWhatsAppAutomation: async () => ({ scheduled: 0, errors: [] }),
}));
jest.mock('@/lib/google-workspace', () => ({}));
jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: async () => ({ success: true }),
  syncAppointmentToGoogleWorkspace: async () => undefined,
}));

import { writeData } from '@/lib/data-service';
import { getFiestaById } from '@/app/actions/fiesta/fiesta.actions';
import { LECTURA_COMPLETA } from '@/lib/fiesta/lectura-completa';
import { quitarPapeleriaIAAction } from '@/app/actions/fiesta/papeleria-ia.actions';
import path from 'node:path';
import fs from 'node:fs';

const conEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const FIESTA_ID = `prueba-papeleria-${Date.now()}`;

describe('papeleria ia ida y vuelta', () => {
  afterAll(async () => {
    try {
      for (const dir of [path.join(process.cwd(), 'data', 'fiestas'), path.join(process.cwd(), 'src', 'data', 'fiestas')]) {
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (f.includes('prueba-papeleria')) fs.unlinkSync(path.join(dir, f));
          }
        }
      }
      const { dbAdmin } = await import('@/lib/firebase/server');
      if (dbAdmin) {
        await dbAdmin.collection('fiestas').doc(FIESTA_ID).delete().catch(() => {});
      }
    } catch {
      // ignore
    }
  });

  (conEmuladores ? it : it.skip)('quitarPapeleriaIAAction borra la pieza solicitada y mantiene las demás', async () => {
    await writeData(`fiestas/${FIESTA_ID}.json`, {
      id: FIESTA_ID,
      estado: 'En Planificación',
      configuracion: { nombreEvento: 'Fiesta Papeleria', fechaEvento: '2030-01-01' },
      papeleriaIA: {
        cartaTragos: { url: 'https://storage.googleapis.com/demo/carta.png', creadoEn: new Date().toISOString() },
        menuMesa: { url: 'https://storage.googleapis.com/demo/menu.png', creadoEn: new Date().toISOString() },
      },
    }, undefined, { skipAutoBackup: true });

    const res = await quitarPapeleriaIAAction({ fiestaId: FIESTA_ID, pieza: 'cartaTragos' });
    expect(res.success).toBe(true);

    const fiestaLeida = await getFiestaById(FIESTA_ID, LECTURA_COMPLETA);
    expect(fiestaLeida?.papeleriaIA?.cartaTragos).toBeUndefined();
    expect(fiestaLeida?.papeleriaIA?.menuMesa?.url).toBe('https://storage.googleapis.com/demo/menu.png');
  });
});
