import type { CrmStage } from '@/types/crm';

export const DEFAULT_CRM_STAGES: CrmStage[] = [
  { id: 's1', name: 'Consultó', order: 1, headerBgColor: 'bg-sky-500', headerTextColor: 'text-sky-50', bgColor: 'bg-sky-100', borderColor: 'border-sky-500', textColor: 'text-sky-700' },
  { id: 's2', name: 'Agendó entrevista', order: 2, headerBgColor: 'bg-teal-500', headerTextColor: 'text-teal-50', bgColor: 'bg-teal-100', borderColor: 'border-teal-500', textColor: 'text-teal-700' },
  { id: 's3', name: 'Con presupuesto', order: 3, headerBgColor: 'bg-amber-500', headerTextColor: 'text-amber-900', bgColor: 'bg-amber-100', borderColor: 'border-amber-500', textColor: 'text-amber-700' },
  { id: 's4', name: 'Firmó contrato', order: 4, headerBgColor: 'bg-emerald-500', headerTextColor: 'text-emerald-50', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-500', textColor: 'text-emerald-700', isConversionStage: true },
  { id: 's5', name: 'No contrató', order: 5, headerBgColor: 'bg-rose-500', headerTextColor: 'text-rose-50', bgColor: 'bg-rose-100', borderColor: 'border-rose-500', textColor: 'text-rose-700' },
];
