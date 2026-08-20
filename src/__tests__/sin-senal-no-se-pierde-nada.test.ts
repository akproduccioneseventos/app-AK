import fs from 'fs';
import path from 'path';

/**
 * Lo que se guarda sin señal tiene que llegar cuando vuelve la señal.
 *
 * Por que existe esta prueba: las tres pantallas de la fiesta guardaban lo
 * pendiente en el celular y le decian al invitado "se envia solo", pero **nadie
 * vaciaba la cola**. El pedido de trago nunca llegaba a la barra y la foto nunca
 * se publicaba. Es peor que fallar de frente: la persona se queda tranquila
 * esperando algo que no va a pasar.
 */

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

/**
 * El muro salio de esta lista a proposito, el 20 de agosto de 2026.
 *
 * Esta prueba exigia que las tres pantallas vaciaran la cola, y esa exigencia era
 * justamente el problema: la cola es una sola y compartida, asi que cada pantalla
 * agarraba lo de las otras y, para lo que no sabia mandar, devolvia "enviado".
 * Como el exito borra el elemento, el muro borraba los pedidos de barra sin
 * mandarlos. **El muro no encola nada: no tiene nada que vaciar.**
 */
const PANTALLAS_QUE_ENCOLAN = [
  ['src/app/recepcion/[fiestaId]/RecepcionClient.tsx', 'la llegada de invitados'],
  ['src/app/evento/barra/[fiestaId]/page.tsx', 'el pedido de la barra'],
] as const;

describe('lo que se guarda sin señal se manda al volver', () => {
  it.each(PANTALLAS_QUE_ENCOLAN)('%s reintenta cuando vuelve la conexión', relativo => {
    const fuente = leer(relativo);

    expect(fuente).toContain("addEventListener('online'");
    expect(fuente).toMatch(/flushOfflineQueue|processOfflineQueue/);
  });

  it('el muro igual reacciona cuando vuelve la señal, con su foto pendiente', () => {
    const fuente = leer('src/app/evento/social/[fiestaId]/page.tsx');

    expect(fuente).toContain("addEventListener('online'");
    expect(fuente).toContain('setEnvioPendiente');
  });

  it('la foto del muro no se promete guardada, porque no entra en el celular', () => {
    const fuente = leer('src/app/evento/social/[fiestaId]/page.tsx');

    // Una foto de celular pesa varios megas y no entra en la cola. Antes se
    // encolaba solo el nombre y el texto, y se prometia publicar la foto.
    expect(fuente).not.toContain('Tu foto se publicará automáticamente');
    expect(fuente).toContain('No cierres esta pantalla');
  });
});
