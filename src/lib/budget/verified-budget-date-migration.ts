import type { Presupuesto } from '@/types/presupuesto';

const IMPORT_TIMESTAMP = '2026-06-05T12:00:00.000Z';

const ISSUE_DATE_BY_EVENT_DATE: Record<string, string> = {
  '2026-08-08': '2025-08-26',
  '2026-09-12': '2025-11-10',
  '2026-09-18': '2025-11-03',
  '2026-10-03': '2025-09-13',
  '2026-10-10': '2025-01-03',
  '2026-11-05': '2025-12-23',
  '2026-11-07': '2024-11-19',
  '2026-11-28': '2024-08-09',
  '2026-11-29': '2026-01-05',
  '2026-12-05': '2025-06-23',
  '2026-12-12': '2025-09-04',
  '2026-12-19': '2025-01-22',
  '2027-01-02': '2025-10-15',
  '2027-02-13': '2026-05-13',
  '2027-02-19': '2026-03-17',
  '2027-04-17': '2025-06-12',
  '2027-05-22': '2025-10-11',
  '2027-05-29': '2025-01-17',
  '2027-07-03': '2024-10-22',
  '2027-08-14': '2025-11-04',
  '2027-08-21': '2026-04-10',
  '2027-09-18': '2025-09-15',
  '2028-01-08': '2025-11-03',
  '2028-03-04': '2026-04-07',
  '2028-03-18': '2025-02-13',
  '2028-09-30': '2026-03-27',
  '2029-05-05': '2026-04-08',
  '2029-06-23': '2025-03-17',
  '2029-07-28': '2025-06-23',
};

export function migrateVerifiedBudgetDates(presupuestos: Presupuesto[]): {
  budgets: Presupuesto[];
  changedCount: number;
} {
  let changedCount = 0;

  const budgets = presupuestos.map(presupuesto => {
    if (!presupuesto.id.startsWith('pres_verified_') || presupuesto.timestamp !== IMPORT_TIMESTAMP) {
      return presupuesto;
    }

    const eventDate = presupuesto.eventoFecha?.slice(0, 10);
    const issueDate = eventDate ? ISSUE_DATE_BY_EVENT_DATE[eventDate] : undefined;
    if (!issueDate) return presupuesto;

    changedCount += 1;
    return {
      ...presupuesto,
      timestamp: `${issueDate}T12:00:00.000Z`,
    };
  });

  return { budgets, changedCount };
}
