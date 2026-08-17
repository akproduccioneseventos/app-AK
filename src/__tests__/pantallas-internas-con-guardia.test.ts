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

  it('no aparecieron pantallas internas nuevas sin guardia', () => {
    // Carpetas de primer nivel que tienen pantallas y NO son publicas: cada una
    // tiene que estar cubierta por su propio layout con guardia.
    const sinGuardia = readdirSync(APP_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((nombre) => nombre === 'admin' || nombre === '(app)')
      .filter((nombre) => !tieneGuardia(nombre));

    expect(sinGuardia).toEqual([]);
  });
});
