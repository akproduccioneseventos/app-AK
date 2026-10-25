/** @jest-environment node */

/**
 * Orden 210, A3 (Codex 193): con la sesión del portal puesta (perfil cliente) y el enlace válido de SU
 * presupuesto, la lectura devolvía nada y el portal decía "Falta el presupuesto". El enlace sólo abre
 * ese documento: otro id, un enlace inválido o ninguno siguen sin abrir nada.
 * A4 y A10 (Codex 193 y 201): un error al leer no se muestra como "falta", y un ajuste anual de 0
 * puesto a propósito no se vuelve 15.
 */
import fs from 'fs';
import path from 'path';

let sesion: any = { success: false };
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => sesion),
  verifyBudgetToken: jest.fn(async (id: string, token: string) => id === 'p1' && token === 'tok-p1'),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [{ id: 'p1', clienteNombre: 'Ana', totalConDescuento: 1000 }, { id: 'p2', clienteNombre: 'Otro' }]),
  readDataConDetalle: jest.fn(async () => ({ valor: [], huboFalla: false })),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(),
}));

import { getPresupuestoById } from '@/app/actions/presupuestos';

describe('el cliente con su sesión ve su presupuesto (orden 210)', () => {
  it('con sesión de cliente y el enlace de ESE presupuesto, lo ve', async () => {
    sesion = { success: true, user: { userId: 'c1', perfil: 'cliente', role: 'user' } };
    expect((await getPresupuestoById('p1', 'tok-p1'))?.clienteNombre).toBe('Ana');
  });

  it('sin enlace, con enlace inválido o con el enlace de otro, no ve nada', async () => {
    sesion = { success: true, user: { userId: 'c1', perfil: 'cliente', role: 'user' } };
    expect(await getPresupuestoById('p1')).toBeNull();
    expect(await getPresupuestoById('p1', 'otro')).toBeNull();
    expect(await getPresupuestoById('p2', 'tok-p1')).toBeNull();
  });

  it('el dueño sigue viéndolo sin enlace', async () => {
    sesion = { success: true, user: { userId: 'd1', perfil: 'dueno', role: 'admin' } };
    expect((await getPresupuestoById('p2'))?.clienteNombre).toBe('Otro');
  });

  it('el portal distingue "no se pudo leer" de "falta", y respeta un ajuste de 0', () => {
    const dir = path.join(process.cwd(), 'src/app/portal/c/[accessKey]');
    const pagina = fs.readFileSync(path.join(dir, 'page.tsx'), 'utf8');
    expect(pagina).toMatch(/errorPresupuesto = true/);
    expect(pagina).toMatch(/errorPresupuesto=\{errorPresupuesto\}/);
    const cliente = fs.readFileSync(path.join(dir, 'PublicPortalClientExperience.tsx'), 'utf8');
    expect(cliente).toMatch(/!presupuesto && errorPresupuesto/);
    expect(cliente).not.toMatch(/ajusteAnualPorcentaje \?\? 15\) \|\| 15/);
  });
});
