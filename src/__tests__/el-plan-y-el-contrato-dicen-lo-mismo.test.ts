/**
 * Auditoría del 18/11/2026: el plan guardaba $5.000 por trimestre y el saldo a 15 días, mientras la cláusula 3 del
 * contrato que firma el cliente dice $10.000 y 30 días (A18-01). El anexo del recibo salía con `{{HITO_30}}` escrito
 * (A18-02), y el recibo mostraba "$40.410 abonados" junto a "No se han registrado pagos" (A18-03).
 */
import fs from 'node:fs';
import path from 'node:path';
import { generarPlanPagos, PAGO_MINIMO_TRIMESTRAL_DEL_CONTRATO } from '@/lib/planPagos';
import { calcularHitosDeContrato, completarMarcadoresPendientes, reemplazosDeFechasDelContrato } from '@/lib/contratos/hitos';
import { CONTRACT_TEMPLATE } from '@/lib/contract-template';
import { cobrosDelRecibo } from '@/lib/budget/cobros-del-recibo';

const UN_DIA = 24 * 60 * 60 * 1000;

describe('el plan de pagos sigue la cláusula 3 del contrato', () => {
  it('el mínimo trimestral del plan es el del contrato', () => {
    expect(PAGO_MINIMO_TRIMESTRAL_DEL_CONTRATO).toBe(10000);
    expect(CONTRACT_TEMPLATE).toContain('$10.000 (pesos uruguayos diez mil)');
    const evento = new Date(Date.now() + 400 * UN_DIA).toISOString();
    const plan = generarPlanPagos(evento, 200000);
    expect(plan.pagoMinimoTrimestral).toBe(10000);
    const trimestrales = plan.cuotas.filter(c => c.id.startsWith('cuota_') && /^cuota_\d+$/.test(c.id));
    expect(trimestrales.length).toBeGreaterThan(0);
    trimestrales.forEach(c => expect(c.montoMinimo).toBe(10000));
  });

  it('el saldo vence treinta días antes del evento, como dice el contrato', () => {
    expect(CONTRACT_TEMPLATE).toContain('treinta (30) días antes del evento');
    const evento = new Date(Date.now() + 400 * UN_DIA);
    const plan = generarPlanPagos(evento.toISOString(), 200000);
    const saldo = plan.cuotas.find(c => c.id === 'cuota_saldo_final')!;
    const dias = Math.round((evento.getTime() - new Date(saldo.fechaVencimiento).getTime()) / UN_DIA);
    expect(dias).toBe(30);
    expect(saldo.descripcion).toContain('30 días');
  });

  it('el 30% vence al primer tercio y el 50% a la mitad, los mismos días que imprime el contrato', () => {
    const evento = new Date(Date.now() + 300 * UN_DIA);
    const plan = generarPlanPagos(evento.toISOString(), 300000);
    const clave = plan.cuotas.find(c => c.esCuotaClave)!;
    const mitad = plan.cuotas.find(c => c.id === 'cuota_mitad')!;
    const diasClave = Math.round((new Date(clave.fechaVencimiento).getTime() - Date.now()) / UN_DIA);
    const diasMitad = Math.round((new Date(mitad.fechaVencimiento).getTime() - Date.now()) / UN_DIA);
    expect(diasClave).toBe(100);
    expect(diasMitad).toBe(150);
    expect(mitad.montoObjetivo).toBe(150000);
    // Lo programado hasta la mitad alcanza el 50%, y el total cierra exacto.
    const hastaMitad = plan.cuotas
      .filter(c => new Date(c.fechaVencimiento) <= new Date(mitad.fechaVencimiento))
      .reduce((s, c) => s + c.montoMinimo, 0);
    expect(hastaMitad).toBe(150000);
    expect(plan.cuotas.reduce((s, c) => s + c.montoMinimo, 0)).toBe(300000);
  });
});

describe('el anexo del contrato no sale con huecos', () => {
  it('completa las fechas de la cláusula 3 en un texto guardado con huecos', () => {
    const conHuecos = 'firmado {{FECHA_FIRMA_TEXTO}}; 30% el {{HITO_30}}; 50% el {{HITO_50}}; total el {{FECHA_SALDO_TOTAL}}.';
    const completo = completarMarcadoresPendientes(
      conHuecos,
      reemplazosDeFechasDelContrato('2026-12-06T12:00:00', '2026-11-18T12:00:00', '18/11/2026'),
    );
    expect(completo).not.toMatch(/\{\{/);
    expect(completo).toContain('6 de noviembre de 2026'); // saldo: 30 días antes del 6/12
    expect(completo).toContain('a los 18/11/2026');
  });

  it('las fechas del contrato salen de un solo lugar', () => {
    const h = calcularHitosDeContrato('2027-06-01T12:00:00', '2026-12-01T12:00:00');
    expect(h.fechaSaldoTotal).toBe('2 de mayo de 2027');
    expect(h.hito30).not.toBe('');
    const raiz = path.resolve(__dirname, '..');
    const recibo = fs.readFileSync(path.join(raiz, 'components/panels/doc--recibo-pago.tsx'), 'utf8');
    const contrato = fs.readFileSync(path.join(raiz, 'components/panels/doc--contrato-servicio.tsx'), 'utf8');
    expect(recibo).toContain('reemplazosDeFechasDelContrato(');
    expect(contrato).not.toMatch(/function calcularHitosDeContrato/);
  });
});

describe('el recibo detalla los mismos cobros que suma', () => {
  const presupuesto = {
    id: 'p1',
    pagosCliente: [
      { id: 'a', fecha: '2026-11-18', monto: 40410, metodoPago: 'Efectivo', estadoPago: 'confirmado', referencia: 'PRUEBA' },
      { id: 'b', fecha: '2026-11-19', monto: 999, metodoPago: 'Transferencia', estadoPago: 'pendiente_confirmacion' },
      { id: 'c', fecha: '2026-11-17', monto: 500, metodoPago: 'Transferencia', estadoPago: 'rechazado' },
    ],
  } as any;

  it('un cobro anotado en el presupuesto sin factura aparece en el detalle', () => {
    const cobros = cobrosDelRecibo(presupuesto, []);
    expect(cobros).toHaveLength(1);
    expect(cobros[0]).toMatchObject({ amount: 40410, method: 'Efectivo', notes: 'PRUEBA' });
  });

  it('con presupuesto no suma otra vez el pago que también está en la factura', () => {
    const factura = { invoiceNumber: 'F1', payments: [{ id: 'x', paymentDate: '2026-11-18', amount: 40410 }] } as any;
    const cobros = cobrosDelRecibo(presupuesto, [factura]);
    expect(cobros.reduce((s, c) => s + c.amount, 0)).toBe(40410);
  });

  it('sin presupuesto, el detalle son los pagos de las facturas', () => {
    const factura = { invoiceNumber: 'F1', payments: [{ id: 'x', paymentDate: '2026-11-18', amount: 300 }] } as any;
    expect(cobrosDelRecibo(null, [factura])).toEqual([expect.objectContaining({ amount: 300, invoiceNumber: 'F1' })]);
  });
});

describe('el sueldo cargado a mano entra en la ganancia aunque no haya presupuesto (C18-01)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { calcularGananciaDeEvento } = require('@/lib/costos/ganancia-evento');
  it('fiesta sin presupuesto ni sincronización: el coordinador de $1 suma $1 de personal', () => {
    const g = calcularGananciaDeEvento({ costosItems: [], others: {} }, [], [], [{ rolId: 'coord', eventSalary: 1 }], []);
    expect(g.personalEstimado).toBe(1);
    expect(g.costoReal).toBe(1);
  });
  it('si lo sincronizado es mayor, manda lo sincronizado', () => {
    const g = calcularGananciaDeEvento({ costosItems: [], others: { totalPersonalCost: 5000 } }, [], [], [{ rolId: 'coord', eventSalary: 1 }], []);
    expect(g.personalEstimado).toBe(5000);
  });
  it('calcula los hitos desde una fecha civil AAAA-MM-DD sin correrse por UTC', () => {
    const h = calcularHitosDeContrato('2027-03-15', '2026-12-01');
    expect(h.fechaSaldoTotal).toBe('13 de febrero de 2027');
    expect(h.hito30).not.toBe('');
    expect(h.hito50).not.toBe('');
  });
});

describe('el gasto del mantenimiento queda en el día que se eligió', () => {
  it('se guarda al mediodía de Uruguay y se ve el mismo día', () => {
    const fuente = fs.readFileSync(path.resolve(__dirname, '../app/actions/activos-fijos.ts'), 'utf8');
    expect(fuente).toContain('fecha: `${datos.fecha}T12:00:00-03:00`');
    const guardada = '2026-11-18T12:00:00-03:00';
    const vista = new Date(guardada).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Montevideo' });
    expect(vista).toBe('18/11/2026');
  });
});
