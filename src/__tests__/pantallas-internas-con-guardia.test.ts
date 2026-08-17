/**
 * Toda pantalla interna tiene que estar detras de `AuthGuard`.
 *
 * Por que no alcanza con el middleware: protege todo lo que no este en la lista
 * publica, pero **solo comprueba que exista la cookie de sesion, no que sea
 * valida** — no puede leer el secreto para verificar la firma. Quien valida de
 * verdad es `AuthGuard`, en el navegador.
 *
 * Las pantallas de `/admin/finanzas` y `/admin/ventas` quedaron fuera del grupo
 * `(app)`, que es donde vive esa guardia, y por eso entraban con una cookie
 * inventada: se veia la plata de todas las fiestas y se podia mover el embudo.
 */
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';

const APP_DIR = join(process.cwd(), 'src/app');

function tieneGuardia(carpeta: string): boolean {
  const layout = join(APP_DIR, carpeta, 'layout.tsx');
  if (!existsSync(layout)) return false;
  return readFileSync(layout, 'utf-8').includes('AuthGuard');
}

describe('Las pantallas internas están detrás de la guardia', () => {
  it('/admin tiene su propia guardia, porque vive fuera del grupo protegido', () => {
    expect(tieneGuardia('admin')).toBe(true);
  });

  it('el grupo (app) sigue teniendo la suya', () => {
    expect(tieneGuardia('(app)')).toBe(true);
  });

  it('/admin no está en la lista de rutas públicas', () => {
    // Si alguien lo agregara ahi, el middleware lo dejaria pasar sin cookie y la
    // guardia de arriba no llegaria a correr.
    expect(isPublicPathPrefix('/admin/finanzas')).toBe(false);
    expect(PUBLIC_EXACT_PATHS.has('/admin')).toBe(false);
  });

  // Todas las pantallas del equipo que viven fuera del grupo `(app)` y por eso
  // necesitan su propia guardia. Si se agrega una nueva, va a esta lista.
  const PANTALLAS_DEL_EQUIPO_FUERA_DEL_GRUPO = [
    'admin',
    'analytics',
    'compras',
    'control-tower',
    'marketing',
    'post-fiesta',
    'recepcion',
    'recursos-multi-evento',
    'secretaria-ak',
  ];

  it.each(PANTALLAS_DEL_EQUIPO_FUERA_DEL_GRUPO)('/%s tiene su guardia', (carpeta) => {
    expect(tieneGuardia(carpeta)).toBe(true);
  });

  it('ninguna de ellas quedó declarada como pública por error', () => {
    // Si alguna se agregara a la lista publica, el middleware la dejaria pasar
    // sin cookie y la guardia ni llegaria a correr.
    const publicadasPorError = PANTALLAS_DEL_EQUIPO_FUERA_DEL_GRUPO
      .filter((carpeta) => isPublicPathPrefix(`/${carpeta}`));

    expect(publicadasPorError).toEqual([]);
  });

  it('las carpetas de esa lista existen de verdad', () => {
    // Cuida que la lista no se quede hablando de pantallas que ya no estan.
    const inexistentes = PANTALLAS_DEL_EQUIPO_FUERA_DEL_GRUPO
      .filter((carpeta) => !existsSync(join(APP_DIR, carpeta)));

    expect(inexistentes).toEqual([]);
  });
});
