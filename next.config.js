const path = require('path');
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  // NO se recarga la pantalla al volver la senal (25 de septiembre de 2026). Con `true`, la
  // fotocabina, la barra y las estaciones se recargaban en plena fiesta cada vez que el wifi
  // del salon volvia, cortando al invitado a mitad de la foto o del pedido. Lo guardado sin
  // senal lo sube la cola de cada pantalla (`SyncStatusIndicator`), sin recargar.
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development' || process.env.AK_DISABLE_PWA_BUILD === 'true',
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
    // **La pantalla de entrada nunca sale de la memoria del telefono.**
    //
    // Paso de verdad: el dueno apretaba "Ingresar" y no pasaba absolutamente nada.
    // Ni el cartel de "Ingresando...", ni un error. El boton, muerto.
    //
    // Una pagina guardada en la memoria del navegador se sirve con el programa de
    // la version vieja. Si ese programa ya no coincide con la pagina, la pantalla se
    // dibuja igual —se ve perfecta— pero **ningun boton responde**. Y como queda
    // guardada, el problema no se arregla solo: se repite en cada visita.
    //
    // Con esto, la entrada y la recuperacion de clave se piden siempre al servidor.
    // Es la unica puerta de la app: si se queda pegada, no hay forma de entrar a
    // arreglarla desde adentro.
    navigateFallbackDenylist: [/^\/login/, /^\/api\//],
    runtimeCaching: [
      {
        urlPattern: /^\/login(\?.*)?$/,
        handler: 'NetworkOnly',
      },
    ],
  },
});

/**
 * Firebase App Hosting se moría en "Linting and checking validity of types": el registro se corta
 * ahí sin ningún error (compilaciones del 10/10/2026, commits 2aac14e, 8521548 y 9a05462). Medido:
 * la última que salió (0af7465) y la primera que falló tienen el mismo tamaño (5677 y 5681
 * archivos, misma memoria del revisor), así que no es el código. Ya pasó en septiembre.
 *
 * Decisión del dueño (10/10/2026, "resolvelo vos"): en Firebase se saltea ese paso, porque se hace
 * completo antes: la puerta (`npm run "publicar?"`) corre el revisor de tipos y la compilación con
 * chequeo, y el filtro de subida no deja subir sin la puerta en verde. Fuera de Firebase, igual que antes.
 */
const enFirebaseAppHosting = Boolean(process.env.FIREBASE_APP_HOSTING);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: enFirebaseAppHosting },
  eslint: { ignoreDuringBuilds: enFirebaseAppHosting },
  // Windows without Developer Mode cannot create the pnpm symlinks used by
  // Next standalone tracing. Production keeps standalone unless explicitly disabled.
  output: process.env.AK_DISABLE_STANDALONE === 'true' ? undefined : 'standalone',
  compress: true,
  /* config options here */
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita que el sitio sea embebido en iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Desactiva detección de MIME-type automática del navegador
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Fuerza HTTPS por 1 ano solo en el host actual
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          // Controla información de referencia enviada a terceros
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Cámara, micrófono y ubicación sólo para la propia app (nunca terceros ni iframes). La
          // ubicación hace falta para "Marcar llegada" del personal: con geolocation=() el navegador
          // la bloqueaba aunque la persona diera permiso (Codex, auditoría 92). El servidor sigue
          // validando el radio.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
          // Desactiva el filtro XSS obsoleto de navegadores antiguos
          { key: 'X-XSS-Protection', value: '0' },
          /**
           * LA LISTA BLANCA, POR AHORA EN MODO ESCUCHA.
           *
           * `Content-Security-Policy-Report-Only` **no bloquea nada**: el navegador
           * anota en su consola lo que habria bloqueado y sigue de largo. Riesgo cero
           * para un sitio que esta vendiendo.
           *
           * Va asi a proposito. La web carga cosas de muchos lados —Google, Instagram,
           * YouTube, Spotify, Facebook, los mapas, Canva, el almacenamiento de
           * Firebase—. Si se prende bloqueando y falta uno solo, **ese pedazo deja de
           * funcionar y no avisa**: se ve un hueco en blanco y nadie sabe por que.
           *
           * **Como se prende de verdad, cuando toque:** mirar en la consola del
           * navegador que quedo anotado durante unos dias de uso real, agregar lo que
           * falte, y recien ahi cambiar el nombre de la cabecera sacandole
           * `-Report-Only`.
           */
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "media-src 'self' data: blob: https:",
              "connect-src 'self' https://www.google-analytics.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.googleapis.com https://graph.facebook.com",
              "frame-src 'self' https://www.youtube.com https://open.spotify.com https://www.google.com https://maps.google.com https://*.canva.site",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  // **Una sola direccion para Google, no dos.**
  //
  // La web contesta igual con "www" adelante y sin el. Para una persona es la
  // misma pagina; para Google pueden ser dos sitios distintos con el mismo
  // contenido, y entonces reparte entre los dos lo que deberia sumar a uno solo.
  // Paso de verdad: Google tenia anotada la portada como www.akproducciones.uy
  // mientras la app se declara a si misma sin www en todos lados (el mapa del
  // sitio, la ficha del negocio y la direccion canonica de cada pagina).
  //
  // Con esto, quien entre con "www" llega igual, pero pasando por la direccion
  // buena. Es permanente a proposito: asi Google traslada a la direccion sin www
  // lo que ya tenia acumulado en la otra, en vez de empezar de cero.
  async redirects() {
    return [
      {
        source: '/:ruta*',
        has: [{ type: 'host', value: 'www.akproducciones.uy' }],
        destination: 'https://akproducciones.uy/:ruta*',
        permanent: true,
      },
      {
        source: '/blog',
        destination: '/public/blog',
        permanent: true,
      },
      // Los tableros viejos de la fiesta van directo a su centro desde el servidor, sin cargar la pantalla del equipo
      // (18/11/2026: con la máquina cargada la redirección dentro de la página tardaba más de un minuto).
      ...['centro-total', 'centro', 'mission-control'].map((viejo) => ({
        source: `/fiestas/nueva/${viejo}`,
        has: [{ type: 'query', key: 'fiestaId', value: '(?<id>[A-Za-z0-9_-]{1,120})' }],
        destination: '/fiestas/:id/centro',
        permanent: false,
      })),
      {
        source: '/blog/:slug',
        destination: '/public/blog/:slug',
        permanent: true,
      },
      {
        source: '/landing',
        destination: '/',
        permanent: true,
      },
      {
        source: '/landing/bodas',
        destination: '/bodas',
        permanent: true,
      },
      {
        source: '/landing/xv-anos',
        destination: '/quinceaneras',
        permanent: true,
      },
      {
        source: '/presentacion',
        destination: '/presentacion-led',
        permanent: true,
      },
      {
        source: '/public',
        destination: '/',
        permanent: true,
      },
      {
        source: '/portal-cliente',
        destination: '/portal',
        permanent: true,
      },
      {
        source: '/evento',
        destination: '/eventos',
        permanent: true,
      },
      {
        source: '/album/:fiestaId',
        destination: '/evento/album/:fiestaId',
        permanent: true,
      },
      {
        source: '/proveedor/:id',
        destination: '/proveedor/acceso/:id',
        permanent: true,
      },
      {
        source: '/configuracion/backup-final',
        destination: '/settings?seccion=sistema&sub=backup-final',
        permanent: true,
      },
      {
        /**
         * ESTOS TRES REDIRECCIONAMIENTOS VAN ACA Y NO ADENTRO DE LA PANTALLA.
         *
         * Medido el 5 de septiembre de 2026 con la app compilada: cuando la pantalla
         * redirige por su cuenta, el navegador tira un error de React y el invitado
         * llega a ver **"Application error"** en vez de su invitacion. Hecho aca, el
         * servidor manda directo al destino y no hay nada que se rompa.
         *
         * El primero conserva la fiesta del enlace: los enlaces viejos de invitaciones
         * ya repartidas siguen abriendo la invitacion correcta, no la portada.
         */
        source: '/evento/actual',
        has: [{ type: 'query', key: 'fiestaId' }],
        destination: '/invitacion/:fiestaId',
        permanent: false,
      },
      {
        source: '/evento/actual',
        destination: '/',
        permanent: false,
      },
      {
        source: '/invitado/:fiestaId/:guestId',
        destination: '/portal-invitado/:fiestaId/:guestId',
        permanent: false,
      },
      {
        // A la lista de prospectos de siempre. Quien no tenga sesion, la propia
        // pantalla de destino lo manda a iniciarla: aca no se decide eso.
        source: '/prospectos',
        destination: '/contabilidad/crm',
        permanent: false,
      },
      {
        source: '/prospectos/:prospectId',
        destination: '/contabilidad/crm',
        permanent: false,
      },
      // ── Orden 321 Bloque 1: Redirecciones que antes tenían su propio page.tsx ──
      { source: '/contabilidad', destination: '/empresa/contabilidad', permanent: false },
      { source: '/empresa/crm', destination: '/contabilidad/crm?view=guest', permanent: false },
      { source: '/empresa/empleados/reporte', destination: '/empleados?tab=reporte', permanent: false },
      { source: '/empresa/insumos/editar/:id', destination: '/empresa/insumos/:id/editar', permanent: false },
      { source: '/empresa/personal/:empleadoId/historial', destination: '/empleados/:empleadoId/historial', permanent: false },
      { source: '/empresa/redes-sociales/ia-marketing', destination: '/empresa/presencia-digital?tab=redes', permanent: false },
      { source: '/empresa/todos-los-servicios/:id/editar', destination: '/empresa/servicios/editar/:id', permanent: false },
      {
        source: '/fiestas/nueva/centro',
        has: [{ type: 'query', key: 'fiestaId', value: '(?<id>[A-Za-z0-9_-]{1,120})' }],
        destination: '/fiestas/:id/centro',
        permanent: false,
      },
      { source: '/fiestas/nueva/centro', destination: '/eventos', permanent: false },
      {
        source: '/fiestas/nueva/centro-total',
        has: [{ type: 'query', key: 'fiestaId', value: '(?<id>[A-Za-z0-9_-]{1,120})' }],
        destination: '/fiestas/:id/centro',
        permanent: false,
      },
      { source: '/fiestas/nueva/centro-total', destination: '/eventos', permanent: false },
      {
        source: '/fiestas/nueva/mission-control',
        has: [{ type: 'query', key: 'fiestaId', value: '(?<id>[A-Za-z0-9_-]{1,120})' }],
        destination: '/fiestas/:id/centro',
        permanent: false,
      },
      { source: '/fiestas/nueva/mission-control', destination: '/eventos', permanent: false },
      {
        source: '/fiestas/nueva/fiesta-lista',
        has: [{ type: 'query', key: 'fiestaId', value: '(?<id>[A-Za-z0-9_-]{1,120})' }],
        destination: '/fiestas/:id/centro',
        permanent: false,
      },
      { source: '/fiestas/nueva/fiesta-lista', destination: '/eventos', permanent: false },
      { source: '/fiestas/nueva/invitados/numeros-mesa', destination: '/fiestas/nueva', permanent: false },
      ...['centro-de-mando', 'centro-experiencia', 'comando-total', 'show-control'].map((tab) => ({
        source: `/fiestas/:id/${tab}`,
        destination: '/fiestas/:id/centro',
        permanent: false,
      })),
      { source: '/presupuestos', destination: '/presupuestos/nuevo', permanent: false },
      // Sin "nuevo", "importar" ni "reporte": son pantallas o tienen su propia redirección (la lista vive en /presupuestos/nuevo).
      { source: '/presupuestos/:id((?!nuevo$|importar$|reporte$)[^/]+)', destination: '/presupuestos/:id/ver', permanent: false },
      { source: '/presupuestos/:id/editar', destination: '/presupuestos/:id/edit', permanent: false },
      { source: '/repaso-diario', destination: '/mi-dia', permanent: false },
      { source: '/settings/templates/contrato', destination: '/settings?seccion=contratos&sub=contratos', permanent: false },
      { source: '/admin/asistente-ak', destination: '/asistente', permanent: false },
      { source: '/marketing/checklist', destination: '/empresa/presencia-digital?tab=marketing', permanent: false },
      { source: '/marketing/plantillas', destination: '/empresa/presencia-digital?tab=marketing', permanent: false },
      { source: '/portal-cliente/:id/decoracion', destination: '/portal/:id/decoracion', permanent: false },
      // ── Orden 321 Bloque 4: Ajustes unificados en /settings?seccion=...&sub=... ──
      { source: '/settings/company', destination: '/settings?seccion=empresa&sub=company', permanent: false },
      { source: '/settings/datos', destination: '/settings?seccion=empresa&sub=datos', permanent: false },
      { source: '/settings/account', destination: '/settings?seccion=empresa&sub=account', permanent: false },
      { source: '/settings/contenido-publico', destination: '/settings?seccion=empresa&sub=contenido-publico', permanent: false },
      { source: '/settings/estilo-fotos', destination: '/settings?seccion=empresa&sub=estilo-fotos', permanent: false },
      { source: '/settings/biblioteca-visual-ak', destination: '/settings?seccion=empresa&sub=biblioteca-visual-ak', permanent: false },
      { source: '/settings/budget-display', destination: '/settings?seccion=ventas&sub=budget-display', permanent: false },
      { source: '/settings/promos', destination: '/settings?seccion=ventas&sub=promos', permanent: false },
      { source: '/settings/cupones', destination: '/settings?seccion=ventas&sub=cupones', permanent: false },
      { source: '/settings/ajuste-precios', destination: '/settings?seccion=ventas&sub=ajuste-precios', permanent: false },
      { source: '/settings/catalogo-servicios', destination: '/settings?seccion=ventas&sub=catalogo-servicios', permanent: false },
      { source: '/settings/contratos', destination: '/settings?seccion=contratos&sub=contratos', permanent: false },
      { source: '/settings/contratos/clausulas', destination: '/settings?seccion=contratos&sub=contratos--clausulas', permanent: false },
      { source: '/settings/templates', destination: '/settings?seccion=contratos&sub=templates', permanent: false },
      { source: '/settings/templates/layouts', destination: '/settings?seccion=contratos&sub=templates--layouts', permanent: false },
      { source: '/settings/templates/reuniones', destination: '/settings?seccion=contratos&sub=templates--reuniones', permanent: false },
      { source: '/settings/templates/carga-operativa', destination: '/settings?seccion=contratos&sub=templates--carga-operativa', permanent: false },
      { source: '/settings/templates/invitaciones', destination: '/settings?seccion=contratos&sub=templates--invitaciones', permanent: false },
      { source: '/settings/task-templates', destination: '/settings?seccion=contratos&sub=task-templates', permanent: false },
      { source: '/settings/whatsapp', destination: '/settings?seccion=conexiones&sub=whatsapp', permanent: false },
      { source: '/settings/whatsapp-business', destination: '/settings?seccion=conexiones&sub=whatsapp-business', permanent: false },
      { source: '/settings/whatsapp-templates', destination: '/settings?seccion=conexiones&sub=whatsapp-templates', permanent: false },
      { source: '/settings/social-connections', destination: '/settings?seccion=conexiones&sub=social-connections', permanent: false },
      { source: '/settings/google-workspace', destination: '/settings?seccion=conexiones&sub=google-workspace', permanent: false },
      { source: '/settings/sincronizaciones', destination: '/settings?seccion=conexiones&sub=sincronizaciones', permanent: false },
      { source: '/settings/ai-assistant', destination: '/settings?seccion=asistente&sub=ai-assistant', permanent: false },
      { source: '/settings/asistente', destination: '/settings?seccion=asistente&sub=asistente', permanent: false },
      { source: '/settings/asistentes-contextuales', destination: '/settings?seccion=asistente&sub=asistentes-contextuales', permanent: false },
      { source: '/settings/agentes-autonomos', destination: '/settings?seccion=asistente&sub=agentes-autonomos', permanent: false },
      { source: '/settings/tareas-automaticas', destination: '/settings?seccion=asistente&sub=tareas-automaticas', permanent: false },
      { source: '/settings/accesos-personal', destination: '/settings?seccion=equipo&sub=accesos-personal', permanent: false },
      { source: '/settings/notifications', destination: '/settings?seccion=equipo&sub=notifications', permanent: false },
      { source: '/settings/backup', destination: '/settings?seccion=sistema&sub=backup', permanent: false },
      { source: '/settings/backup-final', destination: '/settings?seccion=sistema&sub=backup-final', permanent: false },
      { source: '/settings/instalar-app', destination: '/settings?seccion=sistema&sub=instalar-app', permanent: false },
      { source: '/settings/videos-de-ayuda', destination: '/settings?seccion=sistema&sub=videos-de-ayuda', permanent: false },
      { source: '/settings/feedback', destination: '/settings?seccion=sistema&sub=feedback', permanent: false },
      { source: '/settings/feature-flags', destination: '/settings?seccion=sistema&sub=feature-flags', permanent: false },
      { source: '/settings/cierre-global-producto', destination: '/settings', permanent: false },
      { source: '/settings/lanzamiento-cto', destination: '/settings', permanent: false },
      { source: '/settings/cierre-operativo-final', destination: '/settings', permanent: false },
      { source: '/settings/mapa-tecnologico-ak', destination: '/settings', permanent: false },
      { source: '/settings/whatsapp-business/conversations', destination: '/contabilidad/crm/outbox?tab=conversaciones', permanent: false },
      // ── Orden 321 Bloque 3 y 7: Pantallas repetidas unificadas ──
      { source: '/control-tower', destination: '/mi-dia', permanent: false },
      { source: '/control-tower/automatizaciones', destination: '/mi-dia', permanent: false },
      { source: '/control-tower/comercial', destination: '/mi-dia', permanent: false },
      { source: '/control-tower/post-fiesta', destination: '/mi-dia', permanent: false },
      { source: '/control-tower/preparacion', destination: '/mi-dia', permanent: false },
      { source: '/centro-de-control', destination: '/mi-dia?tab=centro', permanent: false },
      { source: '/empresa/dashboard', destination: '/mi-dia', permanent: false },
      { source: '/admin', destination: '/mi-dia', permanent: false },
      { source: '/mas', destination: '/mi-dia', permanent: false },
      { source: '/secretaria-ak', destination: '/asistente', permanent: false },
      { source: '/multiagente', destination: '/asistente?tab=equipo', permanent: false },
      { source: '/multiagente/equipo', destination: '/asistente?tab=equipo', permanent: false },
      { source: '/multiagente/memoria', destination: '/asistente?tab=memoria', permanent: false },
      { source: '/multiagente/acciones', destination: '/asistente?tab=acciones', permanent: false },
      { source: '/multiagente/contable', destination: '/asistente?tab=equipo&agente=contable', permanent: false },
      { source: '/multiagente/fiestas', destination: '/asistente?tab=equipo&agente=fiestas', permanent: false },
      { source: '/comparativa-ganancias', destination: '/empresa/contabilidad/reportes?tab=comparativa', permanent: false },
      { source: '/admin/finanzas', destination: '/empresa/contabilidad/reportes?tab=tablero', permanent: false },
      { source: '/catalogo', destination: '/presentacion-led', permanent: false },
      { source: '/catalogo/:tipo', destination: '/presentacion-led', permanent: false },
      { source: '/galeria-led', destination: '/presentacion-led', permanent: false },
      { source: '/presentacion-led/portafolio', destination: '/presentacion-led', permanent: false },
      { source: '/presentacion-led/portafolio/fiesta/:id', destination: '/presentacion-led', permanent: false },
      { source: '/tecnologia', destination: '/presentacion-led', permanent: false },
      { source: '/marketing/demo-tecnologia', destination: '/presentacion-led', permanent: false },
      // ── Orden 321 Bloque 5: Fiestas consolidadas ──
      { source: '/fiestas/revisar', destination: '/eventos', permanent: false },
      // Sin "nueva" ni "revisar": "nueva" es el planificador; si se tapa, no se puede crear una fiesta.
      { source: '/fiestas/:id((?!nueva$|revisar$)[^/]+)', destination: '/fiestas/:id/centro', permanent: false },
      { source: '/fiestas/:id/ak-100', destination: '/fiestas/:id/centro', permanent: false },
      { source: '/fiestas/:id/cierre-mundial', destination: '/fiestas/:id/centro', permanent: false },
      { source: '/fiestas/:id/experiencia-tecnologica-ak', destination: '/fiestas/:id/centro', permanent: false },
      { source: '/fiestas/nueva/readiness', destination: '/eventos', permanent: false },
      { source: '/fiestas/nueva/zona-digital', destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=zona-digital', permanent: false },
      { source: '/fiestas/nueva/resumen-planificacion', destination: '/fiestas/nueva/operacion?tab=orden-de-evento', permanent: false },
      { source: '/fiestas/nueva/resumen-imprimible', destination: '/fiestas/nueva/operacion?tab=orden-de-evento', permanent: false },
      { source: '/fiestas/nueva/planner-costo-fiesta', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad&subtab=planner', permanent: false },
      { source: '/fiestas/nueva/reunion-organizacion', destination: '/fiestas/nueva/operacion?tab=reuniones&subtab=organizacion', permanent: false },
      { source: '/fiestas/:id/timeline', destination: '/fiestas/nueva/operacion?tab=itinerario&fiestaId=:id', permanent: false },
      { source: '/fiestas/nueva/carteleria', destination: '/fiestas/nueva/comida?tab=carteleria', permanent: false },
      { source: '/fiestas/nueva/menu-mesa', destination: '/fiestas/nueva/comida?tab=menu-mesa', permanent: false },
      { source: '/fiestas/nueva/numeros-mesa', destination: '/fiestas/nueva/comida?tab=numeros-mesa', permanent: false },
      { source: '/fiestas/nueva/carta-tragos', destination: '/fiestas/nueva/comida?tab=carta-tragos', permanent: false },
      { source: '/fiestas/nueva/pagina-web', destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=pagina-web', permanent: false },
      { source: '/fiestas/nueva/social-fiesta-pro', destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=social-pro', permanent: false },
      { source: '/fiestas/nueva/social-fiesta-pro/cierre-final', destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=cierre', permanent: false },
      { source: '/fiestas/nueva/portal-cliente/experiencia-mundial', destination: '/fiestas/nueva/plata-y-papeles?tab=portal-cliente&subtab=experiencia', permanent: false },
      { source: '/fiestas/nueva/portal-cliente/cierre-final', destination: '/fiestas/nueva/plata-y-papeles?tab=portal-cliente&subtab=cierre', permanent: false },
      // ── Orden 321: Consolidaciones finales para <= 180 páginas ──
      { source: '/alertas', destination: '/mi-dia?tab=alertas', permanent: false },
      { source: '/admin/ventas', destination: '/contabilidad/crm', permanent: false },
      { source: '/admin/carga-historicos', destination: '/contabilidad/fiestas-historicas?tab=cargar', permanent: false },
      { source: '/empresa', destination: '/mi-dia', permanent: false },
      { source: '/empresa/configurador-reunion', destination: '/settings?seccion=contratos&sub=templates--reuniones', permanent: false },
      { source: '/empresa/activos-fijos/editar/:id', destination: '/empresa/activos-fijos/:id/editar', permanent: false },
      { source: '/empresa/redes-sociales', destination: '/empresa/presencia-digital?tab=redes', permanent: false },
      { source: '/empresa/resenas-google', destination: '/empresa/presencia-digital?tab=resenas', permanent: false },
      { source: '/empresa/marketing', destination: '/empresa/presencia-digital?tab=marketing', permanent: false },
      { source: '/empresa/creador-anuncios', destination: '/empresa/presencia-digital?tab=anuncios', permanent: false },
      { source: '/empresa/red-social-eventos', destination: '/empresa/presencia-digital?tab=social-eventos', permanent: false },
      { source: '/analytics', destination: '/empresa/presencia-digital?tab=analytics', permanent: false },
      { source: '/marketing', destination: '/empresa/presencia-digital?tab=marketing', permanent: false },
      { source: '/empresa/menus/catalogo', destination: '/empresa/menus?tab=catalogo', permanent: false },
      { source: '/empresa/menus/reporte', destination: '/empresa/menus?tab=reporte', permanent: false },
      { source: '/empresa/menus/tragos', destination: '/empresa/menus?tab=tragos', permanent: false },
      { source: '/empresa/activos-fijos/reporte', destination: '/empresa/activos-fijos?tab=reporte', permanent: false },
      { source: '/empresa/insumos/reporte', destination: '/empresa/insumos?tab=reporte', permanent: false },
      { source: '/compras', destination: '/empresa/insumos?tab=compras', permanent: false },
      { source: '/empresa/servicios/reporte', destination: '/empresa/servicios?tab=reporte', permanent: false },
      { source: '/empresa/salones/club-uruguay', destination: '/empresa/salones?tab=club-uruguay', permanent: false },
      { source: '/empresa/salones/experiencia-visual', destination: '/empresa/salones?tab=experiencia', permanent: false },
      { source: '/edicion-videos', destination: '/fiestas/nueva/show?tab=fotografia&subtab=edicion-videos', permanent: false },
      { source: '/contabilidad/comercial-360', destination: '/contabilidad/crm?tab=comercial-360', permanent: false },
      { source: '/contabilidad/crm/agenda', destination: '/contabilidad/crm?tab=agenda', permanent: false },
      { source: '/contabilidad/crm/atraccion-fiestas', destination: '/contabilidad/crm?tab=atraccion', permanent: false },
      { source: '/contabilidad/crm/ciclo-comercial', destination: '/contabilidad/crm?tab=ciclo', permanent: false },
      { source: '/contabilidad/crm/marketing-ads', destination: '/contabilidad/crm?tab=ads', permanent: false },
      { source: '/customers/reporte', destination: '/customers?tab=reporte', permanent: false },
      { source: '/empleados/reporte', destination: '/empleados?tab=reporte', permanent: false },
      { source: '/empleados/roles', destination: '/empleados?tab=roles', permanent: false },
      { source: '/proveedores/reporte', destination: '/proveedores?tab=reporte', permanent: false },
      { source: '/portal-cliente/:id/confirmar-invitados', destination: '/portal-cliente/:id?tab=confirmar-invitados', permanent: false },
      { source: '/portal-cliente/:id/faq', destination: '/portal-cliente/:id?tab=faq', permanent: false },
      { source: '/portal-cliente/:id/fotos-video', destination: '/portal-cliente/:id?tab=fotos-video', permanent: false },
      { source: '/portal-cliente/:id/mensajes', destination: '/portal-cliente/:id?tab=mensajes', permanent: false },
      { source: '/portal-cliente/:id/menu', destination: '/portal-cliente/:id?tab=menu', permanent: false },
      { source: '/portal-cliente/:id/muro-social', destination: '/portal-cliente/:id?tab=muro-social', permanent: false },
      { source: '/portal-cliente/:id/musica', destination: '/portal-cliente/:id?tab=musica', permanent: false },
      { source: '/portal-cliente/:id/tu-web', destination: '/portal-cliente/:id?tab=tu-web', permanent: false },
      { source: '/portal-cliente/:id/videos-invitados', destination: '/portal-cliente/:id?tab=videos-invitados', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/cambio-fecha', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cambio-fecha', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/cancelacion-contrato', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cancelacion-contrato', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/cancelacion-parcial', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cancelacion-parcial', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/contrato-salon', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=contrato-salon', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/contrato-servicio', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=contrato-servicio', permanent: false },
      { source: '/fiestas/nueva/gestion-documental/recibo-pago', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=recibo-pago', permanent: false },
      { source: '/fiestas/nueva/catering/hoja-de-cocina', destination: '/fiestas/nueva/comida?tab=catering&subtab=cocina', permanent: false },
      { source: '/fiestas/nueva/catering/lista-compras', destination: '/fiestas/nueva/comida?tab=catering&subtab=compras', permanent: false },
      { source: '/fiestas/nueva/carga-operativa/pdf', destination: '/fiestas/nueva/operacion?tab=carga-operativa&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/decoracion/pdf', destination: '/fiestas/nueva/show?tab=decoracion&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/itinerario/pdf', destination: '/fiestas/nueva/operacion?tab=itinerario&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/musica/pdf', destination: '/fiestas/nueva/show?tab=musica&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/gestion-costos-rentabilidad/reporte', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad&subtab=reporte', permanent: false },
      { source: '/fiestas/nueva/reuniones/imprimir', destination: '/fiestas/nueva/operacion?tab=reuniones&subtab=imprimir', permanent: false },
      { source: '/fiestas/nueva/invitados/checkin-scanner', destination: '/fiestas/nueva/datos?tab=invitados&subtab=scanner', permanent: false },
      { source: '/fiestas/nueva/invitados/layout', destination: '/fiestas/nueva/datos?tab=invitados&subtab=layout', permanent: false },
      { source: '/fiestas/nueva/personal/recibos', destination: '/fiestas/nueva/operacion?tab=personal&subtab=recibos', permanent: false },
      { source: '/fiestas/nueva/logistica', destination: '/fiestas/nueva/operacion?tab=carga-operativa&subtab=logistica', permanent: false },
      { source: '/fiestas/nueva/playlist-pantalla', destination: '/fiestas/nueva/show?tab=muro-social&subtab=playlist', permanent: false },
      { source: '/fiestas/nueva/en-vivo', destination: '/fiestas/nueva/show?tab=muro-social&subtab=en-vivo', permanent: false },
      { source: '/fiestas/nueva/accesos-personal', destination: '/settings?seccion=equipo&sub=accesos-personal', permanent: false },
      { source: '/fiestas/nueva/barra-tecnologica', destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=barra', permanent: false },
      { source: '/fiestas/nueva/pantallas-totem', destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=pantallas', permanent: false },
      { source: '/fiestas/:id/entretenimiento/control', destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=control&fiestaId=:id', permanent: false },
      { source: '/presupuestos/reporte', destination: '/presupuestos/nuevo?tab=reporte', permanent: false },
      { source: '/presupuestos/importar', destination: '/presupuestos/nuevo?tab=importar', permanent: false },
      // ── Orden 331 Bloque 1: Un solo simulador ──
      { source: '/simulador', destination: '/simulador-de-presupuesto', permanent: false },
      // ── Orden 331 Bloque 2: Planificador agrupado en 5 pantallas con solapas ──
      { source: '/fiestas/nueva/invitados', has: [{ type: 'query', key: 'tab', value: 'layout' }], destination: '/fiestas/nueva/datos?tab=invitados&subtab=layout', permanent: false },
      { source: '/fiestas/nueva/invitados', has: [{ type: 'query', key: 'tab', value: 'scanner' }], destination: '/fiestas/nueva/datos?tab=invitados&subtab=scanner', permanent: false },
      { source: '/fiestas/nueva/carga-operativa', has: [{ type: 'query', key: 'tab', value: 'logistica' }], destination: '/fiestas/nueva/operacion?tab=carga-operativa&subtab=logistica', permanent: false },
      { source: '/fiestas/nueva/carga-operativa', has: [{ type: 'query', key: 'tab', value: 'pdf' }], destination: '/fiestas/nueva/operacion?tab=carga-operativa&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/itinerario', has: [{ type: 'query', key: 'tab', value: 'pdf' }], destination: '/fiestas/nueva/operacion?tab=itinerario&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/reuniones', has: [{ type: 'query', key: 'tab', value: 'organizacion' }], destination: '/fiestas/nueva/operacion?tab=reuniones&subtab=organizacion', permanent: false },
      { source: '/fiestas/nueva/reuniones', has: [{ type: 'query', key: 'tab', value: 'imprimir' }], destination: '/fiestas/nueva/operacion?tab=reuniones&subtab=imprimir', permanent: false },
      { source: '/fiestas/nueva/personal', has: [{ type: 'query', key: 'tab', value: 'recibos' }], destination: '/fiestas/nueva/operacion?tab=personal&subtab=recibos', permanent: false },
      { source: '/fiestas/nueva/catering', has: [{ type: 'query', key: 'tab', value: 'cocina' }], destination: '/fiestas/nueva/comida?tab=catering&subtab=cocina', permanent: false },
      { source: '/fiestas/nueva/catering', has: [{ type: 'query', key: 'tab', value: 'compras' }], destination: '/fiestas/nueva/comida?tab=catering&subtab=compras', permanent: false },
      { source: '/fiestas/nueva/musica', has: [{ type: 'query', key: 'tab', value: 'pdf' }], destination: '/fiestas/nueva/show?tab=musica&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/decoracion', has: [{ type: 'query', key: 'tab', value: 'pdf' }], destination: '/fiestas/nueva/show?tab=decoracion&subtab=pdf', permanent: false },
      { source: '/fiestas/nueva/fotografia', has: [{ type: 'query', key: 'tab', value: 'edicion-videos' }], destination: '/fiestas/nueva/show?tab=fotografia&subtab=edicion-videos', permanent: false },
      { source: '/fiestas/nueva/muro-social', has: [{ type: 'query', key: 'tab', value: 'playlist' }], destination: '/fiestas/nueva/show?tab=muro-social&subtab=playlist', permanent: false },
      { source: '/fiestas/nueva/muro-social', has: [{ type: 'query', key: 'tab', value: 'en-vivo' }], destination: '/fiestas/nueva/show?tab=muro-social&subtab=en-vivo', permanent: false },
      { source: '/fiestas/nueva/entretenimiento', has: [{ type: 'query', key: 'tab', value: 'control' }], destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=control', permanent: false },
      { source: '/fiestas/nueva/entretenimiento', has: [{ type: 'query', key: 'tab', value: 'barra' }], destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=barra', permanent: false },
      { source: '/fiestas/nueva/entretenimiento', has: [{ type: 'query', key: 'tab', value: 'pantallas' }], destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=pantallas', permanent: false },
      { source: '/fiestas/nueva/entretenimiento', has: [{ type: 'query', key: 'tab', value: 'zona-digital' }], destination: '/fiestas/nueva/show?tab=entretenimiento&subtab=zona-digital', permanent: false },
      { source: '/fiestas/nueva/modulo-invitado', has: [{ type: 'query', key: 'tab', value: 'pagina-web' }], destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=pagina-web', permanent: false },
      { source: '/fiestas/nueva/modulo-invitado', has: [{ type: 'query', key: 'tab', value: 'social-pro' }], destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=social-pro', permanent: false },
      { source: '/fiestas/nueva/modulo-invitado', has: [{ type: 'query', key: 'tab', value: 'cierre' }], destination: '/fiestas/nueva/show?tab=modulo-invitado&subtab=cierre', permanent: false },
      { source: '/fiestas/nueva/gestion-costos-rentabilidad', has: [{ type: 'query', key: 'tab', value: 'planner' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad&subtab=planner', permanent: false },
      { source: '/fiestas/nueva/gestion-costos-rentabilidad', has: [{ type: 'query', key: 'tab', value: 'reporte' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad&subtab=reporte', permanent: false },
      { source: '/fiestas/nueva/portal-cliente', has: [{ type: 'query', key: 'tab', value: 'experiencia' }], destination: '/fiestas/nueva/plata-y-papeles?tab=portal-cliente&subtab=experiencia', permanent: false },
      { source: '/fiestas/nueva/portal-cliente', has: [{ type: 'query', key: 'tab', value: 'cierre' }], destination: '/fiestas/nueva/plata-y-papeles?tab=portal-cliente&subtab=cierre', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'cambio-fecha' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cambio-fecha', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'cancelacion-contrato' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cancelacion-contrato', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'cancelacion-parcial' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=cancelacion-parcial', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'contrato-salon' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=contrato-salon', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'contrato-servicio' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=contrato-servicio', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', has: [{ type: 'query', key: 'tab', value: 'recibo-pago' }], destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental&subtab=recibo-pago', permanent: false },
      { source: '/fiestas/nueva/configuracion', destination: '/fiestas/nueva/datos?tab=configuracion', permanent: false },
      { source: '/fiestas/nueva/invitados', destination: '/fiestas/nueva/datos?tab=invitados', permanent: false },
      { source: '/fiestas/nueva/alergias', destination: '/fiestas/nueva/datos?tab=alergias', permanent: false },
      { source: '/fiestas/nueva/regalos', destination: '/fiestas/nueva/datos?tab=regalos', permanent: false },
      { source: '/fiestas/nueva/servicios-contratados', destination: '/fiestas/nueva/datos?tab=servicios-contratados', permanent: false },
      { source: '/fiestas/nueva/catering', destination: '/fiestas/nueva/comida?tab=catering', permanent: false },
      { source: '/fiestas/nueva/entretenimiento', destination: '/fiestas/nueva/show?tab=entretenimiento', permanent: false },
      { source: '/fiestas/nueva/musica', destination: '/fiestas/nueva/show?tab=musica', permanent: false },
      { source: '/fiestas/nueva/fotografia', destination: '/fiestas/nueva/show?tab=fotografia', permanent: false },
      { source: '/fiestas/nueva/video-vida', destination: '/fiestas/nueva/show?tab=video-vida', permanent: false },
      { source: '/fiestas/nueva/muro-social', destination: '/fiestas/nueva/show?tab=muro-social', permanent: false },
      { source: '/fiestas/nueva/modulo-invitado', destination: '/fiestas/nueva/show?tab=modulo-invitado', permanent: false },
      { source: '/fiestas/nueva/decoracion', destination: '/fiestas/nueva/show?tab=decoracion', permanent: false },
      { source: '/fiestas/nueva/personal', destination: '/fiestas/nueva/operacion?tab=personal', permanent: false },
      { source: '/fiestas/nueva/carga-operativa', destination: '/fiestas/nueva/operacion?tab=carga-operativa', permanent: false },
      { source: '/fiestas/nueva/itinerario', destination: '/fiestas/nueva/operacion?tab=itinerario', permanent: false },
      { source: '/fiestas/nueva/orden-de-evento', destination: '/fiestas/nueva/operacion?tab=orden-de-evento', permanent: false },
      { source: '/fiestas/nueva/tareas', destination: '/fiestas/nueva/operacion?tab=tareas', permanent: false },
      { source: '/fiestas/nueva/reuniones', destination: '/fiestas/nueva/operacion?tab=reuniones', permanent: false },
      { source: '/fiestas/nueva/proveedores-portal', destination: '/fiestas/nueva/operacion?tab=proveedores-portal', permanent: false },
      { source: '/fiestas/nueva/asistente', destination: '/fiestas/nueva/operacion?tab=asistente', permanent: false },
      { source: '/fiestas/nueva/buzon', destination: '/fiestas/nueva/operacion?tab=buzon', permanent: false },
      { source: '/fiestas/nueva/plan-pagos', destination: '/fiestas/nueva/plata-y-papeles?tab=plan-pagos', permanent: false },
      { source: '/fiestas/nueva/gestion-costos-rentabilidad', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-costos-rentabilidad', permanent: false },
      { source: '/fiestas/nueva/gestion-documental', destination: '/fiestas/nueva/plata-y-papeles?tab=gestion-documental', permanent: false },
      { source: '/fiestas/nueva/portal-cliente', destination: '/fiestas/nueva/plata-y-papeles?tab=portal-cliente', permanent: false },
      { source: '/fiestas/nueva/post-evento', destination: '/fiestas/nueva/plata-y-papeles?tab=post-evento', permanent: false },
      // ── Orden 331 Bloque 3: Una sola puerta para las estaciones ──
      { source: '/evento/fotocabina', destination: '/evento/inicio?rol=fotocabina', permanent: false },
      { source: '/evento/touchpix', destination: '/evento/inicio?rol=touchpix', permanent: false },
      { source: '/evento/espejo-magico', destination: '/evento/inicio?rol=espejo-magico', permanent: false },
      { source: '/evento/totem', destination: '/evento/inicio?rol=totem', permanent: false },
      { source: '/evento/plataforma-360', destination: '/evento/inicio?rol=plataforma-360', permanent: false },
      { source: '/evento/impresion', destination: '/evento/inicio?rol=impresion', permanent: false },
      { source: '/evento/barra', destination: '/evento/inicio?rol=barra', permanent: false },
      { source: '/evento/buzon', destination: '/evento/inicio?rol=buzon', permanent: false },
      { source: '/evento/dj', destination: '/evento/inicio?rol=dj', permanent: false },
      { source: '/evento/muro-en-vivo', destination: '/evento/inicio?rol=muro-en-vivo', permanent: false },
      { source: '/evento/video-vida', destination: '/evento/inicio?rol=video-vida', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/cron/despachador',
        destination: '/api/cron-despachador',
      },
    ];
  },
  transpilePackages: ['framer-motion'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Firebase Storage — required for social-wall photos uploaded via Admin SDK.
      // Public URLs are always https://storage.googleapis.com/{bucket}/{path}.
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        const message = warning?.message || '';
        const resource = warning?.module?.resource || '';
        return (
          message.includes('Critical dependency') &&
          (resource.includes('@opentelemetry') || resource.includes('require-in-the-middle'))
        );
      },
    ];

    config.resolve.alias = {
      ...config.resolve.alias,
      '@firebase/auth': path.resolve(__dirname, 'node_modules/firebase/node_modules/@firebase/auth/dist/node/index.js'),
      '@opentelemetry/exporter-jaeger': false,
      '@opentelemetry/sdk-node': path.resolve(__dirname, 'src/lib/telemetria-apagada-node-sdk.js'),
      'canvg': false,
      'dompurify': false,
    };

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /SemanticAttributes/,
        path.resolve(__dirname, 'src/lib/empty-mock.js')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /SemanticResourceAttributes/,
        path.resolve(__dirname, 'src/lib/empty-mock.js')
      )
    );

    return config;
  },
};

// Forcing a clean rebuild to apply the new public base URL environment variable.
// This comment forces a rebuild to fix dynamic routing issues.
module.exports = withPWA(nextConfig);
