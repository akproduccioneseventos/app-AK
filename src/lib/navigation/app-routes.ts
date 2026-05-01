type RouteParam = string | number;

function encodeParam(value: RouteParam) {
  return encodeURIComponent(String(value));
}

export const appRoutes = {
  home: '/',
  login: '/login',
  events: '/eventos',
  eventSetup: (fiestaId: RouteParam) => `/fiestas/nueva?fiestaId=${encodeParam(fiestaId)}`,
  eventPayments: (fiestaId: RouteParam) => `/fiestas/nueva/plan-pagos?fiestaId=${encodeParam(fiestaId)}`,
  budgets: '/presupuestos',
  crm: '/admin/ventas',
  vipPortal: (accessKey: RouteParam) => `/portal/c/${encodeParam(accessKey)}`,
  clientPortal: (id: RouteParam) => `/portal-cliente/${encodeParam(id)}`,
  guestPortal: (fiestaId: RouteParam) => `/portal-invitado/${encodeParam(fiestaId)}`,
  invitation: (slug: RouteParam) => `/i/${encodeParam(slug)}`,
  socialWall: (fiestaId: RouteParam) => `/evento/social/${encodeParam(fiestaId)}`,
} as const;

export function withFiestaId(path: string, fiestaId: RouteParam) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}fiestaId=${encodeParam(fiestaId)}`;
}
