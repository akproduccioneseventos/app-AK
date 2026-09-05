import { PUBLIC_PATH_PREFIXES } from '@/lib/auth/public-paths';

/**
 * El invitado tiene que poder abrir el album con el enlace, sin cuenta.
 *
 * **Es el regalo final del cliente**, y hasta el 2 de septiembre de 2026 era la
 * unica pantalla del evento que pedia iniciar sesion: la galeria, el muro y las
 * seis estaciones ya eran publicas. El invitado tocaba el enlace y caia en el
 * login.
 *
 * Queda vigilado porque es de los errores que **no se notan hasta la fiesta**:
 * todo compila, todo anda para el equipo -que si tiene cuenta- y el unico que
 * se topa con la pared es el invitado.
 */

describe('el album del recuerdo', () => {
  it('se abre con el enlace, sin pedir cuenta', () => {
    expect(PUBLIC_PATH_PREFIXES).toContain('/evento/album');
  });

  it('sigue acompanado de la galeria, que ya era publica', () => {
    // Si alguien cierra las dos de una, esto lo agarra igual.
    expect(PUBLIC_PATH_PREFIXES).toContain('/evento/galeria');
  });
});
