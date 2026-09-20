/**
 * MATAFUEGO — Al mandar a alguien a la pantalla de ingreso, la direccion completa
 * tiene que viajar entera, con lo que venia despues del "?".
 *
 * Paso el 20 de septiembre de 2026: el portero guardaba solo la ruta
 * (`/fiestas/nueva/regalos`) y tiraba el `?fiestaId=...`. Al volver del ingreso,
 * la pantalla abria sin fiesta: la lista de regalos se quedaba con la rueda girando
 * para siempre y no decia nada. Se veia igual en cualquier pantalla que se abre
 * con la fiesta en la direccion.
 *
 * Se probo rompiendolo a proposito: volviendo a guardar solo el pathname, esta
 * prueba se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const MIDDLEWARE = fs.readFileSync(path.join(process.cwd(), 'src', 'middleware.ts'), 'utf-8');

describe('Al volver del ingreso no se pierde la fiesta', () => {
  it('el portero manda al ingreso la direccion con lo que venia despues del "?"', () => {
    const linea = MIDDLEWARE.split('\n').find((l) => l.includes("searchParams.set('redirect'"));
    expect(linea).toBeDefined();
    expect(linea).toMatch(/search/);
  });

  it('la vuelta del ingreso respeta la direccion tal cual, con su "?"', async () => {
    const { sanitizeAppRedirect } = await import('@/lib/auth/redirect');
    expect(sanitizeAppRedirect('/fiestas/nueva/regalos?fiestaId=abc123')).toBe(
      '/fiestas/nueva/regalos?fiestaId=abc123',
    );
    // Y lo de afuera sigue sin poder colarse.
    expect(sanitizeAppRedirect('//otro-sitio.com')).toBe('/');
    expect(sanitizeAppRedirect('https://otro-sitio.com')).toBe('/');
  });
});
