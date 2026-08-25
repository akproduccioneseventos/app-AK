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
    "ruta": "/empresa/red-social-eventos"
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
    "ruta": "/fiestas/nueva/alergias"
  },
  {
    "etiqueta": "Portal de Proveedores",
    "ruta": "/fiestas/nueva/proveedores-portal"
  },
  {
    "etiqueta": "Personal en dos fiestas",
    "ruta": "/recursos-multi-evento"
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
    "ruta": "/simulador-ak"
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
    "etiqueta": "Métricas del Negocio",
    "ruta": "/empresa/dashboard"
  },
  {
    "etiqueta": "Comida / Menús",
    "ruta": "/empresa/menus"
  },
  {
    "etiqueta": "Lista de Compras",
    "ruta": "/compras"
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
    "etiqueta": "Marketing y Difusión",
    "ruta": "/empresa/marketing"
  },
  {
    "etiqueta": "Redes Sociales",
    "ruta": "/empresa/redes-sociales"
  },
  {
    "etiqueta": "WhatsApp del Día",
    "ruta": "/contabilidad/crm/outbox"
  },
  {
    "etiqueta": "Rendimiento Anuncios",
    "ruta": "/contabilidad/crm/marketing-ads"
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
    "ruta": "/settings/tareas-automaticas"
  },
  {
    "etiqueta": "Conexiones",
    "ruta": "/settings/sincronizaciones"
  },
  {
    "etiqueta": "WhatsApp",
    "ruta": "/settings/whatsapp"
  },
  {
    "etiqueta": "Cláusulas de Contrato",
    "ruta": "/settings/contratos/clausulas"
  },
  {
    "etiqueta": "Seguridad",
    "ruta": "/settings/account"
  },
  {
    "etiqueta": "Promociones",
    "ruta": "/settings/promos"
  },
  {
    "etiqueta": "Asistente IA",
    "ruta": "/settings/ai-assistant"
  },
  {
    "etiqueta": "Mapa Tecnológico",
    "ruta": "/settings/mapa-tecnologico-ak"
  },
  {
    "etiqueta": "Centro de Control",
    "ruta": "/"
  },
  {
    "etiqueta": "Nuevo Lead",
    "ruta": "/admin"
  },
  {
    "etiqueta": "Alertas",
    "ruta": "/alertas"
  }
];

/** Todas las pantallas de la app, por familia. Los :id son partes variables. */
export const PANTALLAS_POR_FAMILIA: Record<FamiliaDePantalla, string[]> = {
  "publica": [
    "/",
    "/bodas",
    "/catalogo",
    "/catalogo/:tipo",
    "/club-uruguay",
    "/cumpleanos",
    "/experiencia-ak",
    "/landing",
    "/landing/:slug",
    "/landing/bodas",
    "/landing/eventos",
    "/landing/xv-anos",
    "/login",
    "/public",
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
    "/proveedor/:id",
    "/proveedor/acceso/:token"
  ],
  "staff": [
    "/admin",
    "/admin/asistente-ak",
    "/admin/carga-historicos",
    "/admin/finanzas",
    "/admin/usuarios",
    "/admin/ventas",
    "/alertas",
    "/analytics",
    "/aprobaciones",
    "/auditoria",
    "/blog",
    "/blog/:slug",
    "/calendario",
    "/comparativa-ganancias",
    "/compras",
    "/configuracion/backup-final",
    "/contabilidad",
    "/contabilidad/comercial-360",
    "/contabilidad/crm",
    "/contabilidad/crm/agenda",
    "/contabilidad/crm/atraccion-fiestas",
    "/contabilidad/crm/ciclo-comercial",
    "/contabilidad/crm/marketing-ads",
    "/contabilidad/crm/outbox",
    "/contabilidad/fiestas-historicas",
    "/control-tower",
    "/control-tower/automatizaciones",
    "/control-tower/comercial",
    "/control-tower/post-fiesta",
    "/control-tower/preparacion",
    "/customers",
    "/customers/:id",
    "/customers/:id/edit",
    "/customers/new",
    "/customers/reporte",
    "/empleados",
    "/empleados/:id/editar",
    "/empleados/:id/historial",
    "/empleados/nuevo",
    "/empleados/reporte",
    "/empleados/roles",
    "/empresa",
    "/empresa/activos-fijos",
    "/empresa/activos-fijos/:id/editar",
    "/empresa/activos-fijos/editar/:id",
    "/empresa/activos-fijos/nuevo",
    "/empresa/activos-fijos/reporte",
    "/empresa/configurador-reunion",
    "/empresa/contabilidad",
    "/empresa/contabilidad/flujo-caja",
    "/empresa/contabilidad/gastos",
    "/empresa/contabilidad/reportes",
    "/empresa/creador-anuncios",
    "/empresa/crm",
    "/empresa/dashboard",
    "/empresa/empleados/reporte",
    "/empresa/galeria",
    "/empresa/insumos",
    "/empresa/insumos/:id/editar",
    "/empresa/insumos/editar/:id",
    "/empresa/insumos/nuevo",
    "/empresa/insumos/reporte",
    "/empresa/landing-editor",
    "/empresa/marketing",
    "/empresa/menus",
    "/empresa/menus/:menuId/editar",
    "/empresa/menus/catalogo",
    "/empresa/menus/nuevo",
    "/empresa/menus/reporte",
    "/empresa/menus/tragos",
    "/empresa/personal/:empleadoId/historial",
    "/empresa/presencia-digital",
    "/empresa/presentacion-led/configuracion",
    "/empresa/red-social-eventos",
    "/empresa/redes-sociales",
    "/empresa/redes-sociales/ia-marketing",
    "/empresa/salones",
    "/empresa/salones/:id/croquis",
    "/empresa/salones/:id/diseno",
    "/empresa/salones/club-uruguay",
    "/empresa/salones/experiencia-visual",
    "/empresa/servicios",
    "/empresa/servicios/:slugs*",
    "/empresa/servicios/editar/:id",
    "/empresa/servicios/nuevo",
    "/empresa/servicios/reporte",
    "/empresa/todos-los-servicios/:id/editar",
    "/eventos",
    "/fiestas/:id/ak-100",
    "/fiestas/:id/centro",
    "/fiestas/:id/centro-de-mando",
    "/fiestas/:id/centro-experiencia",
    "/fiestas/:id/cierre-mundial",
    "/fiestas/:id/comando-total",
    "/fiestas/:id/experiencia-tecnologica-ak",
    "/fiestas/:id/show-control",
    "/fiestas/:id/timeline",
    "/fiestas/nueva",
    "/fiestas/nueva/accesos-personal",
    "/fiestas/nueva/alergias",
    "/fiestas/nueva/asistente",
    "/fiestas/nueva/barra-tecnologica",
    "/fiestas/nueva/buzon",
    "/fiestas/nueva/carga-operativa",
    "/fiestas/nueva/carga-operativa/pdf",
    "/fiestas/nueva/carta-tragos",
    "/fiestas/nueva/carteleria",
    "/fiestas/nueva/catering",
    "/fiestas/nueva/catering/lista-compras",
    "/fiestas/nueva/centro",
    "/fiestas/nueva/centro-total",
    "/fiestas/nueva/configuracion",
    "/fiestas/nueva/decoracion",
    "/fiestas/nueva/decoracion/pdf",
    "/fiestas/nueva/en-vivo",
    "/fiestas/nueva/entretenimiento",
    "/fiestas/nueva/fiesta-lista",
    "/fiestas/nueva/fotografia",
    "/fiestas/nueva/gestion-costos-rentabilidad",
    "/fiestas/nueva/gestion-costos-rentabilidad/reporte",
    "/fiestas/nueva/gestion-documental",
    "/fiestas/nueva/gestion-documental/cambio-fecha",
    "/fiestas/nueva/gestion-documental/cancelacion-contrato",
    "/fiestas/nueva/gestion-documental/cancelacion-parcial",
    "/fiestas/nueva/gestion-documental/contrato-salon",
    "/fiestas/nueva/gestion-documental/contrato-servicio",
    "/fiestas/nueva/gestion-documental/recibo-pago",
    "/fiestas/nueva/invitados",
    "/fiestas/nueva/invitados/checkin-scanner",
    "/fiestas/nueva/invitados/layout",
    "/fiestas/nueva/invitados/numeros-mesa",
    "/fiestas/nueva/itinerario",
    "/fiestas/nueva/itinerario/pdf",
    "/fiestas/nueva/logistica",
    "/fiestas/nueva/menu-mesa",
    "/fiestas/nueva/mission-control",
    "/fiestas/nueva/modulo-invitado",
    "/fiestas/nueva/muro-social",
    "/fiestas/nueva/musica",
    "/fiestas/nueva/musica/pdf",
    "/fiestas/nueva/numeros-mesa",
    "/fiestas/nueva/pagina-web",
    "/fiestas/nueva/pantallas-totem",
    "/fiestas/nueva/personal",
    "/fiestas/nueva/personal/recibos",
    "/fiestas/nueva/plan-pagos",
    "/fiestas/nueva/planner-costo-fiesta",
    "/fiestas/nueva/playlist-pantalla",
    "/fiestas/nueva/portal-cliente",
    "/fiestas/nueva/portal-cliente/cierre-final",
    "/fiestas/nueva/portal-cliente/experiencia-mundial",
    "/fiestas/nueva/post-evento",
    "/fiestas/nueva/proveedores-portal",
    "/fiestas/nueva/readiness",
    "/fiestas/nueva/regalos",
    "/fiestas/nueva/resumen-imprimible",
    "/fiestas/nueva/resumen-planificacion",
    "/fiestas/nueva/reuniones",
    "/fiestas/nueva/reuniones/imprimir",
    "/fiestas/nueva/servicios-contratados",
    "/fiestas/nueva/social-fiesta-pro",
    "/fiestas/nueva/social-fiesta-pro/cierre-final",
    "/fiestas/nueva/tareas",
    "/fiestas/nueva/video-vida",
    "/fiestas/nueva/zona-digital",
    "/galeria-led",
    "/incidentes",
    "/invoices",
    "/invoices/:id",
    "/invoices/:id/edit",
    "/invoices/new",
    "/marketing",
    "/marketing/checklist",
    "/marketing/demo-tecnologia",
    "/marketing/plantillas",
    "/mi-dia",
    "/multiagente",
    "/multiagente/acciones",
    "/multiagente/contable",
    "/multiagente/equipo",
    "/multiagente/fiestas",
    "/multiagente/memoria",
    "/pago/mercadopago",
    "/pagos-rapidos",
    "/perfil",
    "/playbooks",
    "/portal",
    "/portal/:fiestaId/:module",
    "/portal/:fiestaId/contrato",
    "/portal/:fiestaId/moodboard",
    "/portal/c/:accessKey",
    "/portal/mesas",
    "/presentacion",
    "/presentacion-led",
    "/presentacion-led/portafolio",
    "/presentacion-led/portafolio/fiesta/:id",
    "/presupuestos",
    "/presupuestos/:id",
    "/presupuestos/:id/edit",
    "/presupuestos/:id/editar",
    "/presupuestos/:id/estado-de-cuenta",
    "/presupuestos/:id/recibo-contrato",
    "/presupuestos/:id/ver",
    "/presupuestos/importar",
    "/presupuestos/nuevo",
    "/presupuestos/nuevo/crear",
    "/presupuestos/reporte",
    "/prospectos",
    "/prospectos/:prospectId",
    "/proveedores",
    "/proveedores/:id/edit",
    "/proveedores/new",
    "/proveedores/reporte",
    "/recepcion/:fiestaId",
    "/recursos-multi-evento",
    "/repaso-diario",
    "/secretaria-ak",
    "/settings",
    "/settings/accesos-personal",
    "/settings/account",
    "/settings/agentes-autonomos",
    "/settings/ai-assistant",
    "/settings/ajuste-precios",
    "/settings/asistentes-contextuales",
    "/settings/backup",
    "/settings/backup-final",
    "/settings/biblioteca-visual-ak",
    "/settings/budget-display",
    "/settings/catalogo-servicios",
    "/settings/cierre-global-producto",
    "/settings/cierre-operativo-final",
    "/settings/company",
    "/settings/contenido-publico",
    "/settings/contratos",
    "/settings/contratos/clausulas",
    "/settings/cupones",
    "/settings/datos",
    "/settings/feature-flags",
    "/settings/feedback",
    "/settings/google-workspace",
    "/settings/instalar-app",
    "/settings/lanzamiento-cto",
    "/settings/mapa-tecnologico-ak",
    "/settings/notifications",
    "/settings/promos",
    "/settings/sincronizaciones",
    "/settings/social-connections",
    "/settings/tareas-automaticas",
    "/settings/task-templates",
    "/settings/templates",
    "/settings/templates/carga-operativa",
    "/settings/templates/contrato",
    "/settings/templates/invitaciones",
    "/settings/templates/layouts",
    "/settings/templates/reuniones",
    "/settings/whatsapp",
    "/settings/whatsapp-business",
    "/settings/whatsapp-business/conversations",
    "/settings/whatsapp-templates",
    "/simulador",
    "/simulador-ak"
  ],
  "invitado": [
    "/album/:fiestaId",
    "/evento",
    "/evento/:id/video-recuerdo",
    "/evento/accesos/:fiestaId",
    "/evento/actual",
    "/evento/actual/checkin",
    "/evento/actual/mesa",
    "/evento/album/:fiestaId",
    "/evento/barra",
    "/evento/barra/:fiestaId",
    "/evento/barra/:fiestaId/barman",
    "/evento/barra/:fiestaId/stats",
    "/evento/bogue/:fiestaId",
    "/evento/buzon",
    "/evento/buzon/:fiestaId",
    "/evento/dj",
    "/evento/dj/:fiestaId",
    "/evento/en-vivo/:fiestaId",
    "/evento/en-vivo/:fiestaId/invitados",
    "/evento/en-vivo/:fiestaId/organizador",
    "/evento/en-vivo/:fiestaId/pantalla",
    "/evento/espejo-magico",
    "/evento/espejo-magico/:fiestaId",
    "/evento/fotocabina",
    "/evento/fotocabina/:fiestaId",
    "/evento/galeria/:fiestaId",
    "/evento/hub/:fiestaId",
    "/evento/impresion",
    "/evento/impresion/:fiestaId",
    "/evento/logistica/:fiestaId",
    "/evento/mi-mesa/:fiestaId",
    "/evento/moderacion/:fiestaId",
    "/evento/muro-en-vivo",
    "/evento/muro-en-vivo/:fiestaId",
    "/evento/plataforma-360",
    "/evento/plataforma-360/:fiestaId",
    "/evento/social/:fiestaId",
    "/evento/staff/:fiestaId/cronograma",
    "/evento/totem",
    "/evento/totem/:fiestaId/:totemId",
    "/evento/touchpix",
    "/evento/touchpix/:fiestaId",
    "/evento/video-vida",
    "/evento/video-vida/:fiestaId",
    "/evento/zona-digital/:fiestaId",
    "/feedback/:fiestaId",
    "/i/:slug",
    "/invitacion/:fiestaId",
    "/invitacion/:fiestaId/invitado/:guestId",
    "/invitacion/:fiestaId/recap",
    "/invitacion/:fiestaId/rsvp",
    "/invitado/:fiestaId/:invitadoId",
    "/portal-invitado/:fiestaId/:guestId",
    "/post-fiesta/:fiestaId",
    "/q/:fiestaId",
    "/video-vida",
    "/video-vida/:fiestaId"
  ],
  "portal-cliente": [
    "/portal-cliente",
    "/portal-cliente/:id",
    "/portal-cliente/:id/confirmar-invitados",
    "/portal-cliente/:id/faq",
    "/portal-cliente/:id/fotos-video",
    "/portal-cliente/:id/menu",
    "/portal-cliente/:id/muro-social",
    "/portal-cliente/:id/musica"
  ]
};

/** Todas las pantallas, planas. */
export const TODAS_LAS_PANTALLAS: string[] = Object.values(PANTALLAS_POR_FAMILIA).flat();

export const CUANTAS_PANTALLAS = TODAS_LAS_PANTALLAS.length;

/** Una ruta sirve para navegar si existe como pantalla de la app. */
export function esPantallaReal(ruta: string): boolean {
  if (TODAS_LAS_PANTALLAS.includes(ruta)) return true;
  const partes = ruta.split('/').filter(Boolean);
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
