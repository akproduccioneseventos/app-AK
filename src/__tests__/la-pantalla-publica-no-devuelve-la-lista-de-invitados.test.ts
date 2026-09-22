/**
 * MATAFUEGO — La pantalla publica de la invitacion NO devuelve la lista de invitados.
 *
 * Lo encontro Codex el 22 de setiembre de 2026, y es lo mas grave de esa revision.
 *
 * Las funciones que tocan un invitado guardaban con un ayudante que devuelve **la fiesta
 * entera**: todos los invitados con sus telefonos y sus alergias, la mesa de cada uno, los
 * datos del cliente, lo interno de la fiesta. Cinco de ellas la reenviaban tal cual **y son
 * las que usa la pantalla publica**, que se puede llamar sin cuenta. O sea que cualquiera que
 * abriera el enlace de una invitacion y confirmara asistencia **se llevaba la lista completa
 * de invitados de esa fiesta**.
 *
 * Ninguna pantalla usaba esa fiesta entera: se mandaba de puro descuido.
 *
 * **Lo que si se devuelve es el invitado con su credencial**, porque con eso se arma su QR de
 * entrada y el dueno decidio el 22 de setiembre que eso queda asi. Eso es de esa persona; la
 * lista de los demas no. **No confundir una cosa con la otra al leer este control.**
 *
 * Se probo rompiendolo a proposito: devolviendo `{ ...result, invitado }` en cualquiera de
 * las cinco, la comprobacion que le corresponde se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const CODIGO = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', 'actions', 'fiesta', 'invitados.actions.ts'),
  'utf-8',
);

/** Las cinco que se pueden llamar desde internet sin haber entrado. */
const PUBLICAS = [
  'updateGuestRsvp',
  'handleRsvpSubmission',
  'updateGuestDetails',
  'checkInGuest',
  'submitPublicRsvp',
];

function cuerpo(nombre: string): string {
  const inicio = CODIGO.indexOf(`export async function ${nombre}(`);
  if (inicio === -1) throw new Error(`No encontre ${nombre}`);
  const fin = CODIGO.indexOf('\nexport async function ', inicio + 10);
  return CODIGO.slice(inicio, fin === -1 ? undefined : fin);
}

describe('La pantalla publica no devuelve la lista de invitados', () => {
  it.each(PUBLICAS)('%s no reenvia la fiesta entera', (nombre) => {
    const fn = cuerpo(nombre);
    expect(fn).not.toMatch(/return \{ \.\.\.result/);
    expect(fn).not.toContain('updatedFiesta');
  });

  it('las cinco pasan por el filtro que deja solo lo del invitado', () => {
    for (const nombre of PUBLICAS) {
      expect(cuerpo(nombre)).toContain('soloLoDelInvitado');
    }
  });

  it('el filtro devuelve solo si salio bien, el error y el invitado', () => {
    const inicio = CODIGO.indexOf('function soloLoDelInvitado');
    const cuerpoDelFiltro = CODIGO.slice(inicio, CODIGO.indexOf('\n}', inicio));
    expect(cuerpoDelFiltro).toContain('return { success: resultado.success, error: resultado.error, invitado }');
  });
});
