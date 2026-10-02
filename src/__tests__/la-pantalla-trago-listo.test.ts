/**
 * @fileOverview Pruebas para la pantalla /evento/barra/[fiestaId]/listo (Orden 106 Bloque 10).
 * Comprueba que la pantalla y la acción getBarPedidosListos existan y filtren solo pedidos en estado listo.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getBarPedidosListos } from '@/app/actions/fiesta/barra-tecnologica.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'usr_test' } })),
  hasAppSession: jest.fn(async () => true),
}));

jest.mock('@/lib/firebase/server', () => ({
  getDbAdmin: jest.fn(async () => null),
  dbAdmin: null,
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => null),
  writeData: jest.fn(async () => true),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'fiesta_test_1',
    configuracion: { nombreEvento: '15 de Julieta' },
    others: {
      barraTecnologica: {
        orders: [
          { id: 'ped_1', guestName: 'Martina', drinkName: 'Caipirinha', status: 'listo' },
          { id: 'ped_2', guestName: 'Lucas', drinkName: 'Fernet', status: 'preparando' },
          { id: 'ped_3', guestName: 'Camila', drinkName: 'Daiquiri', status: 'listo' },
          { id: 'ped_4', guestName: 'Joaquín', drinkName: 'Destornillador', status: 'entregado' },
        ],
      },
    },
  })),
}));

describe('Orden 106 Bloque 10 — Pantalla "Tu trago está listo"', () => {
  const listoPath = path.join(process.cwd(), 'src/app/evento/barra/[fiestaId]/listo/page.tsx');

  test('la pantalla /evento/barra/[fiestaId]/listo existe y contiene el mensaje Tu trago está listo', () => {
    expect(fs.existsSync(listoPath)).toBe(true);
    const content = fs.readFileSync(listoPath, 'utf8');
    expect(content).toContain('Tu trago está listo');
    expect(content).toContain('getBarPedidosListos');
  });

  test('getBarPedidosListos devuelve solo los pedidos en estado listo', async () => {
    const res = await getBarPedidosListos('fiesta_test_1');
    expect(res.success).toBe(true);
    expect(res.orders).toBeDefined();
    expect(res.orders!.length).toBe(2);
    expect(res.orders!.every((o) => o.status === 'listo')).toBe(true);
    expect(res.orders!.map((o) => o.guestName)).toEqual(['Martina', 'Camila']);
  });
});
