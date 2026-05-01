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

function money(value: number | null | undefined) {
  if (!Number.isFinite(value ?? 0)) return 0;
  return Math.max(0, Number(value ?? 0));
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

    summary.balance = Math.max(0, summary.total - summary.paid);
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
