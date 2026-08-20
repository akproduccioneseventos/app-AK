import { esPedidoDeRobot } from '@/lib/auth/rutas-de-robots';
import { PUBLIC_PATH_PREFIXES } from '@/lib/auth/public-paths';

/**
 * El filtro que corta a los robots no puede dejar afuera a una persona.
 *
 * Ese es el riesgo real de esta lista: bloquear de más deja al cliente o al invitado
 * mirando un "no existe" en plena fiesta, que es mucho peor que el robot.
 */
describe('Los robots no entran, las personas sí', () => {
  const pedidosDeRobot = [
    '/wp-admin',
    '/wp-admin/setup-config.php',
    '/wp-login.php',
    '/wordpress/wp-admin',
    '/phpmyadmin/index.php',
    '/.env',
    '/.env.local',
    '/.git/config',
    '/.ssh/id_rsa',
    '/vendor/phpunit/phpunit/phpunit.xml',
    '/cgi-bin/test.cgi',
    '/backup.sql',
    '/config.php',
    '/index.asp',
    '/admin.aspx',
    '/telescope/requests',
    '/actuator/health',
    '/xmlrpc.php',
  ];

  it.each(pedidosDeRobot)('corta %s', (ruta) => {
    expect(esPedidoDeRobot(ruta)).toBe(true);
  });

  it('ninguna pantalla pública declarada queda bloqueada', () => {
    const bloqueadas = PUBLIC_PATH_PREFIXES.filter((ruta) => esPedidoDeRobot(ruta));
    expect(bloqueadas).toEqual([]);
  });

  const pantallasDeVerdad = [
    '/',
    '/login',
    '/invitacion/fiesta-123',
    '/invitacion/fiesta-123/invitado/inv-9',
    '/portal/c/clave-secreta',
    '/portal-cliente/fiesta-123',
    '/evento/barra/fiesta-123',
    '/evento/muro-en-vivo/fiesta-123',
    '/evento/fotocabina/fiesta-123',
    '/evento/espejo-magico/fiesta-123',
    '/feedback/fiesta-123',
    '/simulador-ak',
    '/simulador-de-presupuesto',
    '/q/fiesta-123',
    '/i/mi-fiesta',
    '/bodas',
    '/quinceaneras',
    '/cumpleanos',
    '/catalogo/bodas',
    '/presentacion-led',
    '/galeria-led',
    '/club-uruguay',
    '/proveedor/acceso/token-123',
    '/acceso-personal/token-123',
    '/video-vida/fiesta-123',
    '/pago/fiesta-123',
    '/admin',
    '/album',
    '/marketing/demo-tecnologia',
    '/personal',
    '/prospectos',
    '/compras',
    '/recepcion',
    '/post-fiesta',
    '/api/health',
    '/sitemap.xml',
    '/robots.txt',
  ];

  it.each(pantallasDeVerdad)('deja pasar %s', (ruta) => {
    expect(esPedidoDeRobot(ruta)).toBe(false);
  });
});
