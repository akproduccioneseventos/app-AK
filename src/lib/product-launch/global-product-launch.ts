export type LaunchStatus = 'listo' | 'revisar' | 'pendiente';
export type LaunchPriority = 'alta' | 'media' | 'baja';

export type ProductFlowStep = {
  order: number;
  title: string;
  simpleGoal: string;
  owner: string;
  href: string;
  expectedResult: string;
};

export type LaunchCheck = {
  label: string;
  detail: string;
  href: string;
  priority: LaunchPriority;
};

export type LaunchPillar = {
  id: string;
  title: string;
  simpleGoal: string;
  status: LaunchStatus;
  score: number;
  href: string;
  checks: LaunchCheck[];
};

export type VisualLibraryUseCase = {
  title: string;
  whereItShows: string;
  href: string;
  requiredAssets: string[];
};

export type ProductLaunchPlan = {
  score: number;
  headline: string;
  principle: string;
  masterFlow: ProductFlowStep[];
  pillars: LaunchPillar[];
  visualLibrary: VisualLibraryUseCase[];
  nextPracticalActions: LaunchCheck[];
};

export const productLaunchPlan: ProductLaunchPlan = {
  score: 91,
  headline: 'La app ya tiene los motores principales. Ahora el trabajo es que se usen como un solo producto.',
  principle: 'Cada modulo debe responder una pregunta concreta: que vendo, que se contrato, que falta, quien lo hace, que ve el cliente, que ve el invitado y que se muestra en la fiesta.',
  masterFlow: [
    {
      order: 1,
      title: 'Captar prospecto',
      simpleGoal: 'Entrar por web, Club Uruguay, portafolio LED, simulador o WhatsApp con un mensaje claro.',
      owner: 'Comercial / Marketing',
      href: '/contabilidad/comercial-360',
      expectedResult: 'Lead con origen, tipo de evento, fecha tentativa e interes principal.',
    },
    {
      order: 2,
      title: 'Vender experiencia',
      simpleGoal: 'Mostrar portafolio, pantalla LED, Club Uruguay y tecnologias antes de hablar solo de precio.',
      owner: 'Comercial',
      href: '/presentacion-led/portafolio',
      expectedResult: 'El prospecto entiende que AK vende organizacion, tecnologia y evento completo.',
    },
    {
      order: 3,
      title: 'Cotizar y cerrar',
      simpleGoal: 'Convertir servicios elegidos en presupuesto, plan de pagos y tareas iniciales.',
      owner: 'Comercial / Contable',
      href: '/presupuestos/nuevo',
      expectedResult: 'Presupuesto claro, cliente creado y fiesta lista para planificar.',
    },
    {
      order: 4,
      title: 'Crear fiesta operativa',
      simpleGoal: 'Pasar de venta a produccion: salon, servicios, personal, invitados, agenda, documentos y carga.',
      owner: 'Produccion / Secretaria',
      href: '/fiestas/nueva',
      expectedResult: 'Fiesta con responsable, fechas, pendientes y modulos correctos.',
    },
    {
      order: 5,
      title: 'Activar cliente e invitados',
      simpleGoal: 'Cliente e invitados ven una experiencia simple desde celular.',
      owner: 'Secretaria / Coordinacion',
      href: '/fiestas/nueva/portal-cliente/experiencia-mundial',
      expectedResult: 'Portal cliente, pagina de fiesta, invitacion y RSVP activos.',
    },
    {
      order: 6,
      title: 'Preparar vivo y operacion',
      simpleGoal: 'LED, muro social, musica, cronograma, personal y lista de carga listos antes del evento.',
      owner: 'Coordinador general',
      href: '/fiestas/nueva/en-vivo',
      expectedResult: 'La fiesta puede ejecutarse y mostrarse en pantalla sin improvisacion.',
    },
    {
      order: 7,
      title: 'Cerrar post-fiesta',
      simpleGoal: 'Entregar recuerdos, fotos, feedback, referidos y material reutilizable para futuras ventas.',
      owner: 'Marketing / Post-fiesta',
      href: '/fiestas/nueva/post-evento',
      expectedResult: 'Cliente cerrado, recuerdos entregados y caso listo para portfolio.',
    },
  ],
  pillars: [
    {
      id: 'venta',
      title: 'Venta y conversion',
      simpleGoal: 'Que el prospecto entienda rapido por que AK es diferente.',
      status: 'listo',
      score: 92,
      href: '/presentacion-led/portafolio',
      checks: [
        { label: 'Portafolio LED', detail: 'Ya existe una pantalla de venta adaptable para prospectos.', href: '/presentacion-led/portafolio', priority: 'alta' },
        { label: 'Comercial 360', detail: 'Debe usarse para convertir lead en seguimiento real.', href: '/contabilidad/comercial-360', priority: 'alta' },
        { label: 'Club Uruguay', detail: 'Debe quedar como producto visual fuerte, no solo pagina informativa.', href: '/club-uruguay', priority: 'media' },
      ],
    },
    {
      id: 'fiesta',
      title: 'Comando por fiesta',
      simpleGoal: 'Abrir una fiesta y saber que falta sin recorrer 20 pantallas.',
      status: 'listo',
      score: 90,
      href: '/eventos',
      checks: [
        { label: 'Centro de experiencia', detail: 'Mide cliente, invitados, social, LED, agenda, operacion, visuales y post-fiesta.', href: '/eventos', priority: 'alta' },
        { label: 'Cierre mundial', detail: 'Revisa demo, comunicaciones, vivo, post-fiesta y plan B.', href: '/eventos', priority: 'alta' },
        { label: 'Comando total', detail: 'Nueva capa que une ambos motores en una sola pantalla por fiesta.', href: '/eventos', priority: 'alta' },
      ],
    },
    {
      id: 'cliente',
      title: 'Cliente e invitados',
      simpleGoal: 'Que personas sin conocimiento tecnico puedan usar todo desde celular.',
      status: 'revisar',
      score: 86,
      href: '/fiestas/nueva/portal-cliente/experiencia-mundial',
      checks: [
        { label: 'Portal cliente', detail: 'Tiene que ser la fuente de verdad para pagos, documentos, reuniones e invitados.', href: '/fiestas/nueva/portal-cliente/experiencia-mundial', priority: 'alta' },
        { label: 'Portal invitado', detail: 'Confirmar, guardar fecha y ver datos debe ser simple.', href: '/fiestas/nueva/modulo-invitado', priority: 'alta' },
        { label: 'Pagina de fiesta', detail: 'Debe verse como invitacion premium, no como formulario.', href: '/fiestas/nueva/pagina-web', priority: 'media' },
      ],
    },
    {
      id: 'visual',
      title: 'Biblioteca visual',
      simpleGoal: 'Una foto debe poder servir para web, invitacion, LED, portfolio, Club Uruguay o caso real.',
      status: 'revisar',
      score: 82,
      href: '/settings/biblioteca-visual-ak',
      checks: [
        { label: 'Usos definidos', detail: 'Nueva pantalla muestra donde cargar cada tipo de imagen.', href: '/settings/biblioteca-visual-ak', priority: 'alta' },
        { label: 'Casos reales', detail: 'Faltan mas casos reales con fotos y servicios usados.', href: '/empresa/galeria', priority: 'media' },
        { label: 'LED y portfolio', detail: 'Las imagenes de venta deben diferenciarse de las de recuerdos.', href: '/galeria-led', priority: 'media' },
      ],
    },
    {
      id: 'google',
      title: 'Google, mail y recordatorios',
      simpleGoal: 'Enviar solo avisos utiles y sincronizar reuniones/eventos importantes.',
      status: 'revisar',
      score: 84,
      href: '/settings/google-workspace',
      checks: [
        { label: 'Calendar', detail: 'Reuniones, personal y evento deben poder verse en calendario.', href: '/settings/google-workspace', priority: 'alta' },
        { label: 'Gmail', detail: 'Debe usarse para recordatorios formales, no para saturar.', href: '/settings/google-workspace', priority: 'alta' },
        { label: 'WhatsApp fallback', detail: 'WhatsApp queda como canal rapido, no como unica fuente de informacion.', href: '/settings/whatsapp-business', priority: 'media' },
      ],
    },
    {
      id: 'estabilidad',
      title: 'Estabilidad Firebase',
      simpleGoal: 'Evitar PR que fallen por rutas, imports o tipos.',
      status: 'revisar',
      score: 80,
      href: '/settings/cierre-global-producto',
      checks: [
        { label: 'Rutas visibles', detail: 'Todo modulo nuevo debe tener entrada visible.', href: '/settings/cierre-global-producto', priority: 'alta' },
        { label: 'Capa nueva sin tocar datos criticos', detail: 'Esta PR agrega pantallas y lectura, no cambia persistencia sensible.', href: '/settings/cierre-global-producto', priority: 'alta' },
        { label: 'Build Firebase', detail: 'La validacion final depende de App Hosting porque el entorno local no ejecuta node/npm.', href: '/settings/cierre-global-producto', priority: 'alta' },
      ],
    },
  ],
  visualLibrary: [
    {
      title: 'Fotos de venta',
      whereItShows: 'Web publica, portafolio LED, Club Uruguay y simuladores.',
      href: '/empresa/galeria',
      requiredAssets: ['salon armado', 'pista con luces', 'mesa decorada', 'servicios premium'],
    },
    {
      title: 'Fotos por fiesta',
      whereItShows: 'Portal cliente, invitacion, pagina de fiesta y post-fiesta.',
      href: '/fiestas/nueva/fotografia',
      requiredAssets: ['portada', 'familia/protagonista', 'decoracion', 'momentos principales'],
    },
    {
      title: 'Pantalla LED',
      whereItShows: 'Presentacion LED, muro social, en vivo y cierre comercial.',
      href: '/galeria-led',
      requiredAssets: ['fondos 16:9', 'placas de servicios', 'fotos destacadas', 'contenido social moderado'],
    },
    {
      title: 'Club Uruguay',
      whereItShows: 'Pagina publica, diseño de salon, portfolio y venta de salon exclusivo.',
      href: '/club-uruguay',
      requiredAssets: ['fachada', 'salon vacio', 'salon armado', 'mesas', 'pista', 'recorrido/video'],
    },
    {
      title: 'Casos reales',
      whereItShows: 'Portfolio comercial, redes, ventas futuras y post-fiesta.',
      href: '/fiestas/nueva/post-evento',
      requiredAssets: ['antes/despues', 'servicios contratados', 'resultado final', 'testimonio'],
    },
  ],
  nextPracticalActions: [
    { label: 'Usar Comando Total en cada fiesta activa', detail: 'Abrir desde Post #445 cuando haya fiestaId y cerrar pendientes de prioridad alta.', href: '/eventos', priority: 'alta' },
    { label: 'Cargar fotos reales por caso', detail: 'El portfolio ya puede vender con ejemplos, pero necesita casos AK reales.', href: '/settings/biblioteca-visual-ak', priority: 'alta' },
    { label: 'Probar una fiesta completa de punta a punta', detail: 'Lead, presupuesto, fiesta, cliente, invitados, LED, social y post-fiesta.', href: '/settings/cierre-global-producto', priority: 'alta' },
    { label: 'Activar Google con criterio', detail: 'Reuniones, pagos, personal e invitados solo cuando aportan valor real.', href: '/settings/google-workspace', priority: 'media' },
  ],
};

export function getProductLaunchPlan() {
  return productLaunchPlan;
}
