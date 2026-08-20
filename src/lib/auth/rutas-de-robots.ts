/**
 * Las direcciones que sólo piden los robots, y que acá no existen.
 *
 * Cualquier página que esté en internet recibe programas automáticos todo el día
 * probando puertas de otros sistemas: WordPress, phpMyAdmin, archivos de
 * configuración con contraseñas adentro. Ninguna de esas cosas existe en esta
 * aplicación, pero cada intento igual despertaba al servidor, lo mandaba a la
 * pantalla de ingreso y quedaba anotado como error, tapando los errores de verdad.
 *
 * Con esta lista se les contesta "no existe" en el acto, sin trabajo de por medio.
 *
 * **Regla al tocar esto:** antes de agregar algo, mirá que no sea el comienzo de una
 * dirección real de la aplicación. Bloquear de más deja al cliente afuera, que es
 * peor que el robot. La prueba `robots-que-no-entran.test.ts` cuida las dos puntas.
 */

/** Comienzos de dirección que se cortan de una. */
const COMIENZOS_DE_ROBOT = [
  '/wp-admin',
  '/wp-includes',
  '/wp-content',
  '/wp-login',
  '/wordpress',
  '/phpmyadmin',
  '/phpMyAdmin',
  '/pma/',
  '/mysql',
  '/vendor/',
  '/cgi-bin',
  '/.env',
  '/.git',
  '/.aws',
  '/.svn',
  '/.vscode',
  '/.ssh',
  '/autodiscover',
  '/owa/',
  '/telescope/',
  '/solr/',
  '/actuator',
  '/backup',
  '/shell',
  '/boaform',
  '/hudson',
  '/jenkins',
  '/xmlrpc',
  '/eval-stdin',
  '/aws.yml',
  '/docker-compose',
] as const;

/** Terminaciones de archivo de otras tecnologías: acá no hay ninguna. */
const TERMINACIONES_DE_ROBOT = [
  '.php',
  '.php7',
  '.phtml',
  '.asp',
  '.aspx',
  '.jsp',
  '.cgi',
  '.env',
  '.sql',
  '.bak',
  '.old',
] as const;

export function esPedidoDeRobot(pathname: string): boolean {
  const ruta = pathname.toLowerCase();
  if (COMIENZOS_DE_ROBOT.some((p) => ruta === p.toLowerCase() || ruta.startsWith(p.toLowerCase()))) {
    return true;
  }
  return TERMINACIONES_DE_ROBOT.some((t) => ruta.endsWith(t));
}
