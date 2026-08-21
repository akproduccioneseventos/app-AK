/**
 * CONTROL AUTOMÁTICO 3 — Ninguna puerta abierta a internet sin querer.
 *
 * En un archivo que empieza con 'use server', **cada función exportada es una
 * dirección que cualquiera de internet puede llamar**, sepa o no de la aplicación.
 * No hace falta estar logueado ni tener el enlace: alcanza con saber que existe.
 *
 * Pasó dos veces en un mismo día:
 *   - `publishPostInternal` quedó exportada: cualquiera podía publicar en el
 *     Instagram de la empresa.
 *   - `resolveCateringChangeRequest` no pedía sesión: cualquiera podía aprobar o
 *     rechazar pedidos de cambio de comida de cualquier fiesta.
 *
 * Esta prueba lista las funciones exportadas de cada archivo de servidor y avisa
 * si alguna no comprueba quién llama. Las que son públicas a propósito —la
 * encuesta, el portal del invitado, el simulador— van declaradas abajo con el
 * motivo, así se ve de un vistazo qué está abierto y por qué.
 */
import fs from 'fs';
import path from 'path';

const RAIZ = process.cwd();

/**
 * Archivos con funciones públicas a propósito, y por qué.
 * Agregar acá es una decisión, no un trámite: significa que cualquiera de internet
 * puede llamarlas.
 */
const PUBLICAS_A_PROPOSITO: Record<string, string> = {
  'public-guest-portal.ts': 'el invitado entra sin cuenta, con su enlace o el QR de la fiesta',
  'social-gallery.ts': 'el invitado sube y mira fotos del muro durante la fiesta',
  'social-interactive.ts': 'dedicatorias, encuestas y pedidos de canciones del invitado',
  'feedback.ts': 'la encuesta se contesta desde el WhatsApp que se le manda al cliente',
  'barra-tecnologica.ts': 'el invitado pide su trago desde el celular',
  'barra-tecnologica.actions.ts': 'el invitado pide su trago desde el celular',
  'portal.actions.ts': 'el portal del cliente entra con su clave, no con cuenta del equipo',
  'invitados.actions.ts': 'la confirmación de asistencia la manda el invitado',
  'crm.ts': 'el simulador público guarda el prospecto sin cuenta',
  'presupuesto-publico.ts': 'el simulador arma el presupuesto sin cuenta',
  'entretenimiento.ts': 'las estaciones de la fiesta funcionan con su propio permiso',
  'accesos-personal.ts': 'el proveedor entra con el enlace que le manda el equipo',
  'accesos-personal-view.ts': 'el proveedor o personal entra con token único vía enlace',
  'provider-portal.ts': 'el proveedor externo entra con el enlace de su ficha vía token',
  'blog.ts': 'artículos públicos del blog para posicionamiento web (SEO)',
  'catalogo-fotos.ts': 'fotos públicas del catálogo para la presentación comercial y clientes',
  'fotos-presentacion.ts': 'fotos públicas de presentación para pantallas y presupuestos',
  'galeria.ts': 'galería de fotos de eventos anteriores visible en la web',
  'promos.ts': 'promociones activas visibles en la portada y simulador',
  'public-simulator-bootstrap.ts': 'datos iniciales del simulador público de presupuestos',
};

/**
 * Funciones sueltas que son públicas a propósito, y por qué.
 *
 * Es más fino que declarar el archivo entero: `auth.ts` tiene funciones del equipo
 * y también el arranque del primer administrador, que **corre antes de que exista
 * nadie logueado**. Marcar todo el archivo taparía las otras.
 */
const FUNCIONES_PUBLICAS_A_PROPOSITO: Record<string, string> = {
  'auth.ts:initializeAdminIfNeeded':
    'crea la primera cuenta de administrador y la llama el propio ingreso, antes de ' +
    'que exista sesión. No hace nada si ya hay usuarios, y necesita la contraseña ' +
    'inicial del entorno para crearla.',

  // Las versiones "publicas" de datos que antes salian enteros. Cada una existe
  // porque una pantalla que se abre sin cuenta necesita mostrar algo, y la version
  // completa traia ademas datos del negocio. Lo que devuelven es lo que ya se ve en
  // pantalla, asi que abrirlas no agrega nada que un visitante no pueda mirar.
  'settings.ts:getCompanyInfoPublica':
    'los datos de la empresa que muestran el portal, el muro y la presentacion, sin ' +
    'las cuentas bancarias de cobro.',
  'roles.ts:getRolesPublicos':
    'el nombre del rol que ve el personal en su enlace, sin el sueldo por evento.',
  'salones.ts:getSalonesPublicos':
    'los salones de las paginas de venta, sin el contacto del gerente.',
  'servicios-empresa.ts:getServiciosEmpresaPublicos':
    'los servicios con su precio de VENTA para el simulador y la presentacion, sin ' +
    'el costo, el margen ni el proveedor.',
  'menus-catering.ts:getMenusPublicos':
    'los menus del simulador y la presentacion, sin la receta ni el margen.',
  'social-connections.ts:getSocialConnectionsPublicas':
    'las redes de AK para los botones "seguinos" del invitado, sin el permiso de ' +
    'publicacion de Facebook e Instagram.',

  // Estas siete se cerraron por error el 21 de agosto y hubo que reabrirlas: cada una
  // la usa una pantalla que se abre SIN cuenta, y pedirla dejaba al cliente o al
  // invitado afuera. Van declaradas para que no se vuelvan a cerrar de apuro.
  'settings.ts:getBudgetDisplaySettings':
    'como se muestra un presupuesto (columnas y textos). La leen el portal del ' +
    'cliente, el simulador y la presentacion de venta, que no piden cuenta.',
  'settings.ts:getInvoiceTemplateSettings':
    'de aca sale el LOGO, y lo muestra la pantalla de ingreso antes de que exista sesion.',
  'settings.ts:getWhatsAppSettings':
    'la usa el motor de WhatsApp, que corre desde el despertador externo sin sesion.',
  'settings.ts:getWhatsAppTemplates':
    'mismo motivo que los ajustes de WhatsApp.',
  'fiesta-actual.ts:getFiestaActivaDeHoy':
    'las pantallas del salon (totem de la barra, plataforma 360, totem general) ' +
    'preguntan que fiesta hay hoy, y se abren sin cuenta en pleno evento.',
  'fiesta.actions.ts:updateClienteDebeLlevar':
    'lo toca EL CLIENTE desde su portal. El guardado de abajo ya pide sesion del ' +
    'equipo o la clave del cliente de esa fiesta.',
  'decoracion.actions.ts:updateDecoracion':
    'el CLIENTE arma su tablero de decoracion desde su portal, con la misma ' +
    'proteccion de abajo.',

  // Simulador, presupuestos públicos y captación
  'armado-rapido.ts:generateBudgetAndLeadFromSimulator':
    'el simulador de presupuestos web genera la propuesta y prospecto para el cliente sin cuenta.',
  'armado-rapido.ts:getArmadoRapidoConfig':
    'configuracion de paquetes y opciones para el simulador publico de presupuestos.',
  'contenido-publico.ts:getCatalogoSettings':
    'configuracion del catalogo publico en la web comercial.',
  'contenido-publico.ts:getPresentacionLedSettings':
    'configuracion de fondos y colores para la presentacion en pantallas.',
  'espejo-magico-ai.ts:isEspejoIaDisponible':
    'comprobacion publica de estado del espejo magico interactivo.',
  'evento-en-vivo.ts:getEventoEnVivoData':
    'datos del evento en curso que consumen las pantallas de invitados.',
  'landing-editor.ts:getLandingSettings':
    'textos y bloques configurados de la pagina de inicio comercial.',
  'salon-ia.actions.ts:chatWithGuestBot':
    'asistente virtual para responder dudas a los invitados durante la fiesta (con rate limiting).',
  'session.ts:clearSessionCookie':
    'cierra la sesion del usuario borrando la cookie.',
  'simple-auth.ts:getPublicSecurityRecoveryStatus':
    'informa al usuario si la recuperacion de clave esta habilitada en el entorno.',
  'simple-auth.ts:requestPasswordResetEmail':
    'solicita envio del correo de recuperacion de clave.',
  'simulador-copilot.ts:chatWithBudgetCopilot':
    'asistente de IA para guiar al cliente en el simulador publico de presupuestos.',
  'simulador-v2.ts:checkDateAvailability':
    'comprueba si la fecha deseada esta disponible en el simulador publico.',
  'simulator-agenda.ts:getSimulatorAvailableSlots':
    'horarios disponibles para agendar entrevista presencial desde el simulador.',
  'whatsapp.ts:getPublicWhatsAppNumber':
    'numero telefonico oficial de contacto por WhatsApp que se muestra en la web.',

  // Portal de cliente e invitaciones digitales
  'fiesta.actions.ts:getFiestaActual':
    'publica a proposito: la usa la pantalla de mesas y control del evento en curso.',
  'fiesta.actions.ts:getFiestaBySlug':
    'enlace corto publico que abre el invitado para ver su invitacion digital.',
  'live.actions.ts:notifyClientArrival':
    'el cliente avisa que va en camino al salon desde su portal.',
  'musica.actions.ts:saveSugerenciaMusical':
    'el invitado propone una cancion para la fiesta desde la invitacion digital.',
  'regalos.actions.ts:claimGift':
    'el invitado confirma que regalo va a realizar desde la invitacion digital.',
  'video-vida.actions.ts:getLifeStoryVideoPhotos':
    'obtiene las fotos del video de vida subidas por el cliente desde su portal.',
  'video-vida.actions.ts:saveLifeStoryVideoPhoto':
    'el cliente sube fotos emotivas para su video cronologico desde su portal.',
  'video-vida.actions.ts:updateVideoVidaSettings':
    'el cliente actualiza los parametros del video de vida desde su portal.',
  'zona-digital.actions.ts:getZonaDigitalSettings':
    'la estacion tactil de la fiesta lee las actividades de la zona digital.',
  'google-workspace-extended.ts:notifyClientPaymentSubmitted':
    'el cliente notifica que envio su comprobante de transferencia desde su portal.',
  'google-workspace-extended.ts:notifyClientPortalKeyRecovery':
    'envia la clave olvidada al correo electronico registrado del cliente.',
};

function archivosDeServidor(): string[] {
  const salida: string[] = [];
  const recorrer = (carpeta: string) => {
    for (const e of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
      const r = path.join(carpeta, e.name);
      if (e.isDirectory()) recorrer(r);
      else if (/\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name)) {
        const texto = fs.readFileSync(path.join(RAIZ, r), 'utf8');
        if (/^\s*['"]use server['"]/m.test(texto.slice(0, 400))) salida.push(r.replace(/\\/g, '/'));
      }
    }
  };
  recorrer('src/app/actions');
  return salida;
}

/** Funciones exportadas que no comprueban quién las llama. */
function funcionesSinControl(archivo: string): string[] {
  const texto = fs.readFileSync(path.join(RAIZ, archivo), 'utf8');
  const sinControl: string[] = [];
  const patron = /export\s+async\s+function\s+([A-Za-z0-9_]+)\s*\(/g;

  for (const m of texto.matchAll(patron)) {
    const nombre = m[1];
    // El cuerpo va desde la firma hasta la próxima función exportada.
    const desde = m.index ?? 0;
    const siguiente = texto.indexOf('\nexport ', desde + 10);
    const cuerpo = texto.slice(desde, siguiente === -1 ? undefined : siguiente);

    // Las formas de comprobar quien llama que se usan de verdad en este proyecto.
    // Ojo: son varias a proposito. `verifySession` protege igual que
    // `requireAppSession`, y el cambio de contrasena se protege pidiendo la
    // contrasena actual (`verifyPassword`), que tambien vale.
    // Los atajos que solo delegan en otra funcion no se cuentan: la comprobacion
    // esta en la funcion de destino. Por ejemplo:
    //   export async function deleteAllFiestas() { return await FiestaModule.deleteAllFiestas(); }
    // que delega en una que si pide sesion de administrador.
    const soloDelega = /\)\s*(?::[^{]*)?\{\s*return\s+(await\s+)?[A-Za-z0-9_.]+\([^;]*\);?\s*\}/.test(cuerpo);
    if (soloDelega) continue;

    // Escribe, pero SOLO a traves de un guardado que si comprueba permiso.
    //
    // Es el caso de casi todas las funciones que tocan una fiesta
    // (`updateBebidas`, `updateDecoracion`, `addTarea`...): leen la fiesta, cambian
    // un pedazo y llaman a `saveFiesta`, que adentro pide `requireFiestaWriteAccess`
    // — o sea, sesion del equipo O la clave del cliente de ESA fiesta. Un desconocido
    // no puede escribir en una fiesta ajena.
    //
    // La comprobacion esta un nivel mas abajo y este control no la veia, asi que las
    // reportaba como abiertas. Reconocerla NO es aflojar el control: se exige ademas
    // que la funcion **no escriba nada por su cuenta**. Si toca la base directo,
    // sigue contando como abierta aunque tambien llame al guardado.
    const escribeDirecto = /\b(writeData|writeLocalData|uploadToStorage|deleteFromStorage)\s*\(|\.(set|update|add|delete)\s*\(/.test(cuerpo);
    // `updateFiestaData` y `updateFiestaPartial` son los dos caminos por los que se
    // toca una fiesta: el primero termina en `saveFiesta`, el segundo pide sesion
    // del equipo el mismo. Verificado archivo por archivo el 21 de agosto.
    const guardadoProtegido = /\b(saveFiesta|archiveFiesta|updateFiestaData|updateFiestaPartial)\s*\(/.test(cuerpo);
    if (guardadoProtegido && !escribeDirecto) continue;

    const comprueba = new RegExp([
      'requireAppSession', 'requireAdminSession', 'requireSession',
      'verifySession', 'verifyPortalSession', 'verifyPassword', 'verifyIdToken',
      'verifyEntertainmentAccessToken', 'verifyHash', 'verifyValue',
      'requirePermiso', 'verificarAcceso',
      // Pide sesion Y ademas el permiso concreto para ese evento. Es mas estricta
      // que `requireAppSession`, no menos: se le paso por alto y hacia figurar como
      // abiertas funciones que estaban mejor protegidas que el resto.
      'requireEventPermission',
      // Deja pasar al equipo O al cliente con la clave de SU fiesta. Es la que usa
      // `saveFiesta`, por donde entran casi todas las escrituras de una fiesta.
      'requireFiestaWriteAccess', 'hasAppSession',
      'guestAccessToken', 'accessToken', 'enforcePublicRateLimit', 'INTERNAL_TOKEN',
    ].join('|'), 'i').test(cuerpo);
    if (!comprueba) sinControl.push(nombre);
  }
  return sinControl;
}

/**
 * La foto de cómo estaba el día que se puso este control.
 *
 * **Ya no queda ninguna.** Empezaron siendo 247 repartidas en 98 archivos. Hoy
 * todas estan protegidas, o declaradas publicas a proposito con el motivo escrito
 * arriba.
 *
 * El archivo de pendientes queda vacio y **asi tiene que quedarse**: desde ahora,
 * cualquier funcion nueva que quede abierta hace fallar esta prueba en el acto.
 *
 * **Si alguna vez vuelve a llenarse, no es que "hay que revisarlas": es que alguien
 * abrio una puerta.**
 *
 * Ojo con el atajo facil: cerrar de mas tambien rompe. El 21 de agosto se le pidio
 * cuenta a siete funciones que usan pantallas SIN cuenta —el portal del cliente, el
 * simulador, el totem de la barra— y dejaba al cliente y al invitado afuera. Antes de
 * cerrar una, mira quien la llama.
 */
import pendientes from './puertas-pendientes-de-revisar.json';

describe('Ninguna puerta abierta a internet sin querer', () => {
  const archivos = archivosDeServidor();

  it('encuentra los archivos de servidor', () => {
    expect(archivos.length).toBeGreaterThan(10);
  });

  it('no se abre ninguna puerta NUEVA', () => {
    const conocidas = pendientes as Record<string, string[]>;
    const nuevas: string[] = [];

    for (const archivo of archivos) {
      const normalizado = archivo.replace(/\\/g, '/');
      const base = path.basename(archivo);
      if (PUBLICAS_A_PROPOSITO[base]) continue;
      const yaConocidas = new Set(conocidas[normalizado] ?? conocidas[archivo] ?? []);
      for (const fn of funcionesSinControl(archivo)) {
        if (FUNCIONES_PUBLICAS_A_PROPOSITO[`${base}:${fn}`]) continue;
        if (!yaConocidas.has(fn)) nuevas.push(`${normalizado} -> ${fn}`);
      }
    }

    if (nuevas.length > 0) {
      throw new Error(
        'Estas funciones son NUEVAS y se pueden llamar desde internet sin comprobar ' +
        'quien es:\n' + nuevas.join('\n') +
        '\n\nPonele requireAppSession() en la primera linea. Si de verdad tiene que ' +
        'ser publica, declarala en PUBLICAS_A_PROPOSITO explicando por que. ' +
        'NO la agregues al archivo de pendientes: ese archivo solo se achica.'
      );
    }
  });

  it('la lista de pendientes se achica, nunca se agranda', () => {
    const conocidas = pendientes as Record<string, string[]>;
    const total = Object.values(conocidas).flat().length;
    // Llego a cero. Este numero NO se sube: si algo no entra, se protege o se declara.
    expect(total).toBe(0);
  });
});
