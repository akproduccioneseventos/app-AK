export type LaunchReadinessStatus = 'listo' | 'revisar' | 'critico';

export interface LaunchReadinessArea {
  id: string;
  title: string;
  status: LaunchReadinessStatus;
  simpleGoal: string;
  whatWasMissing: string;
  visibleRoute: string;
  owner: string;
  checks: string[];
}

export const CTO_LAUNCH_READINESS_AREAS: LaunchReadinessArea[] = [
  {
    id: 'sync_matrix',
    title: 'Sincronizaciones generales',
    status: 'listo',
    simpleGoal: 'Que cada motor tenga ruta visible, ruta de edicion y una explicacion simple de donde salen los datos.',
    whatWasMissing: 'No habia una pantalla unica para detectar si algo quedaba suelto entre PRs.',
    visibleRoute: '/settings/sincronizaciones',
    owner: 'CTO AK',
    checks: ['Mapa de conexiones', 'Vista publica', 'Vista interna', 'Estado simple por modulo'],
  },
  {
    id: 'assistants',
    title: 'Asistentes contextuales',
    status: 'listo',
    simpleGoal: 'Que el asistente que ves cambie segun la pantalla y se pueda diferenciar por foto y color.',
    whatWasMissing: 'El asistente estaba conectado a la app, pero siempre se veia como un asistente generico.',
    visibleRoute: '/settings/asistentes-contextuales',
    owner: 'Operacion AK',
    checks: ['Secretaria por CRM/clientes', 'Contador por pagos/facturas', 'Marketing por ventas', 'Salones y decoracion', 'CTO por ajustes'],
  },
  {
    id: 'backup',
    title: 'Backup y restauracion',
    status: 'revisar',
    simpleGoal: 'Que la app pueda guardar y recuperar informacion sin depender del deploy.',
    whatWasMissing: 'Habia rutas nuevas de control final apuntando a /configuracion, pero el modulo real vive en /settings.',
    visibleRoute: '/settings/backup-final',
    owner: 'Operacion AK',
    checks: ['Descargar ZIP', 'Crear punto manual', 'Ver puntos automaticos', 'Restaurar con confirmacion'],
  },
  {
    id: 'club_uruguay',
    title: 'Club Uruguay publico y salones',
    status: 'revisar',
    simpleGoal: 'Mostrar Club Uruguay como producto vendible y mantenerlo sincronizado con salones.',
    whatWasMissing: 'La pagina publica existia, pero faltaba terminar rutas, carga de video, recorrido y modelo 3D.',
    visibleRoute: '/club-uruguay',
    owner: 'Comercial AK',
    checks: ['Pagina publica', 'Galeria desde salones', 'Editor visual de salones', 'Diseno 2D/3D por salon'],
  },
  {
    id: 'social_fiesta',
    title: 'Social Fiesta y muro en vivo',
    status: 'revisar',
    simpleGoal: 'Que lo que ven invitados y pantalla gigante salga del motor real, no de promesas internas.',
    whatWasMissing: 'Varias PR dejaron motores de juegos, moderacion y reportes, pero faltaba una entrada clara de revision.',
    visibleRoute: '/fiestas/nueva/social-fiesta-pro',
    owner: 'Operador de fiesta',
    checks: ['Muro social', 'Pantalla gigante', 'Moderacion', 'Juegos y sorteos', 'Reporte post-fiesta'],
  },
  {
    id: 'cliente',
    title: 'Portal cliente',
    status: 'revisar',
    simpleGoal: 'Que el cliente use todo desde celular, con secciones claras y un solo canal de contacto.',
    whatWasMissing: 'El portal mejoro, pero hacia falta una vista de cierre para revisar portada, pagos, invitados y contacto.',
    visibleRoute: '/fiestas/nueva/portal-cliente/cierre-final',
    owner: 'Secretaria AK',
    checks: ['Portada', 'Organizacion', 'Pagos y contrato', 'Invitados', 'Contacto unico'],
  },
  {
    id: 'google_workspace',
    title: 'Google Calendar y Gmail',
    status: 'revisar',
    simpleGoal: 'Que fechas, personal y avisos salgan de la app hacia el calendario y el mail real.',
    whatWasMissing: 'La base estaba creada, pero hay que confirmar configuracion OAuth y emails de empleados/clientes.',
    visibleRoute: '/settings/google-workspace',
    owner: 'Administracion AK',
    checks: ['Cuenta AK conectada', 'Empleados con email', 'Calendario general', 'Mails al personal'],
  },
  {
    id: 'comercial_360',
    title: 'Comercial 360',
    status: 'revisar',
    simpleGoal: 'Que simulador, presupuesto, CRM y Portal LED ayuden a vender mejor.',
    whatWasMissing: 'Los motores comerciales existen, pero deben revisarse desde una pantalla unica antes de lanzar.',
    visibleRoute: '/contabilidad/comercial-360',
    owner: 'Ventas AK',
    checks: ['Simulador', 'Presupuesto vivo', 'Seguimiento WhatsApp', 'Galeria comercial', 'Portal LED'],
  },
];

export function getLaunchReadinessScore(areas: LaunchReadinessArea[] = CTO_LAUNCH_READINESS_AREAS): number {
  if (areas.length === 0) return 0;
  const points = areas.reduce((sum, area) => {
    if (area.status === 'listo') return sum + 1;
    if (area.status === 'revisar') return sum + 0.6;
    return sum;
  }, 0);
  return Math.round((points / areas.length) * 100);
}

export function getCriticalLaunchAreas(areas: LaunchReadinessArea[] = CTO_LAUNCH_READINESS_AREAS): LaunchReadinessArea[] {
  return areas.filter((area) => area.status === 'critico');
}
