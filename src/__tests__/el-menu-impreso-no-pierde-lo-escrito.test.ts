/**
 * Orden 73 — Bloque 2: Menú impreso: si falla el guardado, no se pierde lo que estabas escribiendo
 * Cubre la pantalla /fiestas/nueva/menu-mesa
 *
 * Se probó rompiéndola a propósito:
 * Si la pantalla restauraba los datos anteriores al fallar el guardado (setData(lastSavedDataRef.current)),
 * o si saveMenu guardaba menús vacíos o con números inválidos, la prueba fallaba en rojo.
 */

import fs from 'fs';
import path from 'path';
import { saveMenu } from '@/app/actions/menus-catering';

// Mock de sesión para permitir ejecutar la acción
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'admin', role: 'admin' } }),
}));

// Mock de persistencia de datos
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn().mockResolvedValue([]),
  writeData: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/app/actions/insumos', () => ({
  leerInsumosCrudos: jest.fn().mockResolvedValue([]),
}));

describe('Orden 73 Bloque 2: El menú impreso no pierde lo escrito al fallar el guardado', () => {
  test('saveMenu rechaza menús vacíos con mensaje claro', async () => {
    const res = await saveMenu({
      name: 'Menú sin platos',
      items: [],
    } as any);

    expect(res.success).toBe(false);
    expect(res.error).toBe('El menú tiene que tener al menos un plato.');
  });

  test('saveMenu rechaza platos con cantidades o costos inválidos', async () => {
    const res = await saveMenu({
      name: 'Menú con números malos',
      items: [
        {
          id: 'plato-1',
          name: 'Plato Roto',
          type: 'Principal',
          ingredients: [
            {
              id: 'ing-1',
              name: 'Carne',
              quantityPerPerson: '-500',
              unit: 'g',
              costoUnitario: 100,
            },
          ],
        },
      ],
    } as any);

    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  test('la pantalla de menú de mesa no descarta los datos escritos al fallar el guardado', () => {
    const pagePath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/menu-mesa/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    // No debe restaurar la versión anterior en el catch
    expect(content).not.toMatch(/setData\(lastSavedDataRef\.current\)/);
    // Debe tener un estado saveError para avisar arriba qué no se pudo guardar
    expect(content).toContain('saveError');
    expect(content).toContain('No se pudo guardar:');
  });
});
