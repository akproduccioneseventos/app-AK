/** @jest-environment node */
/**
 * Quién ve y quién toca qué (Codex, auditoría 66, 5/10/2026). Antes alcanzaba tener sesión.
 *
 * - Presupuestos: el personal no los ve; el operador ("nada de plata") ve los servicios sin cobros.
 * - Menús públicos: el prospecto no recibe el costo del plato, recibe el precio ya calculado.
 * - Barra: el pedido del invitado no se confirma si un ingrediente controlado no alcanza; el
 *   pedido manual que no se guardó devuelve las botellas; las acciones del equipo piden permiso.
 * - Estaciones: el permiso de operador lo da la noche o la organización, no cualquier sesión.
 */
import fs from 'fs';
import path from 'path';

let perfil = 'secretaria';
const presupuestos = [
  { id: 'p1', clienteNombre: 'Ana', itemsPresupuestados: [], pagosCliente: [{ id: 'c1', monto: 1000 }] },
];

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => (perfil === 'nadie'
    ? { success: false }
    : { success: true, user: { userId: 'u1', perfil } })),
  generateBudgetToken: jest.fn(async () => 'tok'),
  verifyBudgetToken: jest.fn(async () => false),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, d: any) => (f === 'presupuestos.json' ? JSON.parse(JSON.stringify(presupuestos)) : d)),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf8');

describe('Presupuestos por perfil', () => {
  it('secretaria: completo, con cobros', async () => {
    perfil = 'secretaria';
    const { getPresupuestos } = await import('@/app/actions/presupuestos');
    const lista = await getPresupuestos();
    expect(lista[0].pagosCliente).toHaveLength(1);
  });

  it('operador: los servicios, sin cobros; y no genera enlaces ni ve pendientes', async () => {
    perfil = 'operador';
    const { getPresupuestos, getPresupuestoById, getPresupuestoShareToken, getPresupuestosWithPendingPayments } = await import('@/app/actions/presupuestos');
    expect((await getPresupuestos())[0].pagosCliente).toEqual([]);
    expect((await getPresupuestoById('p1'))?.pagosCliente).toEqual([]);
    expect((await getPresupuestoShareToken('p1')).success).toBe(false);
    await expect(getPresupuestosWithPendingPayments()).rejects.toThrow();
  });

  it('personal: nada', async () => {
    perfil = 'personal';
    const { getPresupuestos, getPresupuestoById } = await import('@/app/actions/presupuestos');
    await expect(getPresupuestos()).rejects.toThrow();
    expect(await getPresupuestoById('p1')).toBeNull();
  });

  it('guardar igual conserva los cobros de la base (lo que el operador no ve no se pierde)', () => {
    expect(leer('src/lib/budget/los-cobros-no-se-pisan.ts')).toMatch(/pagosCliente: cobrosDeLaBase/);
  });
});

describe('Menús públicos', () => {
  it('no llevan el costo del plato: llevan el precio calculado con el margen de verdad', () => {
    const fuente = leer('src/app/actions/menus-catering.ts');
    const publicos = fuente.slice(fuente.indexOf('export async function getMenusPublicos'), fuente.indexOf('export async function getMenuById'));
    expect(publicos).toMatch(/totalDishCost: 0/);
    expect(publicos).toMatch(/suggestedSellingPrice: precio/);
    expect(publicos).toMatch(/getMenuItemSellingPrice\(item\)/);
  });
});

describe('Barra', () => {
  const barra = leer('src/app/actions/fiesta/barra-tecnologica.actions.ts');
  it('el pedido del invitado se rechaza si un ingrediente controlado no alcanza, adentro de la operación', () => {
    const op = barra.slice(barra.indexOf('async function descontarYGuardarEnUnaOperacion'), barra.indexOf('async function reponerStock'));
    expect(op).toMatch(/available < recipe\[index\]\.cantidad/);
    expect(op.indexOf('if (falta) return { sinStock: true')).toBeLessThan(op.indexOf('transaction.set(orderRef'));
    expect(barra).toMatch(/descontarStock\(drink, \{ exigirCompleto: true \}\)/);
  });
  it('el pedido manual que no se guardó devuelve las botellas', () => {
    const manual = barra.slice(barra.indexOf('export async function createBarmanManualOrder'), barra.indexOf('export async function getGuestBarOrders'));
    expect(manual).toMatch(/if \(errorAlGuardar\) \{[\s\S]*reponerStock\(order\.stockMovements/);
    expect(manual).toMatch(/anotarDevolucionPendiente/);
  });
  it('las acciones del equipo piden permiso de barra, no sólo sesión', () => {
    for (const fn of ['getBarraTecnologicaDashboard', 'saveBarraTecnologicaSettings', 'createBarmanManualOrder', 'updateBarDrinkOrderStatus', 'getCierreDeBarra', 'guardarCierreDeBarra', 'guardarAperturaDeBarraAction']) {
      const desde = barra.indexOf(`export async function ${fn}`);
      const cuerpo = barra.slice(desde, barra.indexOf('\n}\n', desde));
      expect({ fn, pide: /requireEventPermission\([^)]*PERMISO_DE_LA_BARRA\)/.test(cuerpo) }).toEqual({ fn, pide: true });
    }
  });
});

describe('Estaciones', () => {
  it('el permiso de operador sale de la noche o la organización, y el operador sólo en su fiesta', () => {
    const token = leer('src/lib/auth/entertainment-token.ts');
    expect(token).toMatch(/requireEventPermission\(fiestaId, \[PERMISOS\.NOCHE, PERMISOS\.ORGANIZACION\]\)/);
    const control = token.slice(token.indexOf('export async function hasEntertainmentControlAccess'), token.indexOf('export async function hasEntertainmentGuestAccess'));
    expect(control).not.toMatch(/if \(await hasAppSession\(\)\) return true;/);
    const acciones = leer('src/app/actions/fiesta/entretenimiento.actions.ts');
    const lanzar = acciones.slice(acciones.indexOf('export async function getEntertainmentLaunchToken'));
    expect(lanzar.slice(0, 1200)).toMatch(/requireEventPermission\(fiestaId, \[PERMISOS\.NOCHE, PERMISOS\.ORGANIZACION\]\)/);
  });
  it('la captura lleva la misma identidad en la subida y en el reintento', () => {
    for (const f of ['fotocabina', 'plataforma-360', 'espejo-magico']) {
      const p = leer(`src/app/evento/${f}/[fiestaId]/page.tsx`);
      expect({ f, sube: p.includes("formData.append('clientMediaId', idDeLaCaptura)"), guarda: p.includes('id: idDeLaCaptura,') }).toEqual({ f, sube: true, guarda: true });
    }
  });
});
