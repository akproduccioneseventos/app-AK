/**
 * Barrido por forma de Codex, auditoría 81 (punto 6): además del parte de la mañana, las alertas
 * de "seña no cobrada" y "saldo de fiesta realizada" contaban un pago A CONFIRMAR como cobrado.
 * Con el pago informado y sin confirmar, la alerta no salía. Probado rompiéndolo: con el filtro
 * viejo (`estadoPago !== 'rechazado'`) estas pruebas se ponen en rojo.
 */
import { detectarErroresHumanos } from '@/lib/alertas/errores-humanos';

const AHORA = new Date('2026-10-09T12:00:00');

function fiestaEn(dias: number) {
  const d = new Date(AHORA);
  d.setDate(d.getDate() + dias);
  return {
    id: 'f1',
    presupuestoId: 'p1',
    estado: 'Confirmada',
    invitados: [{ id: 'i1' }],
    configuracion: { fechaEvento: d.toISOString().slice(0, 10), nombreEvento: 'Los 15 de Ana' },
  } as any;
}

const presupuesto = {
  id: 'p1',
  clienteNombre: 'Ana',
  senia: 20_000,
  costoTotalEstimado: 100_000,
  totalConDescuento: 100_000,
  pagosCliente: [{ monto: 100_000, estadoPago: 'pendiente_confirmacion' }],
} as any;

it('la seña informada pero sin confirmar sigue figurando sin cobrar', () => {
  const alertas = detectarErroresHumanos([fiestaEn(10)], [presupuesto], [], AHORA);
  expect(alertas.some((a) => a.id === 'sena_sin_cobrar_f1')).toBe(true);
});

it('el saldo de una fiesta realizada no se da por cobrado con un pago a confirmar', () => {
  const alertas = detectarErroresHumanos([fiestaEn(-5)], [presupuesto], [], AHORA);
  expect(alertas.some((a) => a.id === 'saldo_impago_pasado_f1')).toBe(true);
  expect(alertas.some((a) => a.id === 'sin_factura_f1')).toBe(false);
});

it('con el pago confirmado no hay alerta de seña', () => {
  const confirmado = { ...presupuesto, pagosCliente: [{ monto: 100_000, estadoPago: 'confirmado' }] };
  const alertas = detectarErroresHumanos([fiestaEn(10)], [confirmado], [], AHORA);
  expect(alertas.some((a) => a.id === 'sena_sin_cobrar_f1')).toBe(false);
});
