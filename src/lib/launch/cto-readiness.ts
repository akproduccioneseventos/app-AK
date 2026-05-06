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
    id: 'visual_release',
    title: 'Estetica, movimiento y experiencia visible',
    status: 'listo',
    simpleGoal: 'Que la app use blanco y rojo como marca, pero sin fondos rojos pesados, con movimiento fino y pantallas mas atractivas.',
    whatWasMissing: 'Habia mejoras visuales, pero algunas pantallas podian sentirse demasiado rojas o planas.',
    visibleRoute: '/',
    owner: 'CTO AK',
    checks: ['Fondo claro como base', 'Rojo como acento', 'Movimiento suave', 'Cliente/invitado/social con capa visual final', 'Pantallas en vivo oscuras elegantes, no rojas'],
  },
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
    status: 'listo',
    simpleGoal: 'Que la app tenga entrada clara al control final de guardado y restauracion.',
    whatWasMissing: 'Habia rutas nuevas de control final apuntando a /configuracion, pero el modulo real vive en /settings.',
    visibleRoute: '/settings/backup-final',
    owner: 'Operacion AK',
    checks: ['Descargar ZIP', 'Crear punto manual', 'Ver puntos automaticos', 'Restaurar con confirmacion'],
  },
  {
    id: 'club_uruguay',
    title: 'Club Uruguay publico y salones',
    status: 'listo',
    simpleGoal: 'Mostrar Club Uruguay como producto vendible y mantenerlo sincronizado con salones.',
    whatWasMissing: 'La pagina publica existia, pero faltaba terminar rutas, carga de video, recorrido y modelo 3D.',
    visibleRoute: '/club-uruguay',
    owner: 'Comercial AK',
    checks: ['Pagina publica', 'Galeria desde salones', 'Editor visual de salones', 'Diseno 2D/3D por salon'],
  },
  {
    id: 'social_fiesta',
    title: 'Social Fiesta, red privada y muro en vivo',
    status: 'listo',
    simpleGoal: 'Que lo que ven invitados y pantalla gigante salga del motor real, con una experiencia atractiva y controlada.',
    whatWasMissing: 'Varias PR dejaron motores de juegos, moderacion y reportes, pero faltaba una capa final de presentacion y entrada clara.',
    visibleRoute: '/fiestas/nueva/social-fiesta-pro',
    owner: 'Operador de fiesta',
    checks: ['Muro social', 'Pantalla gigante', 'Red social privada', 'Moderacion', 'Juegos y sorteos', 'Reporte post-fiesta'],
  },
  {
    id: 'cliente',
    title: 'Portal cliente',
    status: 'listo',
    simpleGoal: 'Que el cliente use todo desde celular, con secciones claras, movimiento suave y un solo canal de contacto.',
    whatWasMissing: 'El portal mejoro, pero hacia falta una vista de cierre y una capa visual final para que no se sienta pesado.',
    visibleRoute: '/fiestas/nueva/portal-cliente/cierre-final',
    owner: 'Secretaria AK',
    checks: ['Portada', 'Organizacion', 'Pagos y contrato', 'Invitados', 'Contacto unico', 'Capa visual final'],
  },
  {
    id: 'invitados',
    title: 'Invitado e invitacion web',
    status: 'listo',
    simpleGoal: 'Que el invitado pueda entrar desde el celular, confirmar, ver datos y participar sin confundirse.',
    whatWasMissing: 'La invitacion y el portal existian, pero faltaba tratarlos como experiencia principal visible para gente no tecnica.',
    visibleRoute: '/fiestas/nueva/pagina-web',
    owner: 'Secretaria AK',
    checks: ['Invitacion web', 'RSVP', 'Portal invitado', 'Accesos desde celular', 'Movimiento y estetica personalizada'],
  },
  {
    id: 'google_workspace',
    title: 'Google Calendar y Gmail',
    status: 'listo',
    simpleGoal: 'Que fechas, personal, reuniones, clientes, invitados, pagos y contratos tengan flujo preparado hacia calendario y mail.',
    whatWasMissing: 'La base estaba creada, pero faltaban flujos mas amplios para reuniones, pagos, contratos, clientes e invitados.',
    visibleRoute: '/settings/google-workspace',
    owner: 'Administracion AK',
    checks: ['Cuenta AK conectable', 'Empleados con email', 'Calendario general', 'Reuniones', 'Mails al personal', 'Mails a clientes e invitados'],
  },
  {
    id: 'comercial_360',
    title: 'Comercial 360 y simuladores',
    status: 'listo',
    simpleGoal: 'Que simulador, presupuesto, CRM y Portal LED ayuden a vender mejor y se vean mas modernos.',
    whatWasMissing: 'Los motores comerciales existen, pero debian quedar revisables y con una presentacion menos interna.',
    visibleRoute: '/contabilidad/comercial-360',
    owner: 'Ventas AK',
    checks: ['Simulador', 'Presupuesto vivo', 'Seguimiento WhatsApp', 'Galeria comercial', 'Portal LED', 'Presentacion visual'],
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
