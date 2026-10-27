/** @jest-environment node */
import fs from 'fs';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { CONTRACT_TEMPLATE } from '@/lib/contract-template';
import { PREGUNTAS_FRECUENTES_DEL_CONTRATO } from '@/data/preguntas-frecuentes-contrato';

const presupuesto = (activo: boolean): any => ({
  id: 'qa737_presupuesto', estado: 'Aceptado', totalConDescuento: 100000,
  fechaFirmaContrato: '2026-10-01', timestamp: '2026-10-01', eventoFecha: '2027-10-01',
  ajusteAnualActivo: activo, ajusteAnualPorcentaje: 15,
  pagosCliente: [{ id: 'qa737_pago', fecha: '2026-10-02', monto: 50000, metodoPago: 'Efectivo', estadoPago: 'confirmado' }],
});
const faq = PREGUNTAS_FRECUENTES_DEL_CONTRATO.find(p => /precio cambia/.test(p.pregunta))!;

test('control sin ajuste: el saldo es50000', () => {
  expect(getBudgetPaymentSummary(presupuesto(false), { includeAnnualAdjustment: true }).balance).toBe(50000);
});
test('control motor vigente: ajuste sobre presupuesto100000, resta pago50000 y deja65000', () => {
  const r = getBudgetPaymentSummary(presupuesto(true), { includeAnnualAdjustment: true });
  expect(r).toMatchObject({ total: 115000, paid: 50000, balance: 65000 });
  expect(CONTRACT_TEMPLATE).toContain('cada nuevo ajuste se calculará sobre el importe ya ajustado');
});
test('FAQ no promete ajuste solo sobre saldo cuando contrato y motor ajustan presupuesto', () => {
  const r = getBudgetPaymentSummary(presupuesto(true), { includeAnnualAdjustment: true });
  const saldoPrometidoPorFAQ = (100000 - 50000) * 1.15;
  if (process.env.AK_QA_EVIDENCE_OUT) fs.writeFileSync(process.env.AK_QA_EVIDENCE_OUT, JSON.stringify({
    fuente: '0abe9199ddb7281a945fd0f000a1a89f25b8fa8e', pregunta: faq.pregunta, respuesta: faq.respuesta,
    resumenReal: r, saldoSegunFrase: saldoPrometidoPorFAQ, diferencia: r.balance - saldoPrometidoPorFAQ,
    limites: 'Motor y FAQ reales/datos ficticios; no contrato individual almacenado ni asesoria legal definitiva',
  }, null, 2));
  expect(faq.respuesta).not.toMatch(/sobre lo que falte/i);
});
