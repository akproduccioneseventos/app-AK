export type PaymentInstallment = {
  amount: number;
  paidAmount?: number | null;
  status?: 'pendiente' | 'pagado' | 'parcial' | 'vencido' | string;
  dueDate?: string | null;
};

export type PaymentSummary = {
  total: number;
  paid: number;
  balance: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
};

export type PaymentPlanInstallment = {
  monto?: number | null;
  montoPagado?: number | null;
  estado?: PaymentInstallment['status'];
  fechaVencimiento?: string | null;
};

function money(value: unknown) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
}

function isOverdue(installment: PaymentInstallment, now = new Date()) {
  if (installment.status === 'pagado') return false;
  if (!installment.dueDate) return installment.status === 'vencido';
  const due = new Date(installment.dueDate);
  if (Number.isNaN(due.getTime())) return installment.status === 'vencido';
  return due.getTime() < now.getTime();
}

export function getPaymentSummary(installments: PaymentInstallment[], now = new Date()): PaymentSummary {
  return installments.reduce<PaymentSummary>((summary, installment) => {
    const amount = money(installment.amount);
    const explicitPaid = money(installment.paidAmount);
    const paid =
      installment.status === 'pagado'
        ? amount
        : installment.status === 'parcial'
        ? Math.min(amount, explicitPaid)
        : 0;

    summary.total += amount;
    summary.paid += paid;

    if (installment.status === 'pagado') {
      summary.paidCount += 1;
    } else {
      summary.pendingCount += 1;
    }

    if (isOverdue(installment, now)) {
      summary.overdueCount += 1;
    }

    summary.balance = money(summary.total - summary.paid);
    return summary;
  }, {
    total: 0,
    paid: 0,
    balance: 0,
    overdueCount: 0,
    paidCount: 0,
    pendingCount: 0,
  });
}

export function getPaymentPlanSummary(cuotas: PaymentPlanInstallment[] = [], now = new Date()): PaymentSummary {
  return getPaymentSummary(
    cuotas.map((cuota) => ({
      amount: cuota.monto ?? 0,
      paidAmount: cuota.montoPagado ?? 0,
      status: cuota.estado,
      dueDate: cuota.fechaVencimiento,
    })),
    now,
  );
}
