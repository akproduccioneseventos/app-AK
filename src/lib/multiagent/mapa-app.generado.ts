// ARCHIVO GENERADO. No lo edites a mano.
// Se arma con: npm run mapa:generar
// El control src/__tests__/mapa-de-la-app-al-dia.test.ts lo vuelve a armar y
// compara. Si agregaste una pantalla y no regeneraste, se pone en rojo.

export type FamiliaDePantalla =
  | 'staff'
  | 'portal-cliente'
  | 'invitado'
  | 'publica'
  | 'acceso-externo';

export type EntradaDeMenu = { etiqueta: string; ruta: string };

/** Las opciones del menu del panel, tal como las ve el equipo. */
export const MENU_DEL_STAFF: EntradaDeMenu[] = [
  {
    "etiqueta": "Mi Día",
    "ruta": "/mi-dia"
  },
  {
    "etiqueta": "Eventos Activos",
    "ruta": "/eventos"
  },
  {
    "etiqueta": "Calendario",
    "ruta": "/calendario"
  },
  {
    "etiqueta": "Muro Social",
    "ruta": "/empresa/presencia-digital?tab=social-eventos"
  },
  {
    "etiqueta": "Incidentes",
    "ruta": "/incidentes"
  },
  {
    "etiqueta": "Guias de Armado",
    "ruta": "/playbooks"
  },
  {
    "etiqueta": "Alergias y Dietas",
    "ruta": "/fiestas/nueva/datos?tab=alergias"
  },
  {
    "etiqueta": "Portal de Proveedores",
    "ruta": "/fiestas/nueva/operacion?tab=proveedores-portal"
  },
  {
    "etiqueta": "Personal en dos fiestas",
    "ruta": "/recursos-multi-evento"
  },
  {
    "etiqueta": "Edición de Videos",
    "ruta": "/fiestas/nueva/show?tab=fotografia&subtab=edicion-videos"
  },
  {
    "etiqueta": "Prospectos",
    "ruta": "/contabilidad/crm"
  },
  {
    "etiqueta": "Presupuestos",
    "ruta": "/presupuestos/nuevo"
  },
  {
    "etiqueta": "Clientes",
    "ruta": "/customers"
  },
  {
    "etiqueta": "Simulador IA",
    "ruta": "/simulador-de-presupuesto"
  },
  {
    "etiqueta": "Pagos Rápidos",
    "ruta": "/pagos-rapidos"
  },
  {
    "etiqueta": "Panel Contable",
    "ruta": "/empresa/contabilidad"
  },
  {
    "etiqueta": "Facturas",
    "ruta": "/invoices"
  },
  {
    "etiqueta": "Cambios a Aprobar",
    "ruta": "/aprobaciones"
  },
  {
    "etiqueta": "Ganancias y Reportes",
    "ruta": "/empresa/contabilidad/reportes"
  },
  {
    "etiqueta": "Comida / Menús",
    "ruta": "/empresa/menus"
  },
  {
    "etiqueta": "Insumos y Compras",
    "ruta": "/empresa/insumos"
  },
  {
    "etiqueta": "Salones",
    "ruta": "/empresa/salones"
  },
  {
    "etiqueta": "Catálogo de Servicios",
    "ruta": "/empresa/servicios"
  },
  {
    "etiqueta": "Proveedores",
    "ruta": "/proveedores"
  },
  {
    "etiqueta": "Empleados",
    "ruta": "/empleados"
  },
  {
    "etiqueta": "Marketing y Redes",
    "ruta": "/empresa/presencia-digital"
  },
  {
    "etiqueta": "WhatsApp del Día",
    "ruta": "/contabilidad/crm/outbox"
  },
  {
    "etiqueta": "Presentación LED",
    "ruta": "/empresa/presentacion-led/configuracion"
  },
  {
    "etiqueta": "Ajustes Generales",
    "ruta": "/settings"
  },
  {
    "etiqueta": "Tareas Automáticas",
    "ruta": "/settings?seccion=asistente&sub=tareas-automaticas"
  },
  {
    "etiqueta": "Conexiones",
    "ruta": "/settings?seccion=conexiones&sub=sincronizaciones"
  },
  {
    "etiqueta": "WhatsApp",
    "ruta": "/settings?seccion=conexiones&sub=whatsapp"
  },
  {
    "etiqueta": "Cláusulas de Contrato",
    "ruta": "/settings?seccion=contratos&sub=contratos--clausulas"
  },
  {
    "etiqueta": "Seguridad",
    "ruta": "/settings?seccion=empresa&sub=account"
  },
  {
    "etiqueta": "Promociones",
    "ruta": "/settings?seccion=ventas&sub=promos"
  },
  {
    "etiqueta": "Asistente IA",
    "ruta": "/asistente"
  },
  {
    "etiqueta": "Laboratorio Experimental",
    "ruta": "/settings?seccion=sistema&sub=feature-flags"
  },
  {
    "etiqueta": "Alertas",
    "ruta": "/mi-dia?tab=alertas"
  },
  {
    "etiqueta": "Gastos",
    "ruta": "/empresa/contabilidad/gastos"
  }
];

/** Todas las pantallas de la app, por familia. Los :id son partes variables. */
export const PANTALLAS_POR_FAMILIA: Record<FamiliaDePantalla, string[]> = {
  "publica": [
    "/",
    "/bodas",
    "/club-uruguay",
    "/cumpleanos",
    "/experiencia-ak",
    "/landing/:slug",
    "/landing/eventos",
    "/login",
    "/public/:eventType",
    "/public/blog",
    "/public/blog/:slug",
    "/quinceaneras",
    "/signup",
    "/simulador-de-presupuesto"
  ],
  "acceso-externo": [
    "/acceso-personal/:tokenId",
    "/personal/:empleadoId",
    "/proveedor/acceso/:token"
  ],
  "staff": [
    "/admin/usuarios",
    "/aprobaciones",
    "/asistente",
    "/auditoria",
    "/buscar",
    "/calendario",
    "/contabilidad/crm",
    "/contabilidad/crm/outbox",
    "/contabilidad/fiestas-historicas",
    "/customers",
    "/customers/:id",
    "/customers/:id/edit",
    "/customers/new",
    "/empleados",
    "/empleados/:id/editar",
    "/empleados/:id/historial",
    "/empleados/nuevo",
    "/empresa/activos-fijos",
    "/empresa/activos-fijos/:id/editar",
    "/empresa/activos-fijos/nuevo",
    "/empresa/contabilidad",
    "/empresa/contabilidad/flujo-caja",
    "/empresa/contabilidad/gastos",
    "/empresa/contabilidad/poner-al-dia",
    "/empresa/contabilidad/reportes",
    "/empresa/galeria",
    "/empresa/insumos",
    "/empresa/insumos/:id/editar",
    "/empresa/insumos/nuevo",
    "/empresa/landing-editor",
    "/empresa/menus",
    "/empresa/menus/:menuId/editar",
    "/empresa/menus/nuevo",
    "/empresa/presencia-digital",
    "/empresa/presentacion-led/configuracion",
    "/empresa/salones",
    "/empresa/salones/:id/croquis",
    "/empresa/salones/:id/diseno",
    "/empresa/servicios",
    "/empresa/servicios/editar/:id",
    "/empresa/servicios/nuevo",
    "/enlaces",
    "/entrar",
    "/eventos",
    "/experiencia",
    "/fiestas",
    "/fiestas-empresariales",
    "/fiestas-infantiles",
    "/fiestas/:id/centro",
    "/fiestas/nueva",
    "/fiestas/nueva/comida",
    "/fiestas/nueva/datos",
    "/fiestas/nueva/operacion",
    "/fiestas/nueva/plata-y-papeles",
    "/fiestas/nueva/show",
    "/incidentes",
    "/invoices",
    "/invoices/:id",
    "/invoices/:id/edit",
    "/invoices/new",
    "/mantenimiento",
    "/mi-dia",
    "/pago/mercadopago",
    "/pagos-rapidos",
    "/perfil",
    "/playbooks",
    "/portal",
    "/portal/:fiestaId/:module",
    "/portal/:fiestaId/contrato",
    "/portal/:fiestaId/decoracion",
    "/portal/:fiestaId/moodboard",
    "/portal/c/:accessKey",
    "/portal/mesas",
    "/presentacion-led",
    "/presupuestos/:id/edit",
    "/presupuestos/:id/estado-de-cuenta",
    "/presupuestos/:id/recibo-contrato",
    "/presupuestos/:id/ver",
    "/presupuestos/nuevo",
    "/presupuestos/nuevo/crear",
    "/privacidad",
    "/proveedores",
    "/proveedores/:id/edit",
    "/proveedores/new",
    "/recepcion/:fiestaId",
    "/recursos-multi-evento",
    "/settings",
    "/simulador-ak"
  ],
  "invitado": [
    "/evento/:id/video-recuerdo",
    "/evento/accesos/:fiestaId",
    "/evento/actual/checkin",
    "/evento/actual/mesa",
    "/evento/album/:fiestaId",
    "/evento/ar/:fiestaId",
    "/evento/barra/:fiestaId",
    "/evento/barra/:fiestaId/barman",
    "/evento/barra/:fiestaId/listo",
    "/evento/barra/:fiestaId/stats",
    "/evento/bienvenida/:fiestaId",
    "/evento/bogue/:fiestaId",
    "/evento/buzon/:fiestaId",
    "/evento/control-pantalla/:fiestaId",
    "/evento/dj/:fiestaId",
    "/evento/en-vivo/:fiestaId",
    "/evento/en-vivo/:fiestaId/invitados",
    "/evento/en-vivo/:fiestaId/organizador",
    "/evento/en-vivo/:fiestaId/pantalla",
    "/evento/espejo-magico/:fiestaId",
    "/evento/fotocabina/:fiestaId",
    "/evento/galeria/:fiestaId",
    "/evento/hub/:fiestaId",
    "/evento/impresion/:fiestaId",
    "/evento/inicio",
    "/evento/logistica/:fiestaId",
    "/evento/mi-mesa/:fiestaId",
    "/evento/moderacion/:fiestaId",
    "/evento/muro-en-vivo/:fiestaId",
    "/evento/muro-en-vivo/:fiestaId/afiche",
    "/evento/plataforma-360/:fiestaId",
    "/evento/social/:fiestaId",
    "/evento/staff/:fiestaId/cronograma",
    "/evento/totem/:fiestaId/:totemId",
    "/evento/touchpix/:fiestaId",
    "/evento/video-vida/:fiestaId",
    "/evento/zona-digital/:fiestaId",
    "/feedback/:fiestaId",
    "/i/:slug",
    "/invitacion/:fiestaId",
    "/invitacion/:fiestaId/invitado/:guestId",
    "/invitacion/:fiestaId/recap",
    "/invitacion/:fiestaId/rsvp",
    "/portal-invitado/:fiestaId/:guestId",
    "/post-fiesta/:fiestaId",
    "/q/:fiestaId",
    "/video-vida",
    "/video-vida/:fiestaId"
  ],
  "portal-cliente": [
    "/portal-cliente",
    "/portal-cliente/:id"
  ]
};

/** Todas las pantallas, planas. */
export const TODAS_LAS_PANTALLAS: string[] = Object.values(PANTALLAS_POR_FAMILIA).flat();

export const CUANTAS_PANTALLAS = TODAS_LAS_PANTALLAS.length;

/** Una ruta sirve para navegar si existe como pantalla de la app. */
export function esPantallaReal(ruta: string): boolean {
  const sinQuery = ruta.split('?')[0].split('#')[0] || '/';
  if (TODAS_LAS_PANTALLAS.includes(sinQuery)) return true;
  const partes = sinQuery.split('/').filter(Boolean);
  return TODAS_LAS_PANTALLAS.some(p => {
    const suyas = p.split('/').filter(Boolean);
    if (suyas.length !== partes.length) return false;
    return suyas.every((s, i) => s.startsWith(':') || s === partes[i]);
  });
}

/**
 * Texto compacto para meterle a la asistente en el contexto: el menu con sus
 * etiquetas. Es lo que le permite decir "anda a Lista de Compras" y llevar.
 */
export function mapaParaLaAsistente(): string {
  const lineas = MENU_DEL_STAFF.map(e => `• ${e.etiqueta} → ${e.ruta}`);
  return [
    `MAPA DEL PANEL (${MENU_DEL_STAFF.length} opciones de menu, ${CUANTAS_PANTALLAS} pantallas en total):`,
    ...lineas,
  ].join('\n');
}
