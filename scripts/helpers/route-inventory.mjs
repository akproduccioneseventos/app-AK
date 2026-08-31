import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

export const FIXTURE_IDS = {
  activo: 'lc_psitio',
  customer: 'e2e-dynamic-customer',
  empleado: 'emp_1759833938625_518g1',
  fiesta: 'fiesta_esta_noche',
  insumo: 'ing-harina',
  invoice: 'e2e-dynamic-invoice',
  menu: 'menu_entradas_maestro',
  presupuesto: 'e2e-dynamic-presupuesto',
  proveedor: 'prov_calsal',
  salon: 'e2e-dynamic-salon',
  servicio: 'serv_hielo',
  totem: 'totem_principal',
  guest: 'invitado_1',
  accessKey: 'portal-demo-key',
  token: 'token_demo_123',
  slug: 'quince-anos',
  tipo: 'quince',
  prospect: 'lead_demo_123',
  eventType: 'quince',
};

export function crearCookieDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function crearPermisoDeEstacion(fiestaId, moduloId, horas = 18) {
  const datos = Buffer.from(
    JSON.stringify({
      version: 'ent-v2',
      fiestaId,
      moduleId: moduloId,
      scope: 'guest',
      expiresAt: Date.now() + horas * 60 * 60 * 1000,
      nonce: crypto.randomUUID(),
    }),
  ).toString('base64url');
  const firma = crypto.createHmac('sha256', SESSION_SECRET).update(datos).digest('base64url');
  return `${datos}.${firma}`;
}

function findPageFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPageFiles(entryPath);
    return entry.name === 'page.tsx' ? [entryPath] : [];
  });
}

export function getModuleForRoute(route) {
  if (/^\/evento\/(fotocabina|plataforma-360|bogue|espejo-magico|touchpix|buzon)/.test(route) || /\/entretenimiento/.test(route)) {
    return 'Entretenimiento (6 estaciones)';
  }
  if (/\/muro-en-vivo|\/pantalla|\/galeria-led|\/presentacion-led/.test(route)) {
    return 'Pantalla gigante';
  }
  if (/^\/invitacion|^\/invitado|\/templates\/invitaciones|\/pagina-web/.test(route)) {
    return 'Invitación digital';
  }
  if (/^\/evento\/social|^\/evento\/hub|^\/evento\/mi-mesa|\/muro-social|\/social-fiesta-pro/.test(route)) {
    return 'Red social del evento';
  }
  if (/\/decoracion|\/diseno-salon|\/ambientacion/.test(route)) {
    return 'Decoración';
  }
  if (/^\/presupuesto|^\/presupuestos|^\/simulador|\/ventas/.test(route)) {
    return 'Presupuestos y ventas';
  }
  if (/^\/invoices|^\/pagos|\/finanzas|\/plan-pagos/.test(route)) {
    return 'Cobros, cuotas y facturas';
  }
  if (/\/menu|\/catering|\/compras|\/insumos|\/platos/.test(route)) {
    return 'Comida y lista de compras';
  }
  if (/\/permisos|\/accesos|\/settings\/account|\/settings\/accesos/.test(route)) {
    return 'Permisos: quién ve qué';
  }
  if (/\/invitados|\/checkin|\/asistencia|\/rsvp/.test(route)) {
    return 'Invitados y confirmaciones';
  }
  if (/^\/portal|\/portal-cliente/.test(route)) {
    return 'Portal del cliente';
  }
  if (/\/dj|\/musica|\/playlist|\/canciones/.test(route)) {
    return 'Música y DJ';
  }
  if (/\/personal|\/proveedores|\/proveedor|\/empleados/.test(route)) {
    return 'Personal y proveedores';
  }
  if (/\/logistica|\/carga-operativa|\/cronograma|\/reuniones|\/tareas/.test(route)) {
    return 'Logística y armado';
  }
  if (/^\/marketing|^\/blog|^\/publicador|\/anuncios|\/promos/.test(route)) {
    return 'Marketing y redes';
  }
  return 'Configuración de la empresa';
}

export function isPassiveRoute(route) {
  return (
    /\/muro-en-vivo|\/pantalla|\/totem|\/galeria-led|\/presentacion-led|\/en-vivo\/.*\/pantalla/.test(
      route,
    )
  );
}

export function resolveDynamicSegments(segments) {
  const routeStr = segments.join('/');
  return segments.map((seg) => {
    if (!seg.startsWith('[')) return seg;
    if (seg === '[...slugs]') return 'catalogo';
    if (seg === '[menuId]') return FIXTURE_IDS.menu;
    if (seg === '[empleadoId]') return FIXTURE_IDS.empleado;
    if (seg === '[fiestaId]') return FIXTURE_IDS.fiesta;
    if (seg === '[totemId]') return FIXTURE_IDS.totem;
    if (seg === '[guestId]' || seg === '[invitadoId]') return FIXTURE_IDS.guest;
    if (seg === '[accessKey]') return FIXTURE_IDS.accessKey;
    if (seg === '[tokenId]' || seg === '[token]') return FIXTURE_IDS.token;
    if (seg === '[slug]') return FIXTURE_IDS.slug;
    if (seg === '[tipo]') return FIXTURE_IDS.tipo;
    if (seg === '[eventType]') return FIXTURE_IDS.eventType;
    if (seg === '[prospectId]') return FIXTURE_IDS.prospect;
    if (seg === '[module]') return 'fotocabina';
    if (seg === '[id]') {
      if (routeStr.includes('fiestas/')) return FIXTURE_IDS.fiesta;
      if (routeStr.includes('invoices/')) return FIXTURE_IDS.invoice;
      if (routeStr.includes('presupuestos/')) return FIXTURE_IDS.presupuesto;
      if (routeStr.includes('customers/')) return FIXTURE_IDS.customer;
      if (routeStr.includes('empleados/')) return FIXTURE_IDS.empleado;
      if (routeStr.includes('salones/')) return FIXTURE_IDS.salon;
      if (routeStr.includes('proveedores/')) return FIXTURE_IDS.proveedor;
      if (routeStr.includes('insumos/')) return FIXTURE_IDS.insumo;
      if (routeStr.includes('activos-fijos/')) return FIXTURE_IDS.activo;
      if (routeStr.includes('todos-los-servicios/') || routeStr.includes('servicios/')) return FIXTURE_IDS.servicio;
      if (routeStr.includes('portal-cliente/')) return FIXTURE_IDS.fiesta;
      return FIXTURE_IDS.fiesta;
    }
    return 'demo';
  });
}

export function getAllRoutes(appRoot = path.join(process.cwd(), 'src', 'app')) {
  const pageFiles = findPageFiles(appRoot);
  return pageFiles.map((filePath) => {
    const stats = fs.statSync(filePath);
    let rel = path.relative(appRoot, path.dirname(filePath)).replace(/\\/g, '/');
    const rawSegments = rel ? rel.split('/') : [];
    
    // Omit route groups like (app) in public URL
    const urlSegments = rawSegments.filter((s) => !s.startsWith('(') || !s.endsWith(')'));
    const resolvedSegments = resolveDynamicSegments(urlSegments);
    let pathname = '/' + resolvedSegments.join('/');
    if (pathname === '//' || pathname === '') pathname = '/';

    const routeTemplate = '/' + urlSegments.join('/');

    let type = 'app';
    if (pathname.startsWith('/evento/')) type = 'evento';
    else if (pathname.startsWith('/invitacion/') || pathname.startsWith('/invitado/')) type = 'invitacion';
    else if (pathname.startsWith('/portal/') || pathname.startsWith('/portal-cliente/')) type = 'portal';
    else if (
      pathname === '/' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/catalogo') ||
      pathname.startsWith('/bodas') ||
      pathname.startsWith('/cumpleanos') ||
      pathname.startsWith('/quinceaneras') ||
      pathname.startsWith('/blog') ||
      pathname.startsWith('/landing') ||
      pathname.startsWith('/simulador') ||
      pathname.startsWith('/privacidad')
    ) {
      type = 'public';
    }

    // Query params for specialized screens
    let query = '';
    if (pathname.startsWith('/evento/')) {
      const match = pathname.match(/\/evento\/([^\/]+)/);
      const moduloId = match ? match[1] : 'fotocabina';
      const permission = crearPermisoDeEstacion(FIXTURE_IDS.fiesta, moduloId);
      query = `?access=${permission}`;
      if (pathname.includes('/evento/espejo-magico')) {
        query += '&mode=foto';
      }
    }

    const testUrl = `${pathname}${query}`;
    const moduleName = getModuleForRoute(pathname);
    const passive = isPassiveRoute(pathname);

    return {
      filePath,
      routeTemplate,
      pathname,
      testUrl,
      type,
      moduleName,
      passive,
      mtime: stats.mtime.toISOString(),
    };
  });
}
