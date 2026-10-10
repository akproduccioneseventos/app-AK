/** @jest-environment node */
/**
 * Pregunta 47 (10/10/2026): borrar, archivar, cancelar o reactivar una fiesta pedía sólo sesión.
 * El personal y el operador también tienen sesión, así que podían sacar una fiesta de la cuenta.
 * Ahora: archivar, cancelar y reactivar piden contabilidad o administración; borrar del archivo y
 * archivar todas, sólo administración.
 *
 * Probado rompiéndolo: con `requireAppSession` de vuelta, se pone en rojo.
 */
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn() }));
const escrituras = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (_f: string, d: any) => d),
  writeData: jest.fn(async (...a: any[]) => escrituras(...a)),
}));

import { verifySession } from '@/lib/auth/session-token';
import {
  archiveFiesta, deleteFiesta, deleteFiestaArchivada, resetAllActiveFiestas,
  suspenderFiestaAction, reactivarFiestaAction,
} from '@/app/actions/fiesta/fiesta.actions';

const como = (perfil: string, role = 'user') =>
  (verifySession as jest.Mock).mockResolvedValue({ success: true, user: { userId: `u-${perfil}`, role, perfil } });

beforeEach(() => escrituras.mockReset());

describe.each(['personal', 'operador'])('el perfil %s no saca fiestas de la cuenta', (perfil) => {
  beforeEach(() => como(perfil));
  it.each([
    ['archivar', () => archiveFiesta('f1')],
    ['borrar', () => deleteFiesta('f1')],
    ['borrar del archivo', () => deleteFiestaArchivada('f1')],
    ['archivar todas', () => resetAllActiveFiestas()],
    ['cancelar', () => suspenderFiestaAction('f1', 'motivo')],
    ['reactivar', () => reactivarFiestaAction('f1')],
  ])('%s se rechaza por permiso', async (_que, accion) => {
    await expect(accion()).rejects.toThrow(/no tiene acceso/);
    expect(escrituras).not.toHaveBeenCalled();
  });
});

it('la secretaria (contabilidad) puede cancelar, pero no borrar del archivo', async () => {
  como('secretaria');
  // Pasa el permiso: llega a buscar la fiesta (que acá no existe).
  await expect(suspenderFiestaAction('no-existe', 'motivo')).resolves.toMatchObject({ success: false, error: 'Evento no encontrado.' });
  await expect(deleteFiestaArchivada('f1')).rejects.toThrow(/no tiene acceso/);
});
