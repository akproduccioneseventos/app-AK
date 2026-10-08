/**
 * Codex, auditoria 78 (orden 128 C): el equipo veia 121 personas confirmadas y el cliente, en
 * su portal, 61 y "0 / 61 invitados llegaron". El portal contaba INVITACIONES (filas) y el
 * equipo, personas con sus acompañantes. Ahora los dos cuentan personas con la misma regla.
 */
import fs from 'fs';
import path from 'path';
import { contarPersonasDelPortal, getGuestPartySize } from '@/lib/fiesta/guest-counts';

const invitados = [
  { rsvp: 'Confirmado', partySize: 4, checkedIn: true },
  { rsvp: 'Confirmado', partySize: 2 },
  { rsvp: 'Confirmado' }, // sin partySize: es una persona
  { rsvp: 'Confirmado', partySize: 0 }, // invalido: es una persona
  { rsvp: 'Confirmado', partySize: Number.NaN },
  { rsvp: 'Rechazado', partySize: 3 },
  { rsvp: 'Pendiente', partySize: 2 },
  { partySize: 5 }, // nunca respondio
];

describe('el portal cuenta personas, no invitaciones', () => {
  it('suma los acompañantes en confirmados, llegados, por llegar, no vienen y sin responder', () => {
    expect(contarPersonasDelPortal(invitados)).toEqual({
      confirmados: 4 + 2 + 1 + 1 + 1,
      llegaron: 4,
      faltanLlegar: 2 + 1 + 1 + 1,
      noVienen: 3,
      sinResponder: 2 + 5,
    });
  });

  it('el portal y el centro del equipo dan el mismo numero de confirmados', () => {
    const centro = invitados
      .filter((i) => i.rsvp === 'Confirmado')
      .reduce((t, i) => t + getGuestPartySize(i), 0);
    expect(contarPersonasDelPortal(invitados).confirmados).toBe(centro);
  });

  it('la pantalla del portal muestra los numeros en personas', () => {
    const pagina = fs.readFileSync(path.join(process.cwd(), 'src/app/portal-cliente/[id]/page.tsx'), 'utf-8');
    expect(pagina).toContain('contarPersonasDelPortal(invitados)');
    // Ningun numero visible sale de contar filas.
    expect(pagina).not.toMatch(/\{\s*(confirmed|checkedIn|declined|pending)\.length\s*\}/);
    expect(pagina).not.toMatch(/\{\s*confirmed\.length\s*-\s*checkedIn\.length\s*\}/);
    // El pendiente dice invitaciones Y personas, no "19 invitados" al lado de "37 sin responder".
    expect(pagina).not.toMatch(/invitado\(s\) pendientes/);
    expect(pagina).toContain('personas.sinResponder}');
    const centro = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/fiestas/[id]/centro/page.tsx'), 'utf-8');
    expect(centro).toContain('getGuestPartySize(i)');
  });
});
