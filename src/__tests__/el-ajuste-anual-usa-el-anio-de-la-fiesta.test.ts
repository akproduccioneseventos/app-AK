/**
 * Barrido de Codex 159 (21/10/2026): `new Date("2027-01-01").getFullYear()` en Uruguay da 2026, porque
 * la fecha sin hora se lee en Greenwich. Con eso el ajuste anual del simulador, del presupuesto impreso
 * y de la factura se calculaba con un año de menos para una fiesta del 1 de enero.
 */
import fs from 'fs';
import path from 'path';
import { anioDeLaFechaDelEvento } from '@/lib/fechas/formato-fecha-evento';

describe('el ajuste anual usa el año escrito de la fiesta', () => {
  it('lee el año tal como está escrito', () => {
    expect(anioDeLaFechaDelEvento('2027-01-01')).toBe(2027);
    expect(anioDeLaFechaDelEvento('01/01/2027 a las 21:00')).toBe(2027);
    expect(anioDeLaFechaDelEvento(new Date(2027, 0, 1))).toBe(2027);
    expect(anioDeLaFechaDelEvento('')).toBeNull();
  });

  it('ninguna cuenta del ajuste vuelve a leer el año pasando por Greenwich', () => {
    const archivos = [
      'src/app/simulador-de-presupuesto/page.tsx',
      'src/components/presupuestos/BudgetPrintTemplate.tsx',
      'src/components/budget/BudgetDocument.tsx',
      'src/components/presupuestos/paso-4-resumen.tsx',
      'src/app/(app)/invoices/[id]/page.tsx',
    ];
    const malos = archivos.filter((a) =>
      /new Date\([^)]*(eventoFecha|fechaEvento)[^)]*\)\.getFullYear\(\)/.test(
        fs.readFileSync(path.join(process.cwd(), a), 'utf8').replace(/\?\? new Date\(linkedBudget\.eventoFecha\)\.getFullYear\(\)/, ''),
      ),
    );
    expect(malos).toEqual([]);
  });
});
