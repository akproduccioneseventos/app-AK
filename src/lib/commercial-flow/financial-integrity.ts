import type { FiestaEnPlanificacion } from '@/types/fiesta';
import type { Invoice } from '@/types/invoice';
import type { Presupuesto } from '@/types/presupuesto';
import { auditPresupuestoFinancialGuardrails } from '@/lib/budget/financial-guardrails';
import { isDepositReceiptInvoice } from '@/lib/commercial-flow/ledger-service';
import { invoiceMoneyTolerance, roundInvoiceMoney } from '@/lib/invoice-money';

export type FinancialIntegritySeverity = 'error' | 'warning';
export type FinancialIntegrityScope = 'presupuesto' | 'factura' | 'fiesta' | 'pago' | 'vinculo';

export interface FinancialIntegrityIssue {
  severity: FinancialIntegritySeverity;
  scope: FinancialIntegrityScope;
  entityId: string;
  message: string;
  expected?: number | string;
  actual?: number | string;
}

export interface FinancialIntegrityReport {
  counts: {
    presupuestos: number;
    facturas: number;
    fiestas: number;
    errors: number;
    warnings: number;
  };
  issues: FinancialIntegrityIssue[];
}

function addIssue(
  issues: FinancialIntegrityIssue[],
  issue: FinancialIntegrityIssue,
) {
  issues.push(issue);
}

export function buildFinancialIntegrityReport(
  presupuestos: Presupuesto[],
  invoices: Invoice[],
  fiestas: FiestaEnPlanificacion[],
): FinancialIntegrityReport {
  const issues: FinancialIntegrityIssue[] = [];
  const budgetsById = new Map(presupuestos.map((item) => [item.id, item]));
  const invoicesById = new Map(invoices.map((item) => [item.id, item]));
  const fiestasById = new Map(fiestas.map((item) => [item.id, item]));

  for (const presupuesto of presupuestos) {
    try {
      for (const guardrail of auditPresupuestoFinancialGuardrails(presupuesto)) {
        addIssue(issues, {
          severity: 'error',
          scope: 'presupuesto',
          entityId: presupuesto.id,
          message: guardrail.message,
          expected: guardrail.expected,
          actual: guardrail.actual,
        });
      }
    } catch {
      addIssue(issues, {
        severity: 'error',
        scope: 'presupuesto',
        entityId: presupuesto.id,
        message: 'El presupuesto tiene datos incompletos y no pudo recalcularse.',
      });
    }

    if (presupuesto.invoiceId && !invoicesById.has(presupuesto.invoiceId)) {
      addIssue(issues, {
        severity: 'error',
        scope: 'vinculo',
        entityId: presupuesto.id,
        message: 'El presupuesto apunta a una factura que no existe.',
        expected: presupuesto.invoiceId,
      });
    }
  }

  const invoiceNumbers = new Map<string, string>();
  const invoicePaymentIds = new Map<string, string>();
  for (const invoice of invoices) {
    const tolerance = invoiceMoneyTolerance(invoice.currency);
    const items = invoice.items || [];
    const expectedSubtotal = roundInvoiceMoney(
      items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
      invoice.currency,
    );

    if (items.length === 0) {
      addIssue(issues, {
        severity: 'warning',
        scope: 'factura',
        entityId: invoice.id,
        message: 'La factura no tiene items detallados.',
      });
    }

    for (const item of items) {
      const expectedItemTotal = roundInvoiceMoney(
        Number(item.quantity || 0) * Number(item.unitPrice || 0),
        invoice.currency,
      );
      if (Math.abs(roundInvoiceMoney(item.total, invoice.currency) - expectedItemTotal) > tolerance) {
        addIssue(issues, {
          severity: 'error',
          scope: 'factura',
          entityId: invoice.id,
          message: `El importe del item "${item.description}" no coincide con cantidad por precio.`,
          expected: expectedItemTotal,
          actual: item.total,
        });
      }
    }

    if (Math.abs(roundInvoiceMoney(invoice.subtotal, invoice.currency) - expectedSubtotal) > tolerance) {
      addIssue(issues, {
        severity: 'error',
        scope: 'factura',
        entityId: invoice.id,
        message: 'El subtotal de la factura no coincide con sus items.',
        expected: expectedSubtotal,
        actual: invoice.subtotal,
      });
    }

    const expectedTax = roundInvoiceMoney(expectedSubtotal * (Number(invoice.taxRate || 0) / 100), invoice.currency);
    const expectedTotal = roundInvoiceMoney(expectedSubtotal + expectedTax, invoice.currency);
    if (Math.abs(roundInvoiceMoney(invoice.taxAmount || 0, invoice.currency) - expectedTax) > tolerance) {
      addIssue(issues, {
        severity: 'error',
        scope: 'factura',
        entityId: invoice.id,
        message: 'El impuesto de la factura no coincide con el subtotal y la tasa.',
        expected: expectedTax,
        actual: invoice.taxAmount || 0,
      });
    }
    if (Math.abs(roundInvoiceMoney(invoice.totalAmount, invoice.currency) - expectedTotal) > tolerance) {
      addIssue(issues, {
        severity: 'error',
        scope: 'factura',
        entityId: invoice.id,
        message: 'El total de la factura no coincide con subtotal mas impuestos.',
        expected: expectedTotal,
        actual: invoice.totalAmount,
      });
    }

    const paid = roundInvoiceMoney(
      (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      invoice.currency,
    );
    if (paid > roundInvoiceMoney(invoice.totalAmount, invoice.currency) + tolerance) {
      addIssue(issues, {
        severity: 'error',
        scope: 'pago',
        entityId: invoice.id,
        message: 'Los pagos de la factura superan su total.',
        expected: invoice.totalAmount,
        actual: paid,
      });
    }

    for (const payment of invoice.payments || []) {
      if (!payment.id) continue;
      const previousInvoiceId = invoicePaymentIds.get(payment.id);
      if (previousInvoiceId && previousInvoiceId !== invoice.id) {
        addIssue(issues, {
          severity: 'error',
          scope: 'pago',
          entityId: invoice.id,
          message: `El pago ${payment.id} tambien aparece en la factura ${previousInvoiceId}.`,
        });
      } else {
        invoicePaymentIds.set(payment.id, invoice.id);
      }
    }

    const normalizedNumber = invoice.invoiceNumber?.trim().toLowerCase();
    if (normalizedNumber && !isDepositReceiptInvoice(invoice)) {
      const previousInvoiceId = invoiceNumbers.get(normalizedNumber);
      if (previousInvoiceId && previousInvoiceId !== invoice.id) {
        addIssue(issues, {
          severity: 'error',
          scope: 'factura',
          entityId: invoice.id,
          message: `El numero de factura se repite en ${previousInvoiceId}.`,
          actual: invoice.invoiceNumber,
        });
      } else {
        invoiceNumbers.set(normalizedNumber, invoice.id);
      }
    }

    if (invoice.sourcePresupuestoId && !budgetsById.has(invoice.sourcePresupuestoId)) {
      addIssue(issues, {
        severity: 'error',
        scope: 'vinculo',
        entityId: invoice.id,
        message: 'La factura apunta a un presupuesto que no existe.',
        expected: invoice.sourcePresupuestoId,
      });
    } else if (invoice.sourcePresupuestoId) {
      const budgetInvoiceId = budgetsById.get(invoice.sourcePresupuestoId)?.invoiceId;
      if (budgetInvoiceId && budgetInvoiceId !== invoice.id) {
        addIssue(issues, {
          severity: 'warning',
          scope: 'vinculo',
          entityId: invoice.id,
          message: `El presupuesto vinculado apunta a otra factura: ${budgetInvoiceId}.`,
        });
      }
    }
    if (invoice.sourceFiestaId && !fiestasById.has(invoice.sourceFiestaId)) {
      addIssue(issues, {
        severity: 'error',
        scope: 'vinculo',
        entityId: invoice.id,
        message: 'La factura apunta a una fiesta que no existe.',
        expected: invoice.sourceFiestaId,
      });
    }
  }

  const providerPayments = new Map<string, string>();
  for (const presupuesto of presupuestos) {
    for (const payment of presupuesto.pagosCliente || []) {
      if (payment.estadoPago === 'rechazado') continue;
      const providerKey = payment.proveedorPagoId || payment.sesionPagoId;
      if (!providerKey) continue;
      const previousBudgetId = providerPayments.get(providerKey);
      if (previousBudgetId && previousBudgetId !== presupuesto.id) {
        addIssue(issues, {
          severity: 'error',
          scope: 'pago',
          entityId: presupuesto.id,
          message: `La referencia del proveedor de pago tambien aparece en el presupuesto ${previousBudgetId}.`,
          actual: providerKey,
        });
      } else {
        providerPayments.set(providerKey, presupuesto.id);
      }
    }
  }

  const eventsByBudget = new Map<string, string[]>();
  for (const fiesta of fiestas) {
    if (fiesta.presupuestoId) {
      const linked = eventsByBudget.get(fiesta.presupuestoId) || [];
      linked.push(fiesta.id);
      eventsByBudget.set(fiesta.presupuestoId, linked);
      if (!budgetsById.has(fiesta.presupuestoId)) {
        addIssue(issues, {
          severity: 'error',
          scope: 'vinculo',
          entityId: fiesta.id,
          message: 'La fiesta apunta a un presupuesto que no existe.',
          expected: fiesta.presupuestoId,
        });
      }
    } else {
      addIssue(issues, {
        severity: 'warning',
        scope: 'fiesta',
        entityId: fiesta.id,
        message: 'La fiesta no tiene un presupuesto vinculado.',
      });
    }

    for (const invoiceId of fiesta.invoiceIds || []) {
      const invoice = invoicesById.get(invoiceId);
      if (!invoice) {
        addIssue(issues, {
          severity: 'error',
          scope: 'vinculo',
          entityId: fiesta.id,
          message: `La fiesta apunta a la factura inexistente ${invoiceId}.`,
        });
      } else if (invoice.sourceFiestaId && invoice.sourceFiestaId !== fiesta.id) {
        addIssue(issues, {
          severity: 'warning',
          scope: 'vinculo',
          entityId: fiesta.id,
          message: `La factura ${invoiceId} declara pertenecer a otra fiesta: ${invoice.sourceFiestaId}.`,
        });
      }
    }
  }

  for (const [budgetId, eventIds] of eventsByBudget) {
    if (eventIds.length > 1) {
      addIssue(issues, {
        severity: 'warning',
        scope: 'vinculo',
        entityId: budgetId,
        message: `El presupuesto esta vinculado a ${eventIds.length} fiestas: ${eventIds.join(', ')}.`,
      });
    }
  }

  issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.scope.localeCompare(b.scope) || a.entityId.localeCompare(b.entityId);
  });

  return {
    counts: {
      presupuestos: presupuestos.length,
      facturas: invoices.length,
      fiestas: fiestas.length,
      errors: issues.filter((item) => item.severity === 'error').length,
      warnings: issues.filter((item) => item.severity === 'warning').length,
    },
    issues,
  };
}
