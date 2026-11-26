import fs from 'node:fs';
import path from 'node:path';
import {
  updateClientPackingList,
  updateTeamPackingListChanges,
} from '@/app/actions/fiesta/portal.actions';
import { verifyPortalSession } from '@/lib/security/portal-session';
import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import type { ClienteDebeLlevarItem } from '@/types/fiesta';

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(),
  setPortalSessionCookie: jest.fn(),
}));

const dbFiestas = new Map<string, any>();

jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updateFn: any) => {
    const actual = dbFiestas.get(fiestaId);
    if (!actual) return { success: false, error: 'Fiesta no encontrada' };
    // Devolver copia profunda para simular una base real
    const copia = JSON.parse(JSON.stringify(actual));
    const updated = typeof updateFn === 'function' ? await updateFn(copia) : { ...copia, ...updateFn };
    dbFiestas.set(fiestaId, JSON.parse(JSON.stringify(updated)));
    return { success: true, updatedFiesta: JSON.parse(JSON.stringify(updated)) };
  }),
}));

describe('Orden 367 y 370: lo que lleva el cliente no se pisa y usa estado listo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dbFiestas.clear();
    dbFiestas.set('fiesta-1', {
      id: 'fiesta-1',
      clienteDebeLlevar: [
        { id: 'A', texto: 'Documento', completado: false, estado: 'pendiente' },
        { id: 'B', texto: 'Lista invitados', completado: false, estado: 'pendiente' },
      ] satisfies ClienteDebeLlevarItem[],
    });
    (verifyPortalSession as jest.Mock).mockResolvedValue(true);
  });

  it('el equipo agrega D y el cliente tilda A con su copia vieja: quedan las dos cosas', async () => {
    const itemD: ClienteDebeLlevarItem = {
      id: 'D',
      texto: 'Souvenirs',
      completado: false,
      estado: 'pendiente',
    };

    const resEquipo = await updateTeamPackingListChanges('fiesta-1', [
      { op: 'add', item: itemD },
    ]);
    expect(resEquipo.success).toBe(true);
    expect(resEquipo.items?.map(i => i.id)).toEqual(['A', 'B', 'D']);

    // El cliente tilda A enviando solo el cambio puntual (sin saber de D)
    const resCliente = await updateClientPackingList('fiesta-1', {
      op: 'toggle',
      itemId: 'A',
      completado: true,
      estado: 'listo',
    });

    expect(resCliente.success).toBe(true);
    expect(resCliente.items?.map(i => i.id)).toEqual(['A', 'B', 'D']);
    const itemA = resCliente.items?.find(i => i.id === 'A');
    expect(itemA?.completado).toBe(true);
    expect(itemA?.estado).toBe('listo');
    expect(resCliente.items?.find(i => i.id === 'D')?.texto).toBe('Souvenirs');
  });

  it('sin sesion de portal no permite modificar la lista del cliente', async () => {
    (verifyPortalSession as jest.Mock).mockResolvedValue(false);
    const res = await updateClientPackingList('fiesta-1', {
      op: 'toggle',
      itemId: 'A',
      completado: true,
      estado: 'listo',
    });
    expect(res.success).toBe(false);
    expect(actualizarFiesta).not.toHaveBeenCalled();
  });

  it('la UI del portal usa estado listo, revierte si falla y no silencia guardarCorreoDeRecuperacion', () => {
    const portalPage = fs.readFileSync(
      path.join(process.cwd(), 'src/app/portal-cliente/[id]/page.tsx'),
      'utf8',
    );
    const portalActions = fs.readFileSync(
      path.join(process.cwd(), 'src/app/actions/fiesta/portal.actions.ts'),
      'utf8',
    );

    expect(portalActions).not.toContain('clienteDebeLlevar: items }))');
    expect(portalPage).not.toContain("estado: (!item.completado ? 'enviado' : 'pendiente')");
    expect(portalPage).not.toContain('guardarCorreoDeRecuperacion(fiestaId, correo).catch(() => null)');
    expect(portalPage).toContain("setDebeLlevarItems(prevItems)");
  });
});
