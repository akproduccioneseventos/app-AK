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
};

function archivosDeServidor(): string[] {
  const salida: string[] = [];
  const recorrer = (carpeta: string) => {
    for (const e of fs.readdirSync(path.join(RAIZ, carpeta), { withFileTypes: true })) {
      const r = path.join(carpeta, e.name);
      if (e.isDirectory()) recorrer(r);
      else if (/\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name)) {
        const texto = fs.readFileSync(path.join(RAIZ, r), 'utf8');
        if (/^\s*['"]use server['"]/m.test(texto.slice(0, 400))) salida.push(r);
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

    const comprueba = new RegExp([
      'requireAppSession', 'requireAdminSession', 'requireSession',
      'verifySession', 'verifyPortalSession', 'verifyPassword', 'verifyIdToken',
      'verifyEntertainmentAccessToken', 'verifyHash', 'verifyValue',
      'requirePermiso', 'verificarAcceso',
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
 * Quedan 84 funciones repartidas en 44 archivos que todavía **no se revisaron una
 * por una**. Empezaron siendo 247 en 98 archivos: el 20 de agosto se cerraron 150
 * de una vez, todas las que ninguna pantalla pública alcanza. No significa que estén todas mal: la mayoría son de leer, y varias se
 * protegen de formas que este control no reconoce. Significa que **nadie las miró
 * con esta lupa todavía**.
 *
 * Para qué sirve congelarlas: desde hoy, **cualquier función NUEVA que quede
 * abierta hace fallar la prueba**. La lista vieja se va vaciando de a poco, y no se
 * agranda nunca.
 *
 * Cuando revises una y la protejas (o confirmes que es pública a propósito),
 * sacala del archivo. Si sacás una y la prueba sigue en verde, quedó bien.
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
      const base = path.basename(archivo);
      if (PUBLICAS_A_PROPOSITO[base]) continue;
      const yaConocidas = new Set(conocidas[archivo] ?? []);
      for (const fn of funcionesSinControl(archivo)) {
        if (FUNCIONES_PUBLICAS_A_PROPOSITO[`${base}:${fn}`]) continue;
        if (!yaConocidas.has(fn)) nuevas.push(`${archivo} -> ${fn}`);
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
    // Si revisaste y protegiste alguna, bajá este numero. Nunca lo subas.
    expect(total).toBeLessThanOrEqual(84);
  });
});
