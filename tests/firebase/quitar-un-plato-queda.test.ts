/** @jest-environment node */
process.env.AK_SESSION_SECRET = 'prueba-338-menu-secreto-entropia';
process.env.FIREBASE_PROJECT_ID = 'demo-ak-producciones';
delete process.env.AK_USE_LOCAL_JSON_ONLY;
jest.setTimeout(60000);

jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined, set: () => undefined, getAll: () => [] }),
  headers: async () => new Headers(),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: async () => ({ success: true, user: { email: 'dueno@ak.uy', role: 'admin', perfil: 'dueno', userId: 'dueno-338' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: async () => undefined,
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: async () => null }));

import fs from 'node:fs';
import path from 'node:path';
import { saveMenu, getMenus, deleteMenu, invalidateMenusCache } from '@/app/actions/menus-catering';
import type { FullMenu, MenuItem } from '@/types/catering';

const localFiles = [
  path.join(process.cwd(), 'data', 'menus-catering.json'),
  path.join(process.cwd(), 'src', 'data', 'menus-catering.json'),
];

const backups = new Map<string, string | null>();
let createdMenuId: string | undefined;

describe('quitar un plato del menú queda correctamente en emulador', () => {
  beforeAll(() => {
    expect(Boolean(process.env.FIRESTORE_EMULATOR_HOST)).toBe(true);
    for (const file of localFiles) {
      backups.set(file, fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
    }
  });

  afterAll(async () => {
    if (createdMenuId) {
      try {
        await deleteMenu(createdMenuId);
      } catch {}
      try {
        const { dbAdmin } = await import('@/lib/firebase/server');
        if (dbAdmin) {
          await dbAdmin.collection('menus_catering').doc(createdMenuId).delete();
        }
      } catch {}
    }

    for (const [file, content] of backups.entries()) {
      try {
        if (content === null) {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        } else {
          fs.writeFileSync(file, content, 'utf8');
        }
      } catch {}
    }
  });

  it('crea menú con 2 platos, quita uno y valida que se actualiza en la base', async () => {
    const plato1: MenuItem = {
      id: 'p1-338',
      name: 'Entrada Emulador 338',
      type: 'Entrada',
      ingredients: [],
      totalDishCost: 100,
      suggestedSellingPrice: 250,
    };

    const plato2: MenuItem = {
      id: 'p2-338',
      name: 'Principal Emulador 338',
      type: 'Plato Principal',
      ingredients: [],
      totalDishCost: 300,
      suggestedSellingPrice: 650,
    };

    const resCreate = await saveMenu({
      name: 'Menu Emulador 338',
      description: 'Prueba quitar plato',
      items: [plato1, plato2],
      estadoPublicacion: 'borrador',
    });

    expect(resCreate.success).toBe(true);
    expect(resCreate.id).toBeDefined();
    createdMenuId = resCreate.id!;

    await invalidateMenusCache();
    let menus = await getMenus();
    const menuCreado = menus.find((m) => m.id === createdMenuId);
    expect(menuCreado).toBeDefined();
    expect(menuCreado!.items.some((i) => i.id === 'p1-338')).toBe(true);
    expect(menuCreado!.items.some((i) => i.id === 'p2-338')).toBe(true);
    expect(menuCreado!.items.map((i) => i.id)).toEqual(['p1-338', 'p2-338']);

    const resUpdate = await saveMenu({
      ...menuCreado!,
      items: [plato1],
    });

    expect(resUpdate.success).toBe(true);

    await invalidateMenusCache();
    menus = await getMenus();
    const menuActualizado = menus.find((m) => m.id === createdMenuId);
    expect(menuActualizado).toBeDefined();
    expect(menuActualizado!.items.some((i) => i.id === 'p1-338')).toBe(true);
    expect(menuActualizado!.items.some((i) => i.id === 'p2-338')).toBe(false);
    expect(menuActualizado!.items.map((i) => i.id)).toEqual(['p1-338']);
    expect(menuActualizado!.name).toBe('Menu Emulador 338');
  });
});
