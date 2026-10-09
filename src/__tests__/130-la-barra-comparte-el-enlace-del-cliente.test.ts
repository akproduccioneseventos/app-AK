/**
 * SHARE80 (Codex, auditoría 80): el enlace del cliente se arma en un solo lugar y lleva token.
 * Si no se puede emitir el token, falla: nadie anuncia "enlace copiado" con un enlace inservible.
 * Probado rompiéndolo: con la barra copiando `window.location.href`, la última prueba da rojo.
 */
import fs from 'node:fs';
import path from 'node:path';

const token = jest.fn();
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoShareToken: (...a: any[]) => token(...a) }));

import { enlacePublicoDelPresupuesto } from '@/lib/presupuestos/enlace-publico';

it('arma el enlace del cliente con token', async () => {
  token.mockResolvedValue({ success: true, token: 'abc123' });
  const url = await enlacePublicoDelPresupuesto('p1', 'https://akproducciones.uy');
  expect(url).toBe('https://akproducciones.uy/presupuestos/p1/ver?cliente=1&token=abc123');
});

it('si no hay permiso para el token, falla en vez de devolver un enlace sin token', async () => {
  token.mockResolvedValue({ success: false, error: 'Tu perfil no puede compartir presupuestos.' });
  await expect(enlacePublicoDelPresupuesto('p1', 'https://akproducciones.uy')).rejects.toThrow('no puede compartir');
});

it('la barra flotante y el botón de la pantalla usan el mismo armado', () => {
  const barra = fs.readFileSync(path.join(process.cwd(), 'src/components/presupuestos/budget-share-dock.tsx'), 'utf8');
  const pantalla = fs.readFileSync(path.join(process.cwd(), 'src/app/(app)/presupuestos/[id]/ver/page.tsx'), 'utf8');
  expect(barra).toMatch(/enlacePublicoDelPresupuesto\(/);
  expect(pantalla).toMatch(/enlacePublicoDelPresupuesto\(/);
  expect(barra).not.toMatch(/window\.location\.href\)/);
  expect(barra).not.toMatch(/clipboard\.writeText\(getCurrentBudgetUrl/);
});
