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

  // La pregunta 33, puesta como control: en TODA accion del servidor, la funcion que devuelve
  // la lista de invitados tiene que pedir sesion o permiso sobre la fiesta antes.
  it('ninguna accion del servidor devuelve la lista de invitados sin pedir permiso', () => {
    const raiz = path.join(process.cwd(), 'src/app/actions');
    const archivos: string[] = [];
    const recorrer = (d: string) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const f = path.join(d, e.name);
      if (e.isDirectory()) recorrer(f); else if (/\.ts$/.test(e.name)) archivos.push(f);
    });
    recorrer(raiz);
    const sinPermiso: string[] = [];
    for (const f of archivos) {
      const texto = fs.readFileSync(f, 'utf-8');
      if (!/^['"]use server['"]/.test(texto)) continue;
      const partes = texto.split(/\nexport async function /).slice(1);
      for (const cuerpo of partes) {
        const fin = cuerpo.search(/\n}\n/);
        const funcion = fin === -1 ? cuerpo : cuerpo.slice(0, fin);
        if (!/return\s+\w+\??\.invitados\s*(\|\||\?\?|;)/.test(funcion)) continue;
        if (!/require(AppSession|FiestaWriteAccess|FiestaReadAccess)\(/.test(funcion)) {
          sinPermiso.push(`${path.relative(process.cwd(), f)}: ${funcion.split('(')[0]}`);
        }
      }
    }
    expect(sinPermiso).toEqual([]);
  });
});
