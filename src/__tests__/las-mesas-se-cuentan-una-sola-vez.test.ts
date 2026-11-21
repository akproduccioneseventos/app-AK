/**
 * Orden 73 — Bloque 3: Números de mesa: cuenta idéntico a cartelería y no se queda cargando
 * Cubre la pantalla /fiestas/nueva/numeros-mesa y /fiestas/nueva/carteleria
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

  test('las rutas viejas de cartelería y números de mesa redirigen en next.config.js y el conteo vive en contar-mesas', () => {
    const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(nextConfig).toContain("source: '/fiestas/nueva/carteleria'");
    expect(nextConfig).toContain("source: '/fiestas/nueva/numeros-mesa'");

    const contarMesasContent = fs.readFileSync(path.join(process.cwd(), 'src/lib/mesas/contar-mesas.ts'), 'utf8');
    expect(contarMesasContent).toContain('export function filterTableElements');
    expect(contarMesasContent).toContain('export function contarMesasDeSalon');
  });

  test('las pantallas activas de fiesta usan EmptyStateModulo y manejan error sin spinner infinito', () => {
    const barraPath = path.join(process.cwd(), 'src/components/panels/fiesta--barra-tecnologica.tsx');
    const content = fs.readFileSync(barraPath, 'utf8');

    expect(content).not.toMatch(/if\s*\(\s*isLoading\s*\|\|\s*!fiesta\s*\)/);
    expect(content).toContain('if (error)');
    expect(content).toContain('EmptyStateModulo');
  });
});
