import fs from 'fs';
import path from 'path';

/**
 * Cada pantalla vacia SOLO su parte de la cola sin senal.
 *
 * Por que existe esta prueba: la cola del celular es una sola y la comparten la
 * barra, la recepcion y el muro. Cada pantalla la vaciaba entera, y para lo que no
 * sabia mandar devolvia "enviado". Como el exito borra el elemento, **una pantalla
 * borraba los pedidos de otra sin mandarlos**.
 *
 * En una fiesta con mala senal eso es: el invitado pide un trago, lee "se envia
 * solo", abre el muro para ver las fotos, y el pedido desaparece. Nadie se entera,
 * ni el invitado ni la barra.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('la cola sin senal', () => {
  it('la barra vacia solo los pedidos de barra', () => {
    const fuente = leer('src/app/evento/barra/[fiestaId]/page.tsx');

    expect(fuente).toContain("types: ['barra_pedido']");
  });

  it('la recepcion vacia solo los check-in', () => {
    const fuente = leer('src/app/recepcion/[fiestaId]/RecepcionClient.tsx');

    expect(fuente).toContain("types: ['recepcion_checkin']");
  });

  it('el muro no vacia la cola: no encola nada, no tiene nada que mandar', () => {
    const fuente = leer('src/app/evento/social/[fiestaId]/page.tsx');

    expect(fuente).not.toContain('processOfflineQueue(');
    expect(fuente).not.toContain('flushOfflineQueue(');
  });

  it('ninguna pantalla da por enviado lo que no sabe mandar', () => {
    const pantallas = [
      'src/app/evento/barra/[fiestaId]/page.tsx',
      'src/app/recepcion/[fiestaId]/RecepcionClient.tsx',
      'src/app/evento/social/[fiestaId]/page.tsx',
    ];

    for (const pantalla of pantallas) {
      expect(leer(pantalla)).not.toContain('return { success: true };');
    }
  });

  it('el filtro por tipo existe en la cola', () => {
    const fuente = leer('src/lib/offline/offline-action-queue.ts');

    expect(fuente).toContain('types?: OfflineActionType[]');
    expect(fuente).toContain('!options.types.includes(action.type)');
  });
});
