/**
 * El resumen del mes para el contador cuadra con el reporte (25 de septiembre de 2026).
 * Se probo rompiendolo: si los gastos van en positivo en el archivo, la suma no da el
 * resultado y se pone en rojo.
 */
import { armarResumenParaElContador, mesAnteriorA } from '@/lib/contabilidad/resumen-para-el-contador';

const datos = {
  ingresos: { total: 150000, detalle: [
    { id: 'p1', fecha: '2026-08-03T12:00:00.000Z', concepto: 'Pago Factura #10 (Cliente: Ana)', monto: 100000 },
    { id: 'p2', fecha: '2026-08-20T12:00:00.000Z', concepto: 'Seña "XV" de Sofía', monto: 50000 },
  ] },
  costos: { total: 40000, detalle: [
    { id: 'g1', fecha: '2026-08-05T12:00:00.000Z', concepto: 'Carne', categoria: 'Comida', monto: 40000 },
  ] },
  gananciaNeta: 110000,
  margen: 0.73,
};

describe('El resumen del mes para el contador', () => {
  const r = armarResumenParaElContador(datos as any, 'agosto de 2026');

  it('el archivo suma lo mismo que el resultado del reporte', () => {
    const montos = r.csv.split('\n').slice(1).map((l) => Number(l.split(';').pop()));
    expect(montos.reduce((a, b) => a + b, 0)).toBe(110000);
  });

  it('trae un renglón por cobro y por gasto, y respeta las comillas', () => {
    expect(r.csv.split('\n')).toHaveLength(4);
    expect(r.csv).toContain('"Seña ""XV"" de Sofía"');
  });

  it('el texto dice cobrado, gastado y resultado del mes', () => {
    expect(r.asunto).toContain('agosto de 2026');
    expect(r.texto).toMatch(/Cobrado: \$ 150\.000/);
    expect(r.texto).toMatch(/Resultado: \$ 110\.000/);
  });

  it('el mes anterior de enero es diciembre del año anterior', () => {
    const m = mesAnteriorA(new Date(2027, 0, 1));
    expect(m.clave).toBe('2026-12');
    expect(m.hasta.getDate()).toBe(31);
  });
});
