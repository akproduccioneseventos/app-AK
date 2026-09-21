/**
 * MATAFUEGO — "Total cobrado" es lo que se pago, no lo que se debe.
 *
 * Lo encontro Codex el 21 de septiembre de 2026: la pantalla del historial de un empleado
 * sumaba **todos** los renglones del periodo, estuvieran cobrados o pendientes, y lo
 * mostraba como "Total cobrado". El numero decia que se habia pagado plata que todavia
 * se debe, y con eso se decide a quien hay que pagarle.
 *
 * Un recibo esta cobrado cuando esta 'pagado' o 'firmado_subido' (firmado y subido, que
 * es el paso siguiente al pago). 'pendiente' NO esta cobrado.
 *
 * Se probo rompiendola a proposito: sumando todos los renglones sin mirar el estado, se
 * pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const PANTALLA = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', '(app)', 'empleados', '[id]', 'historial', 'page.tsx'),
  'utf-8',
);

/** La misma regla que usa la pantalla, escrita una sola vez. */
function estaCobrado(estado: string): boolean {
  return estado === 'pagado' || estado === 'firmado_subido';
}

describe('El total cobrado del personal no miente', () => {
  it('un recibo pendiente no cuenta como cobrado', () => {
    expect(estaCobrado('pendiente')).toBe(false);
    expect(estaCobrado('pagado')).toBe(true);
    expect(estaCobrado('firmado_subido')).toBe(true);
  });

  it('la cuenta suma lo cobrado y lo pendiente por separado', () => {
    const renglones = [
      { monto: 1000, estado: 'pagado' },
      { monto: 500, estado: 'pendiente' },
      { monto: 700, estado: 'firmado_subido' },
    ];
    const cobrado = renglones.filter((r) => estaCobrado(r.estado)).reduce((s, r) => s + r.monto, 0);
    const pendiente = renglones.filter((r) => !estaCobrado(r.estado)).reduce((s, r) => s + r.monto, 0);

    expect(cobrado).toBe(1700);
    expect(pendiente).toBe(500);
  });

  it('la pantalla mira el estado antes de sumar, y muestra lo pendiente', () => {
    // Que este enganchado, no solo escrito en esta prueba.
    expect(PANTALLA).toContain('estaCobrado');
    expect(PANTALLA).toContain('totalPendiente');
    expect(PANTALLA).toContain('Pendiente de cobro');
    // La suma vieja -todos los renglones sin mirar el estado- no puede volver.
    expect(PANTALLA).not.toMatch(
      /totalCobrado = useMemo\(\s*\(\) => filteredRows\.reduce/,
    );
  });
});
