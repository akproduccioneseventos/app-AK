import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';

export type CasaId =
  | 'inicio'
  | 'fiestas'
  | 'vender'
  | 'plata'
  | 'marketing'
  | 'recursos'
  | 'ajustes';

export interface PestanaCasa {
  titulo: string;
  ruta: string;
  permiso?: Permiso | Permiso[] | string | string[];
  palabras: string[];
}

export interface Casa {
  id: CasaId;
  titulo: string;
  icono: string;
  inicio: string;
  permiso?: Permiso | Permiso[] | string | string[];
  pestanas: PestanaCasa[];
}

/**
 * El mapa oficial de las 7 casas de la aplicación (Orden 284).
 * Todo componente de navegación (menú lateral, barra móvil, buscador, pestañas)
 * lee exclusivamente de esta única fuente de verdad.
 */
export const CASAS: Casa[] = [
  {
    id: 'inicio',
    titulo: 'Inicio',
    icono: 'SunMedium',
    inicio: '/mi-dia',
    pestanas: [
      {
        titulo: 'Hoy',
        ruta: '/mi-dia',
        palabras: ['hoy', 'mi dia', 'inicio', 'tareas', 'turnos', 'resumen'],
      },
      {
        titulo: 'Alertas',
        ruta: '/alertas',
        palabras: ['alertas', 'avisos', 'urgente', 'notificaciones'],
      },
      {
        titulo: 'Para aprobar',
        ruta: '/aprobaciones',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['aprobar', 'aprobaciones', 'cambios', 'pendientes', 'solicitudes'],
      },
      {
        titulo: 'Asistente',
        ruta: '/asistente',
        palabras: ['asistente', 'ia', 'sofia', 'ayuda', 'multiagente', 'chat'],
      },
    ],
  },
  {
    id: 'fiestas',
    titulo: 'Fiestas',
    icono: 'PartyPopper',
    inicio: '/eventos',
    pestanas: [
      {
        titulo: 'Fiestas',
        ruta: '/eventos',
        palabras: ['fiestas', 'eventos', 'cumpleaños', 'bodas', 'quince', 'activas'],
      },
      {
        titulo: 'Calendario',
        ruta: '/calendario',
        palabras: ['calendario', 'fechas', 'agenda', 'mes', 'cronograma'],
      },
      {
        titulo: 'Incidentes',
        ruta: '/incidentes',
        palabras: ['incidentes', 'problemas', 'guardia', 'urgencias', 'reportes'],
      },
      {
        titulo: 'Guías de armado',
        ruta: '/playbooks',
        palabras: ['guias', 'playbooks', 'armado', 'montaje', 'manual', 'procedimientos'],
      },
      {
        titulo: 'Personal en dos fiestas',
        ruta: '/recursos-multi-evento',
        permiso: PERMISOS.ORGANIZACION,
        palabras: ['personal', 'dos fiestas', 'multi evento', 'recursos', 'solapamiento', 'doble'],
      },
    ],
  },
  {
    id: 'vender',
    titulo: 'Vender',
    icono: 'KanbanSquare',
    inicio: '/contabilidad/crm',
    permiso: PERMISOS.CRM,
    pestanas: [
      {
        titulo: 'Prospectos',
        ruta: '/contabilidad/crm',
        permiso: PERMISOS.CRM,
        palabras: ['prospectos', 'leads', 'crm', 'ventas', 'seguimiento', 'pipeline'],
      },
      {
        titulo: 'Presupuestos',
        ruta: '/presupuestos/nuevo',
        permiso: PERMISOS.CRM,
        palabras: ['presupuestos', 'cotizaciones', 'nuevo presupuesto', 'precios', 'propuestas'],
      },
      {
        titulo: 'Clientes',
        ruta: '/customers',
        permiso: PERMISOS.CRM,
        palabras: ['clientes', 'directorio', 'contactos', 'empresas', 'fichas'],
      },
      {
        titulo: 'Agenda',
        ruta: '/contabilidad/crm/agenda',
        permiso: PERMISOS.CRM,
        palabras: ['agenda', 'llamadas', 'reuniones', 'visitas', 'citas'],
      },
      {
        titulo: 'WhatsApp del día',
        ruta: '/contabilidad/crm/outbox',
        permiso: PERMISOS.CRM,
        palabras: ['whatsapp', 'outbox', 'mensajes', 'comercial', 'envios', 'dia'],
      },
      {
        titulo: 'Simulador',
        ruta: '/simulador-ak',
        permiso: PERMISOS.CRM,
        palabras: ['simulador', 'ia cotizador', 'presupuesto automatico', 'estimacion'],
      },
    ],
  },
  {
    id: 'plata',
    titulo: 'Plata',
    icono: 'Wallet',
    inicio: '/pagos-rapidos',
    permiso: PERMISOS.CONTABILIDAD,
    pestanas: [
      {
        titulo: 'Cobrar',
        ruta: '/pagos-rapidos',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['cobrar', 'pagos rapidos', 'recibos', 'señas', 'cuotas', 'ingresos'],
      },
      {
        titulo: 'Cuentas',
        ruta: '/empresa/contabilidad',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['cuentas', 'contabilidad', 'balance', 'movimientos', 'panel contable'],
      },
      {
        titulo: 'Facturas',
        ruta: '/invoices',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['facturas', 'facturacion', 'dgi', 'comprobantes', 'boletas'],
      },
      {
        titulo: 'Gastos',
        ruta: '/empresa/contabilidad/gastos',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['gastos', 'egresos', 'compras', 'facturas proveedor', 'costos'],
      },
      {
        titulo: 'Flujo de caja',
        ruta: '/empresa/contabilidad/flujo-caja',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['flujo de caja', 'cashflow', 'proyeccion', 'liquidez', 'banco'],
      },
      {
        titulo: 'Ganancias',
        ruta: '/empresa/contabilidad/reportes',
        permiso: PERMISOS.GANANCIAS,
        palabras: ['ganancias', 'reportes', 'rentabilidad', 'margen', 'utilidades'],
      },
      {
        titulo: 'Por fiesta',
        ruta: '/comparativa-ganancias',
        permiso: PERMISOS.GANANCIAS,
        palabras: ['por fiesta', 'comparativa', 'rentabilidad evento', 'margen evento'],
      },
      {
        titulo: 'Métricas',
        ruta: '/empresa/dashboard',
        permiso: PERMISOS.GANANCIAS,
        palabras: ['metricas', 'dashboard', 'graficas', 'kpis', 'numeros'],
      },
    ],
  },
  {
    id: 'marketing',
    titulo: 'Marketing',
    icono: 'Target',
    inicio: '/marketing',
    permiso: PERMISOS.CRM,
    pestanas: [
      {
        titulo: 'Resumen',
        ruta: '/marketing',
        permiso: PERMISOS.CRM,
        palabras: ['resumen', 'marketing', 'campañas', 'estrategia', 'difusion'],
      },
      {
        titulo: 'Comentarios y mensajes',
        ruta: '/empresa/presencia-digital',
        permiso: PERMISOS.CRM,
        palabras: ['comentarios', 'mensajes', 'bandeja', 'redes', 'respuestas', 'meta', 'instagram', 'facebook'],
      },
      {
        titulo: 'Publicaciones',
        ruta: '/empresa/redes-sociales',
        permiso: PERMISOS.CRM,
        palabras: ['publicaciones', 'posts', 'instagram', 'facebook', 'tiktok', 'planificador'],
      },
      {
        titulo: 'Reseñas',
        ruta: '/empresa/resenas-google',
        permiso: PERMISOS.CRM,
        palabras: ['reseñas', 'opiniones', 'google maps', 'calificaciones', 'estrellas'],
      },
      {
        titulo: 'Anuncios',
        ruta: '/contabilidad/crm/marketing-ads',
        permiso: PERMISOS.CRM,
        palabras: ['anuncios', 'ads', 'meta ads', 'campañas', 'inversion', 'roi'],
      },
      {
        titulo: 'Presencia en Google',
        ruta: '/empresa/presencia-digital',
        permiso: PERMISOS.CRM,
        palabras: ['presencia en google', 'google', 'ficha', 'perfil', 'seo', 'posicionamiento'],
      },
      {
        titulo: 'Galería',
        ruta: '/empresa/galeria',
        permiso: PERMISOS.CRM,
        palabras: ['galeria', 'fotos', 'catalogo web', 'imagenes', 'trabajos'],
      },
      {
        titulo: 'Portada',
        ruta: '/empresa/landing-editor',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['portada', 'landing', 'web publica', 'editor', 'sitio web'],
      },
      {
        titulo: 'Muro general',
        ruta: '/empresa/red-social-eventos',
        palabras: ['muro general', 'muro social', 'fotos', 'invitados', 'comunidad'],
      },
    ],
  },
  {
    id: 'recursos',
    titulo: 'Recursos',
    icono: 'Building2',
    inicio: '/empresa',
    permiso: PERMISOS.INSUMOS,
    pestanas: [
      {
        titulo: 'Comida',
        ruta: '/empresa/menus',
        permiso: PERMISOS.INSUMOS,
        palabras: ['comida', 'menus', 'catering', 'platos', 'gastronomia', 'recetas'],
      },
      {
        titulo: 'Tragos',
        ruta: '/empresa/menus/tragos',
        permiso: PERMISOS.INSUMOS,
        palabras: ['tragos', 'barra', 'cocteleria', 'bebidas', 'carta de tragos'],
      },
      {
        titulo: 'Compras',
        ruta: '/compras',
        permiso: PERMISOS.INSUMOS,
        palabras: ['compras', 'insumos', 'stock', 'pedidos', 'supermercado'],
      },
      {
        titulo: 'Insumos',
        ruta: '/empresa/insumos',
        permiso: PERMISOS.INSUMOS,
        palabras: ['insumos', 'almacen', 'inventario', 'materia prima'],
      },
      {
        titulo: 'Salones',
        ruta: '/empresa/salones',
        palabras: ['salones', 'locaciones', 'lugares', 'club uruguay', 'espacios'],
      },
      {
        titulo: 'Servicios',
        ruta: '/empresa/servicios',
        palabras: ['servicios', 'catalogo', 'paquetes', 'prestaciones'],
      },
      {
        titulo: 'Proveedores',
        ruta: '/proveedores',
        permiso: PERMISOS.INSUMOS,
        palabras: ['proveedores', 'tercerizados', 'contactos', 'empresas'],
      },
      {
        titulo: 'Personal',
        ruta: '/empleados',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['personal', 'empleados', 'nomina', 'staff', 'sueldos'],
      },
      {
        titulo: 'Equipos',
        ruta: '/empresa/activos-fijos',
        palabras: ['equipos', 'activos fijos', 'luces', 'sonido', 'mobiliario', 'tecnica'],
      },
    ],
  },
  {
    id: 'ajustes',
    titulo: 'Ajustes',
    icono: 'Settings',
    inicio: '/settings',
    permiso: PERMISOS.ADMINISTRACION,
    pestanas: [
      {
        titulo: 'Ajustes',
        ruta: '/settings',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['ajustes', 'configuracion', 'parametros', 'general', 'opciones'],
      },
      {
        titulo: 'Usuarios',
        ruta: '/admin/usuarios',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['usuarios', 'perfiles', 'roles', 'permisos', 'accesos', 'cuentas'],
      },
    ],
  },
];

/**
 * Pantallas repetidas que dejan de enlazarse en menús, barras y centros.
 * Su dirección continúa funcionando (no se borran ni se renombran).
 */
export const NO_SE_ENLAZAN: { ruta: string; motivo: string; quedaEn: string }[] = [
  { ruta: '/admin', motivo: 'Panel de inicio repetido', quedaEn: '/mi-dia' },
  { ruta: '/centro-de-control', motivo: 'Panel de inicio repetido', quedaEn: '/mi-dia' },
  { ruta: '/control-tower', motivo: 'Panel de inicio repetido', quedaEn: '/mi-dia' },
  { ruta: '/secretaria-ak', motivo: 'Panel de inicio repetido', quedaEn: '/mi-dia' },
  { ruta: '/repaso-diario', motivo: 'Panel de inicio repetido', quedaEn: '/mi-dia' },
  { ruta: '/control-tower/comercial', motivo: 'Vista comercial repetida', quedaEn: '/contabilidad/crm' },
  { ruta: '/control-tower/preparacion', motivo: 'Preparación previa repetida', quedaEn: '/eventos' },
  { ruta: '/control-tower/post-fiesta', motivo: 'Post fiesta repetida', quedaEn: '/eventos' },
  { ruta: '/control-tower/automatizaciones', motivo: 'Automatizaciones repetida', quedaEn: '/settings' },
  { ruta: '/admin/ventas', motivo: 'Ventas repetida', quedaEn: '/contabilidad/crm' },
  { ruta: '/contabilidad/comercial-360', motivo: 'Comercial 360 repetida', quedaEn: '/contabilidad/crm' },
  { ruta: '/contabilidad/crm/ciclo-comercial', motivo: 'Ciclo comercial repetido', quedaEn: '/contabilidad/crm' },
  { ruta: '/contabilidad/crm/atraccion-fiestas', motivo: 'Atracción fiestas repetida', quedaEn: '/contabilidad/crm' },
  { ruta: '/analytics', motivo: 'Métricas repetida', quedaEn: '/empresa/dashboard' },
  { ruta: '/admin/finanzas', motivo: 'Finanzas repetida', quedaEn: '/empresa/dashboard' },
  { ruta: '/contabilidad/fiestas-historicas', motivo: 'Histórico contable repetido', quedaEn: '/empresa/dashboard' },
  { ruta: '/empresa/marketing', motivo: 'Hub de marketing repetido', quedaEn: '/marketing' },
  { ruta: '/multiagente', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/multiagente/acciones', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/multiagente/contable', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/multiagente/equipo', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/multiagente/fiestas', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/multiagente/memoria', motivo: 'Asistente repetido', quedaEn: '/asistente' },
  { ruta: '/admin/asistente-ak', motivo: 'Asistente repetido', quedaEn: '/asistente' },
];
