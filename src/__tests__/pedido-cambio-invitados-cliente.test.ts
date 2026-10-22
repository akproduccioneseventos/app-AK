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
    expect(aprobar).toContain('requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM)');
    // Orden 210: rechazar también pide permiso (antes, sólo sesión).
    expect(rechazar).toContain('requirePermisoAlguno(PERMISOS.CONTABILIDAD, PERMISOS.CRM)');
  });

  it('al aprobar se actualiza el presupuesto, que es de donde sale el conteo', () => {
    const aprobar = portalActions.slice(
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function rejectClientGuestCountChangeRequest'),
    );
    // Orden 210: el presupuesto se cambia adentro de su transacción.
    expect(aprobar).toContain('mutarPresupuesto');
    expect(aprobar).toContain('invitadosAdultos');
    expect(aprobar).toContain('invitadosAdolescentes');
    expect(aprobar).toContain('invitadosNinos');
  });

  it('un pedido ya resuelto no se puede volver a resolver', () => {
    const aprobar = portalActions.slice(
      portalActions.indexOf('export async function approveClientGuestCountChangeRequest'),
      portalActions.indexOf('export async function approveClientServiceChangeRequest'),
    );
    // Orden 210: aprobar y rechazar pasan por `tomarSolicitud`, que mira "pendiente" adentro de la
    // escritura (dos aprobaciones a la vez no suman dos veces).
    expect(aprobar.split('tomarSolicitud<').length - 1).toBe(2);
    expect(portalActions).toMatch(/if \(solicitud\.status !== 'pendiente'\) \{ error = 'La solicitud ya fue procesada\.'/);
  });
});
