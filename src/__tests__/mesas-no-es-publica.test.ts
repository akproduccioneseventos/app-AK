import { isPublicPathPrefix } from '@/lib/auth/public-paths';

/**
 * Agujero real que motivo esta prueba: `/portal` es publico porque ahi vive el
 * portal del invitado, y la distribucion de mesas quedo colgando de ese mismo
 * prefijo. Pero mesas es una herramienta del EQUIPO, enlazada desde el
 * planificador.
 *
 * Resultado: cualquiera que pusiera `/portal/mesas?fiestaId=...` veia la lista
 * entera de invitados de esa fiesta, con sus datos, sin estar logueado.
 * `getFiestaById` sin sesion solo borra la clave de acceso, pero devuelve todo
 * lo demas.
 *
 * Si alguien vuelve a sacar mesas de las rutas protegidas, esta prueba lo frena.
 */

describe('la distribucion de mesas no es publica', () => {
  it('mesas queda afuera de lo publico aunque cuelgue de /portal', () => {
    expect(isPublicPathPrefix('/portal/mesas')).toBe(false);
    expect(isPublicPathPrefix('/portal/mesas/')).toBe(false);
  });

  it('el portal del invitado sigue siendo publico', () => {
    expect(isPublicPathPrefix('/portal')).toBe(true);
    expect(isPublicPathPrefix('/portal/c/CLAVE123')).toBe(true);
  });

  it('las otras pantallas del equipo siguen protegidas', () => {
    expect(isPublicPathPrefix('/evento/actual/checkin')).toBe(false);
    expect(isPublicPathPrefix('/evento/dj/fiesta_1')).toBe(false);
    expect(isPublicPathPrefix('/evento/en-vivo/fiesta_1/organizador')).toBe(false);
  });

  it('las estaciones del invitado siguen abiertas', () => {
    expect(isPublicPathPrefix('/evento/zona-digital')).toBe(true);
    expect(isPublicPathPrefix('/invitacion/fiesta_1')).toBe(true);
  });
});
