/**
 * Unit tests for the parseBudgetText deterministic parser.
 *
 * No mocks needed — parseBudgetText is pure (no I/O).
 */

import { parseBudgetText } from '@/lib/parse-budget-text';

describe('parseBudgetText', () => {
  describe('structured budget text (AK Producciones format)', () => {
    const structuredText = `
AK Producciones

Cliente: Vana Rodríguez
Fecha del evento: 09/05/2026
Tipo de evento: Casamiento
Salón: Los Ángeles

DETALLE DE ARTÍCULOS
DJ          1  $50.000   $50.000
Mozos       3  $15.000   $45.000
Decoración  1  $80.000   $80.000

TOTAL: $175.000
    `.trim();

    it('extracts the client name', () => {
      const result = parseBudgetText(structuredText);
      expect(result.clienteNombre).toBe('Vana Rodríguez');
    });

    it('extracts the event type', () => {
      const result = parseBudgetText(structuredText);
      expect(result.eventoTipo).toMatch(/casamiento/i);
    });

    it('parses a DD/MM/YYYY date', () => {
      const result = parseBudgetText(structuredText);
      expect(result.eventoFecha).toBeTruthy();
      const d = new Date(result.eventoFecha);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(4); // May = index 4
      expect(d.getDate()).toBe(9);
    });

    it('extracts the venue', () => {
      const result = parseBudgetText(structuredText);
      expect(result.salonFiestas).toContain('Los Ángeles');
    });

    it('extracts items', () => {
      const result = parseBudgetText(structuredText);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it('extracts the declared total', () => {
      const result = parseBudgetText(structuredText);
      expect(result.totalDeclarado).toBeGreaterThan(0);
    });

    it('returns no warnings for a complete budget', () => {
      const result = parseBudgetText(structuredText);
      // Only date warning may appear; client name and items should be found
      const hasClientWarning = result.warnings.some(w => w.toLowerCase().includes('cliente'));
      const hasItemWarning = result.warnings.some(w => w.toLowerCase().includes('ítem') || w.toLowerCase().includes('item'));
      expect(hasClientWarning).toBe(false);
      expect(hasItemWarning).toBe(false);
    });
  });

  describe('partial / free-form text', () => {
    it('returns empty clienteNombre and a warning when missing', () => {
      const result = parseBudgetText('DJ $50.000\nMozos $30.000');
      expect(result.clienteNombre).toBe('');
      expect(result.warnings.some(w => w.toLowerCase().includes('cliente'))).toBe(true);
    });

    it('returns items with prices even from simple price lines', () => {
      const text = `
Cliente: Ana García
DETALLE DE ARTÍCULOS
DJ  1  $50.000  $50.000
      `.trim();
      const result = parseBudgetText(text);
      expect(result.items.length).toBeGreaterThanOrEqual(1);
    });

    it('handles "Mayo 2026" date format', () => {
      const result = parseBudgetText('Cliente: Test\nFecha del evento: Mayo 2026\nDETALLE DE ARTÍCULOS\nDJ 1 $10.000 $10.000');
      expect(result.eventoFecha).toBeTruthy();
      const d = new Date(result.eventoFecha);
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(4);
    });
  });

  describe('empty / invalid input', () => {
    it('handles empty string gracefully', () => {
      const result = parseBudgetText('');
      expect(result.clienteNombre).toBe('');
      expect(result.items).toEqual([]);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('handles whitespace-only input', () => {
      const result = parseBudgetText('   \n\n   ');
      expect(result.clienteNombre).toBe('');
      expect(result.items).toEqual([]);
    });

    it('handles text with no prices', () => {
      const result = parseBudgetText('Cliente: Juan\nTipo de evento: Cumpleaños\nDECORACIÓN BÁSICA\nManteles\nGlobos');
      expect(result.items).toEqual([]);
      expect(result.warnings.some(w => w.toLowerCase().includes('ítem') || w.toLowerCase().includes('item'))).toBe(true);
    });
  });
});
