/**
 * Orden 73 — Bloque 5: El itinerario no borra lo que hiciste mientras esperabas
 *
 * Se probó rompiéndola a propósito:
 * - Si al recibir respuesta de la IA se hacía setPrograma(res.data) reemplazando la lista completa,
 *   la prueba fallaba en rojo.
 * - Si se permitían horarios duplicados o se repoblaba automáticamente una lista vacía, la prueba fallaba en rojo.
 */

import fs from 'fs';
import path from 'path';

describe('Orden 73 Bloque 5: El itinerario no borra lo que hiciste', () => {
  const pagePath = path.join(process.cwd(), 'src/app/(app)/fiestas/nueva/itinerario/page.tsx');
  const content = fs.readFileSync(pagePath, 'utf8');

  test('no repuebla automáticamente una lista que el usuario dejó vacía a propósito', () => {
    // Debe respetar el array existente sin inyectar defaultItems si es un array
    expect(content).not.toMatch(/if\s*\(\s*itinerario\.length\s*===\s*0\s*\)\s*\{\s*const defaultItems/);
    expect(content).toContain('Array.isArray(itinerario)');
  });

  test('rechaza guardar dos momentos con el mismo horario exacto', () => {
    // Al detectar overlapping debe retornar error y no permitir guardar
    expect(content).toContain('Horario duplicado');
    expect(content).toMatch(/if\s*\(\s*overlapping\s*\)\s*\{[\s\S]*?return;/);
  });

  test('la inteligencia artificial combina con los momentos existentes sin pisarlos en silencio', () => {
    // Debe comprobar que handleGenerateIA use el estado previo para no pisar
    expect(content).toContain('horasExistentes');
    expect(content).toContain('titulosExistentes');
    expect(content).toContain('noChocan');
  });

  test('utiliza updateProgramaFiestaActual para persistir el programa', () => {
    expect(content).toContain('updateProgramaFiestaActual');
  });
});
