import fs from 'fs';
import path from 'path';

/**
 * El cartel de WhatsApp dice lo que pasa, no lo que dice la llave.
 *
 * Por que existe esta prueba: con la llave prendida y la conexion con Meta sin
 * completar, la pantalla mostraba en grande **"Bot activado - el bot esta
 * respondiendo mensajes de WhatsApp"**, y el bot no podia mandar ni uno. Abajo
 * habia un aviso que lo desmentia, pero el renglon grande es el que se lee.
 *
 * Es el mismo error del cartel de "ficha verificada en Google": una pantalla que
 * afirma algo sin nada detras hace que el dueno deje de revisar algo que en
 * realidad esta sin hacer.
 */
const PANTALLA = 'src/app/(app)/settings/whatsapp-business/page.tsx';

describe('el cartel de WhatsApp', () => {
  const fuente = fs.readFileSync(path.join(process.cwd(), PANTALLA), 'utf8');

  it('no dice "activado" a secas cuando falta la conexion con Meta', () => {
    expect(fuente).toContain('todavía no puede responder');
    expect(fuente).toContain('missingMetaCredentials');
  });

  it('el estado se decide mirando la conexion, no solo la llave', () => {
    // El texto "esta respondiendo mensajes" solo puede aparecer en la rama en la
    // que no falta nada.
    const indiceRespondiendo = fuente.indexOf('está respondiendo mensajes');
    const indiceFalta = fuente.indexOf('Le falta la conexión con Meta');

    expect(indiceRespondiendo).toBeGreaterThan(-1);
    expect(indiceFalta).toBeGreaterThan(-1);
    expect(indiceFalta).toBeLessThan(indiceRespondiendo);
  });
});
