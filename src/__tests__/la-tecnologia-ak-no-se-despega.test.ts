/**
 * @fileOverview Pruebas para la Orden 106 Bloque 12:
 * La tecnología de AK no se despega entre vidriera, catálogo y recorridos.
 */

import { TECNOLOGIAS_AK, GRUPOS_TECNOLOGIA } from '@/data/tecnologia-ak';

describe('106 — La tecnología AK no se despega', () => {
  test('la lista de tecnologías no está vacía y tiene representación en todos los grupos', () => {
    expect(TECNOLOGIAS_AK.length).toBeGreaterThanOrEqual(10);

    const gruposPresentes = new Set(TECNOLOGIAS_AK.map((t) => t.grupo));
    for (const key of Object.keys(GRUPOS_TECNOLOGIA)) {
      expect(gruposPresentes.has(key as any)).toBe(true);
    }
  });

  test('cada tarjeta de la lista apunta a una pantalla o ruta válida de la app', () => {
    for (const item of TECNOLOGIAS_AK) {
      expect(item.rutaApp).toBeDefined();
      expect(item.rutaApp.startsWith('/')).toBe(true);
      expect(item.pasoDemo).toBeGreaterThanOrEqual(1);
      expect(item.pasoDemo).toBeLessThanOrEqual(5);
      expect(item.nombre.trim().length).toBeGreaterThan(3);
      expect(item.descripcionCorta.trim().length).toBeGreaterThan(10);
    }
  });

  test('todas las tecnologías tienen un id único sin colisiones', () => {
    const ids = TECNOLOGIAS_AK.map((t) => t.id);
    const setIds = new Set(ids);
    expect(setIds.size).toBe(ids.length);
  });
});
