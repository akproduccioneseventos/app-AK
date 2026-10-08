/**
 * La recepcion y el portal publico cuentan PERSONAS y no filas (barrido por forma, 8/10/2026).
 *
 * Pasó: "3 / 4" en la recepcion y "N invitados confirmados" en el portal contaban invitaciones.
 * Una invitacion para cuatro son cuatro personas. La cuenta ya estaba bien en el portal del
 * cliente (contarPersonasDelPortal / getGuestPartySize); estas dos pantallas la copiaban mal.
 */
import * as fs from 'fs';
import * as path from 'path';

const leer = (...partes: string[]) =>
  fs.readFileSync(path.resolve(__dirname, '..', ...partes), 'utf8');

const recepcion = leer('app', 'recepcion', '[fiestaId]', 'RecepcionClient.tsx');
const portal = leer('app', 'portal', 'c', '[accessKey]', 'PublicPortalView.tsx');

describe('La recepcion cuenta personas, no filas', () => {
  it('presentes y totales salen de la cuenta por personas', () => {
    expect(recepcion).toMatch(/contarPersonasDelPortal|getGuestPartySize/);
  });

  it('ninguna de las dos cuentas es un .length de filas', () => {
    expect(recepcion).not.toMatch(/const\s+presentes\s*=[^;]*\.length\s*;/);
    expect(recepcion).not.toMatch(/const\s+totales\s*=[^;]*\.length\s*;/);
  });
});

describe('El portal publico cuenta personas confirmadas', () => {
  it('usa getGuestPartySize para la suma de personas', () => {
    expect(portal).toMatch(/import \{ getGuestPartySize \} from '@\/lib\/fiesta\/guest-counts'/);
    expect(portal).toMatch(/reduce\(\(sum, inv\) => sum \+ getGuestPartySize\(inv\), 0\)/);
  });

  it('no muestra filas de confirmados como si fueran personas', () => {
    expect(portal).not.toMatch(/>\s*\{guestConfirmados\.length\}\s*</);
    expect(portal).not.toMatch(/\{guestConfirmados\.length\} invitados confirmados/);
  });

  it('el total de personas no vuelve a usar partySize ?? 1 (0 o NaN contarian mal)', () => {
    expect(portal).not.toMatch(/partySize \?\? 1/);
  });
});
