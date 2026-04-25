/**
 * src/lib/assistant/app-routes.ts
 *
 * Central source of truth for all routes referenced by the AK assistant.
 * Use these constants instead of hardcoding paths in executors and actions.
 */

export const ASSISTANT_ROUTES = {
  /** CRM / Leads */
  crm: '/contabilidad/crm',

  /** Clientes */
  customers: '/customers',
  customer: (id: string) => `/customers/${id}`,

  /** Eventos (listado general) */
  events: '/eventos',

  /** Planificador de una fiesta específica */
  planner: (fiestaId: string) => `/fiestas/nueva?fiestaId=${fiestaId}`,

  /** Contrato de servicio de una fiesta */
  contract: (fiestaId: string) =>
    `/fiestas/nueva/gestion-documental/contrato-servicio?fiestaId=${fiestaId}`,

  /** Presupuesto (vista detalle) */
  budget: (id: string) => `/presupuestos/${id}/ver`,

  /** Facturas */
  invoices: '/invoices',
  invoice: (id: string) => `/invoices/${id}`,

  /** Marketing */
  marketing: '/marketing',
} as const;
