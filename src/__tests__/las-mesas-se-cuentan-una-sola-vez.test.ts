/**
 * Orden 73 — Bloque 3: Números de mesa: cuenta idéntico a cartelería y no se queda cargando
 *
 * Se probó rompiéndola a propósito:
 * - Si cartelería y números de mesa usaban lógicas de conteo distintas (una por categoría y otra por nombre/seats),
 *   la prueba fallaba en rojo con conteos dispares.
 * - Si la pantalla devolvía el spinner cuando fallaba la carga o faltaba la fiesta, la prueba fallaba en rojo.
 */

import fs from 'fs';
import path from 'path';
import { contarMesasDeSalon, filterTableElements } from '@/lib/mesas/contar-mesas';
import type { LayoutElement } from '@/types/fiesta';

describe('Orden 73 Bloque 3: Las mesas se cuentan una sola vez', () => {
  const elementosSalonDePrueba: LayoutElement[] = [
    { id: '1', type: 'element', name: 'Mesa Principal', seats: 10, category: 'Mobiliario' } as any,
    { id: '2', type: 'element', name: 'Mesa 1', category: 'mesas' } as any,
    { id: '3', type: 'element', name: 'Mesa Dulce', seats: 0, category: 'Comida' } as any,
    { id: '4', type: 'element', name: 'Barra de Tragos', category: 'Bebidas' } as any,
    { id: '5', type: 'zone', name: 'Pista de Baile' } as any,
  ];

  test('filterTableElements y contarMesasDeSalon devuelven la misma cuenta consistente', () => {
    const mesas = filterTableElements(elementosSalonDePrueba);
    const total = contarMesasDeSalon(elementosSalonDePrueba);

    expect(mesas.length).toBe(total);
    expect(total).toBe(3); // Mesa Principal, Mesa 1, Mesa Dulce
  });

  test('las pantallas de cartelería y números de mesa usan la misma función en src/lib/mesas/contar-mesas', () => {
    const carteleriaPath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/carteleria/page.tsx');
    const numerosMesaPath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx');

    const carteleriaContent = fs.readFileSync(carteleriaPath, 'utf8');
    const numerosMesaContent = fs.readFileSync(numerosMesaPath, 'utf8');

    expect(carteleriaContent).toContain("from '@/lib/mesas/contar-mesas'");
    expect(numerosMesaContent).toContain("from '@/lib/mesas/contar-mesas'");
  });

  test('la pantalla de números de mesa no se queda cargando para siempre ante una falla', () => {
    const numerosMesaPath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/numeros-mesa/page.tsx');
    const content = fs.readFileSync(numerosMesaPath, 'utf8');

    // No debe bloquear con spinner infinito en (isLoading || !fiesta)
    expect(content).not.toMatch(/if\s*\(\s*isLoading\s*\|\|\s*!fiesta\s*\)/);
    // Debe manejar EmptyStateModulo y mostrar error
    expect(content).toContain('EmptyStateModulo');
    expect(content).toContain('error || !fiesta');
  });
});
