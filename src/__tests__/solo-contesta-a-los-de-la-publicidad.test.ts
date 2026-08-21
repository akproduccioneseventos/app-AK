import fs from 'fs';
import path from 'path';

/**
 * El bot contesta solo a quien llega desde un anuncio. A nadie mas.
 *
 * Por que existe esta prueba: **el WhatsApp de la empresa es el numero personal
 * del dueno**. Un bot que le conteste a cualquiera que escriba le contestaria a la
 * familia, a los proveedores y a los amigos. Eso no se puede.
 *
 * Pero el que llega tocando un anuncio de Facebook o Instagram es otra cosa: un
 * desconocido que espera respuesta comercial, muchas veces de madrugada. A ese
 * conviene contestarle al instante, porque es plata que se enfria.
 *
 * **El detalle que arruinaria la idea:** Meta manda de que anuncio vino la persona
 * **solo en el primer mensaje**. Sin recordarlo, el bot contestaria la primera
 * pregunta y despues se quedaria mudo en la mitad de la conversacion, que es peor
 * que no contestar nunca.
 */
function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

const MODULO = 'src/lib/whatsapp/vino-de-la-publicidad.ts';
const WEBHOOK = 'src/app/api/whatsapp/webhook/route.ts';

describe('a quien le contesta el bot de WhatsApp', () => {
  it('el webhook no contesta si el mensaje no viene de la publicidad', () => {
    const fuente = leer(WEBHOOK);

    expect(fuente).toContain('correspondeContestarSolo');
    expect(fuente).toContain('No viene de la publicidad');
  });

  it('el freno esta ANTES de generar la respuesta', () => {
    const fuente = leer(WEBHOOK);

    const freno = fuente.indexOf('correspondeContestarSolo');
    const respuesta = fuente.indexOf('processIncomingMessage(phone');

    expect(freno).toBeGreaterThan(-1);
    expect(respuesta).toBeGreaterThan(freno);
  });

  it('reconoce el anuncio pago y el boton de una publicacion', () => {
    const fuente = leer(MODULO);

    expect(fuente).toContain("tipo === 'ad'");
    expect(fuente).toContain("tipo === 'post'");
  });

  it('recuerda la conversacion, porque el dato viene solo en el primer mensaje', () => {
    const fuente = leer(MODULO);

    expect(fuente).toContain('recordarQueVinoDeLaPublicidad');
    expect(fuente).toContain('SE_RECUERDA_POR_DIAS');
  });

  it('lo recordado caduca: no queda contestando para siempre', () => {
    const fuente = leer(MODULO);

    expect(fuente).toContain('estaVigente');
  });
});
