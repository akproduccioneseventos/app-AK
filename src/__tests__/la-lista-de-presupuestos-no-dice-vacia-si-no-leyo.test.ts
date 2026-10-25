/**
 * Pregunta 50, barrido completo del 21/10/2026: si la base no contestaba, `getPresupuestos` devolvía la
 * lista vacía y la pantalla decía "No hay presupuestos cargados". Alguien podía cargarlos de nuevo.
 * Y el simulador con Sofía mandaba al simulador manual sin `guests`: arrancaba con 50 invitados.
 */
import fs from 'fs';
import path from 'path';

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'd1', perfil: 'dueno', role: 'admin' } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  readDataConDetalle: jest.fn(async () => ({ valor: [], huboFalla: true })),
  writeData: jest.fn(),
  mutateDataItem: jest.fn(),
}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

describe('la lista de presupuestos no dice "vacía" si no pudo leer', () => {
  it('una lectura fallida avisa, no devuelve una lista vacía', async () => {
    const { getPresupuestos } = await import('@/app/actions/presupuestos');
    await expect(getPresupuestos()).rejects.toThrow(/No se pudieron leer los presupuestos/);
  });

  it('el chat con Sofía pasa la cantidad de invitados al simulador manual', () => {
    const codigo = fs.readFileSync(path.join(process.cwd(), 'src/app/simulador-ak/page.tsx'), 'utf8');
    expect(codigo).toMatch(/&guests=\$\{/);
    const destino = fs.readFileSync(path.join(process.cwd(), 'src/app/simulador-de-presupuesto/page.tsx'), 'utf8');
    expect(destino).toMatch(/searchParams\.get\('guests'\)/);
  });
});
