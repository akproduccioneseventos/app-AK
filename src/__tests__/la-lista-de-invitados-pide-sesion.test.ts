/**
 * MATAFUEGO — La lista entera de invitados pide sesion del equipo (Codex, auditoria 64, PER01).
 *
 * `getInvitados` lee la fiesta con `LECTURA_COMPLETA` y es una accion del servidor que importa
 * una pantalla del navegador (el muro social): se puede llamar desde internet. No pedia nada,
 * asi que con el numero de la fiesta cualquiera se llevaba el telefono y la credencial de cada
 * invitado. Ahora pide la sesion del equipo; la tarea de recordatorios lee la fiesta cruda.
 *
 * Se probo rompiendolo: sacando `requireAppSession()` de `getInvitados`, la primera prueba se
 * pone en rojo.
 */
import fs from 'fs';
import path from 'path';

let conSesion = false;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: conSesion })),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => ({
    id: 'f1',
    invitados: [{ id: 'i1', nombre: 'Ana', contacto: '099111222', credencial: 'secreta' }],
  })),
  saveFiesta: jest.fn(),
  requireFiestaWriteAccess: jest.fn(),
}));
jest.mock('@/lib/data-service', () => ({ writeData: jest.fn(), readData: jest.fn() }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/lib/guest-portal-public-data', () => ({ hasPublicGuestAccess: jest.fn() }));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({ actualizarFiesta: jest.fn() }));

import { getInvitados } from '@/app/actions/fiesta/invitados.actions';

describe('La lista de invitados no sale sin sesion del equipo', () => {
  it('sin sesion no devuelve ningun telefono ni credencial', async () => {
    conSesion = false;
    await expect(getInvitados('f1')).rejects.toThrow();
  });

  it('con sesion del equipo la recepcion y el muro la siguen viendo', async () => {
    conSesion = true;
    const lista = await getInvitados('f1');
    expect(lista).toHaveLength(1);
    expect(lista[0].contacto).toBe('099111222');
  });

  it('la tarea de recordatorios no depende de la accion que pide sesion', () => {
    const tarea = fs.readFileSync(
      path.join(process.cwd(), 'src/app/api/cron/recordatorio-a-los-invitados/route.ts'),
      'utf-8',
    );
    expect(tarea).not.toMatch(/import[^;]*getInvitados/);
    expect(tarea).toMatch(/fiesta\.invitados/);
  });
});
