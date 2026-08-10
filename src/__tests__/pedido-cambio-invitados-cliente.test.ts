import fs from 'fs';
import path from 'path';

/**
 * El cliente puede pedir, desde su portal, cambiar la cantidad de invitados:
 * bajar hasta 10% o subir hasta 30%, poniendo cuántos adultos, adolescentes y
 * niños. Lo pide y lo resuelve AK; no se aplica solo, porque subir invitados
 * mueve el precio y hay que confirmar disponibilidad con el salón.
 *
 * Se prueba sobre el codigo fuente porque son acciones de servidor que tocan
 * archivos y sesion, y lo que hay que impedir es que alguien saque las
 * protecciones sin darse cuenta.
 */

const portalActions = fs.readFileSync(
  path.join(path.resolve(__dirname, '..'), 'app', 'actions', 'fiesta', 'portal.actions.ts'),
  'utf8',
);

describe('pedido de cambio de invitados desde el portal del cliente', () => {
  it('el cliente tiene que estar identificado para pedirlo', () => {
    const bloque = portalActions.slice(
      portalActions.indexOf('export async function submitClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
    );
    expect(bloque).toContain('verifyPortalSession');
  });

  it('respeta los limites del contrato antes de tomar el pedido', () => {
    const bloque = portalActions.slice(
      portalActions.indexOf('export async function submitClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
    );
    // Usa la regla compartida, no una copia propia.
    expect(bloque).toContain('validarCambioDeInvitados');
    expect(bloque).toContain("veredicto.nivel === 'fuera-de-contrato'");
  });

  it('no deja acumular dos pedidos pendientes a la vez', () => {
    const bloque = portalActions.slice(
      portalActions.indexOf('export async function submitClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
    );
    expect(bloque).toContain("p.status === 'pendiente'");
  });

  it('el pedido queda pendiente: no se aplica solo', () => {
    const bloque = portalActions.slice(
      portalActions.indexOf('export async function submitClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
    );
    expect(bloque).toContain("status: 'pendiente'");
    // Al pedir no se toca el presupuesto: eso pasa recien al aprobar.
    expect(bloque).not.toContain('updatePresupuesto');
  });

  it('aprobar y rechazar son solo para el equipo de AK', () => {
    const aprobar = portalActions.slice(
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function rejectClientGuestCountChangeRequest'),
    );
    const rechazar = portalActions.slice(
      portalActions.indexOf('export async function rejectClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientServiceChangeRequest'),
    );
    expect(aprobar).toContain('requireAppSession');
    expect(rechazar).toContain('requireAppSession');
  });

  it('al aprobar se actualiza el presupuesto, que es de donde sale el conteo', () => {
    const aprobar = portalActions.slice(
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function rejectClientGuestCountChangeRequest'),
    );
    expect(aprobar).toContain('updatePresupuesto');
    expect(aprobar).toContain('invitadosAdultos');
    expect(aprobar).toContain('invitadosAdolescentes');
    expect(aprobar).toContain('invitadosNinos');
  });

  it('un pedido ya resuelto no se puede volver a resolver', () => {
    const aprobar = portalActions.slice(
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientServiceChangeRequest'),
    );
    const vecesQueControla = aprobar.split("status !== 'pendiente'").length - 1;
    // Una vez en aprobar y otra en rechazar.
    expect(vecesQueControla).toBe(2);
  });
});
