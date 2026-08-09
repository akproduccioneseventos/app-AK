import {
  calcularAvisosPendientes,
  tipoDeAvisoPorFecha,
  yaSeLeAviso,
  DIAS_DE_AVISO_PREVIO,
  HORAS_ENTRE_AVISOS,
} from '@/lib/cobros/escaneo-recordatorios';
import type { Invoice } from '@/types/invoice';

/**
 * Defecto real que motivo estas pruebas: la funcion que arma los recordatorios
 * de pago existia y **nadie la llamaba nunca**. Ningun cliente con la cuota
 * vencida recibia el aviso, la plata quedaba sin reclamar y nadie se enteraba.
 *
 * Ahora la dispara una tarea programada. Acá se prueba la parte que decide a
 * quien avisarle, que es donde se puede equivocar feo: mandarle dos veces al
 * mismo, o avisarle a uno que ya pago.
 */

const HOY = new Date(2026, 7, 9, 10, 0, 0);

function factura(extra: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv_1',
    invoiceNumber: 'A-1',
    customer: { id: 'cli_1', name: 'Cliente' },
    issueDate: '2026-07-01',
    dueDate: '2026-08-15',
    items: [],
    payments: [],
    subtotal: 1000,
    taxRate: 0,
    taxAmount: 0,
    totalAmount: 1000,
    status: 'Sent',
    currency: 'UYU',
    ...extra,
  } as unknown as Invoice;
}

const opciones = {
  saldoDeFactura: (inv: Invoice) => inv.totalAmount,
  leerFecha: (f: string) => {
    const [a, m, d] = f.split('-').map(Number);
    return new Date(a, m - 1, d);
  },
  ahora: HOY,
};

describe('a quien hay que avisarle del pago', () => {
  it('los plazos son los esperados', () => {
    expect(DIAS_DE_AVISO_PREVIO).toBe(3);
    expect(HORAS_ENTRE_AVISOS).toBe(24);
  });

  it('avisa cuando la cuota ya vencio', () => {
    expect(tipoDeAvisoPorFecha(-1)).toBe('pago_vencido');
  });

  it('avisa hasta tres dias antes, no antes', () => {
    expect(tipoDeAvisoPorFecha(0)).toBe('pago_por_vencer');
    expect(tipoDeAvisoPorFecha(3)).toBe('pago_por_vencer');
    expect(tipoDeAvisoPorFecha(4)).toBeNull();
  });

  it('no le avisa al que ya pago', () => {
    const avisos = calcularAvisosPendientes([factura({ status: 'Paid', dueDate: '2026-08-01' })], [], opciones);
    expect(avisos).toHaveLength(0);
  });

  it('no le avisa al que tiene saldo cero aunque figure sin pagar', () => {
    const avisos = calcularAvisosPendientes(
      [factura({ dueDate: '2026-08-01' })],
      [],
      { ...opciones, saldoDeFactura: () => 0 },
    );
    expect(avisos).toHaveLength(0);
  });

  it('avisa por una cuota vencida', () => {
    const avisos = calcularAvisosPendientes([factura({ dueDate: '2026-08-01' })], [], opciones);
    expect(avisos).toHaveLength(1);
    expect(avisos[0].trigger).toBe('pago_vencido');
  });

  it('no le manda dos veces el mismo aviso en el dia', () => {
    const yaMandado = [{
      targetId: 'cli_1',
      templateType: 'pago_vencido',
      status: 'enviado',
      sentAt: new Date(2026, 7, 9, 8, 0, 0).toISOString(),
    }];
    const avisos = calcularAvisosPendientes([factura({ dueDate: '2026-08-01' })], yaMandado, opciones);
    expect(avisos).toHaveLength(0);
  });

  it('tampoco si ya hay uno esperando salir', () => {
    const pendiente = [{ targetId: 'cli_1', templateType: 'pago_vencido', status: 'pendiente' }];
    expect(yaSeLeAviso(pendiente, 'cli_1', 'pago_vencido', HOY)).toBe(true);
  });

  it('pasadas 24 horas se le puede volver a avisar', () => {
    const viejo = [{
      targetId: 'cli_1',
      templateType: 'pago_vencido',
      status: 'enviado',
      sentAt: new Date(2026, 7, 7, 8, 0, 0).toISOString(),
    }];
    const avisos = calcularAvisosPendientes([factura({ dueDate: '2026-08-01' })], viejo, opciones);
    expect(avisos).toHaveLength(1);
  });

  it('un aviso a otro cliente no tapa el de este', () => {
    const deOtro = [{ targetId: 'cli_9', templateType: 'pago_vencido', status: 'pendiente' }];
    const avisos = calcularAvisosPendientes([factura({ dueDate: '2026-08-01' })], deOtro, opciones);
    expect(avisos).toHaveLength(1);
  });
});
