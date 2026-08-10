import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), 'utf8');

describe('estética: contratos de portal e invitación', () => {
  const invitation = read('src/app/invitacion/[fiestaId]/invitacion-publica-client.tsx');
  const fiestaTypes = read('src/types/fiesta.ts');
  const configuration = read('src/app/(app)/fiestas/nueva/configuracion/page.tsx');
  const clientPortal = read('src/app/portal/c/[accessKey]/PublicPortalView.tsx');
  const teamPortal = read('src/app/(app)/fiestas/nueva/portal-cliente/page.tsx');
  const globals = read('src/app/globals.css');

  it("quita 'Tal vez' de la respuesta pública sin borrar el dato histórico", () => {
    expect(invitation).toContain("'Confirmado' | 'Rechazado'");
    expect(invitation).toContain("value: 'Confirmado'");
    expect(invitation).toContain("value: 'Rechazado'");
    expect(invitation).not.toContain("value: 'Tal vez'");
    expect(fiestaTypes).toContain("'Pendiente' | 'Confirmado' | 'Rechazado' | 'Tal vez'");
  });

  it('muestra el aviso contractual al editar invitados sin intervenir el guardado', () => {
    expect(configuration).toContain("import { validarCambioDeInvitados }");
    expect(configuration).toContain('const veredictoInvitados = validarCambioDeInvitados({');
    expect(configuration).toContain('invitadosContratados');
    expect(configuration).not.toContain('handleSubmit={veredictoInvitados');
    expect(configuration).not.toContain('if (veredictoInvitados.nivel === \'fuera-de-contrato\') return');
  });

  it('permite al cliente pedir el cambio con desglose, total y estados visibles', () => {
    expect(clientPortal).toContain('submitClientGuestCountChangeRequest');
    expect(clientPortal).toContain('guestAdults');
    expect(clientPortal).toContain('guestTeens');
    expect(clientPortal).toContain('guestKids');
    expect(clientPortal).toContain('guestRequestedTotal');
    expect(clientPortal).toContain('Pedido pendiente de revisión');
    expect(clientPortal).toContain('motivoRechazo');
  });

  it('deja al equipo aprobar o rechazar explicando el motivo al cliente', () => {
    expect(teamPortal).toContain('approveClientGuestCountChangeRequest');
    expect(teamPortal).toContain('rejectClientGuestCountChangeRequest');
    expect(teamPortal).toContain('Aprobar y actualizar el presupuesto');
    expect(teamPortal).toContain('Motivo para el cliente');
  });

  it('eleva a 12 px las utilidades históricas de 8 a 11 px', () => {
    for (const size of [8, 9, 10, 11]) {
      expect(globals).toContain(`.text-\\[${size}px\\]`);
    }
    expect(globals).toContain('font-size: 0.75rem !important;');
    expect(globals).toContain('line-height: 1rem !important;');
  });
});
