import { PERMISOS, type Permiso } from '@/lib/auth/perfiles';

export type CasaId =
  | 'inicio'
  | 'vender'
  | 'fiestas'
  | 'plata'
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
 * El mapa oficial de las 6 áreas de la aplicación (Orden 321).
 * Todo componente de navegación (menú lateral, barra móvil, buscador, pestañas)
 * lee exclusivamente de esta única fuente de verdad.
 */
export const CASAS: Casa[] = [
  {
    id: 'inicio',
    titulo: 'Hoy',
    icono: 'SunMedium',
    inicio: '/mi-dia',
    pestanas: [
      {
        titulo: 'Mi día',
        ruta: '/mi-dia',
        palabras: ['hoy', 'mi dia', 'inicio', 'tareas', 'turnos', 'resumen'],
      },
      {
        titulo: 'Alertas',
        ruta: '/mi-dia?tab=alertas',
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
    id: 'vender',
    titulo: 'Ventas y Marketing',
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
        titulo: 'Simulador',
        ruta: '/simulador-ak',
        permiso: PERMISOS.CRM,
        palabras: ['simulador', 'ia cotizador', 'presupuesto automatico', 'estimacion'],
      },
      {
        titulo: 'Clientes',
        ruta: '/customers',
        permiso: PERMISOS.CRM,
        palabras: ['clientes', 'directorio', 'contactos', 'empresas', 'fichas'],
      },
      {
        titulo: 'WhatsApp',
        ruta: '/contabilidad/crm/outbox',
        permiso: PERMISOS.CRM,
        palabras: ['whatsapp', 'outbox', 'mensajes', 'conversaciones', 'comercial'],
      },
      {
        titulo: 'Redes y presencia',
        ruta: '/empresa/presencia-digital',
        permiso: PERMISOS.CRM,
        palabras: ['redes', 'presencia digital', 'reseñas', 'anuncios', 'marketing', 'instagram'],
      },
      {
        titulo: 'Galería',
        ruta: '/empresa/galeria',
        permiso: PERMISOS.CRM,
        palabras: ['galeria', 'fotos', 'catalogo web', 'imagenes', 'trabajos'],
      },
      {
        titulo: 'Portada web',
        ruta: '/empresa/landing-editor',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['portada', 'landing', 'web publica', 'editor', 'sitio web'],
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
        palabras: ['ganancias', 'reportes', 'rentabilidad', 'margen', 'utilidades', 'por fiesta'],
      },
      {
        titulo: 'Poner al día',
        ruta: '/empresa/contabilidad/poner-al-dia',
        permiso: PERMISOS.CONTABILIDAD,
        palabras: ['poner al dia', 'conciliacion', 'pendientes', 'revision'],
      },
    ],
  },
  {
    id: 'recursos',
    titulo: 'Empresa y Personal',
    icono: 'Building2',
    inicio: '/empleados',
    permiso: PERMISOS.INSUMOS,
    pestanas: [
      {
        titulo: 'Personal',
        ruta: '/empleados',
        permiso: PERMISOS.ADMINISTRACION,
        palabras: ['personal', 'empleados', 'nomina', 'staff', 'sueldos'],
      },
      {
        titulo: 'Comida',
        ruta: '/empresa/menus',
        permiso: PERMISOS.INSUMOS,
        palabras: ['comida', 'menus', 'tragos', 'catering', 'platos', 'gastronomia'],
      },
      {
        titulo: 'Insumos y compras',
        ruta: '/empresa/insumos',
        permiso: PERMISOS.INSUMOS,
        palabras: ['insumos', 'compras', 'almacen', 'inventario', 'stock'],
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
        palabras: ['ajustes', 'configuracion', 'parametros', 'general', 'opciones', 'backup', 'whatsapp'],
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
