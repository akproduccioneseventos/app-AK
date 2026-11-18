/**
 * Orden 301, bloque 1 (auditoría de contabilidad del 13/11/2026): cada número dice qué cuenta.
 * - "Ventas totales" sumaba presupuestos aceptados además de facturas: ahora "Ventas comprometidas".
 * - "Cobros pendientes" del flujo de caja era una proyección: ahora "Ingresos esperados".
 * - Sin costos, el ratio de cobertura daba 0.00: ahora "Sin datos suficientes".
 */
import fs from 'node:fs';
import path from 'node:path';

const leer = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

describe('La contabilidad dice lo que cuenta', () => {
  it('el panel y el tablero dicen "Ventas comprometidas", no "Ventas Totales"', () => {
    for (const archivo of ['src/app/(app)/admin/page.tsx', 'src/app/(app)/empresa/contabilidad/page.tsx']) {
      const fuente = leer(archivo);
      expect(fuente).toContain('title="Ventas comprometidas"');
      expect(fuente).not.toContain('title="Ventas Totales"');
    }
  });

  it('el flujo de caja dice "Ingresos esperados" y no muestra un ratio sin costos', () => {
    const fuente = leer('src/app/(app)/empresa/contabilidad/flujo-caja/page.tsx');
    expect(fuente).toContain('title="Ingresos esperados"');
    expect(fuente).not.toContain('title="Cobros Pendientes"');
    expect(fuente).toMatch(/stats\.totalExpenses > 0 \? stats\.coverageRatio\.toFixed\(2\) : 'Sin datos suficientes'/);
  });

});
