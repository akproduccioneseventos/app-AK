/**
 * MATAFUEGO — La pantalla no se recarga sola cuando vuelve la señal.
 *
 * Encontrado el 25 de septiembre de 2026 verificando la orden 81: `reloadOnOnline: true` en
 * `next.config.js` recargaba cualquier pantalla al volver la conexión. En el salón, con el
 * wifi que va y viene, la fotocabina y la barra se recargaban en medio de la foto o del
 * pedido. La prueba de navegador lo mostraba como "la página navegó" justo al reconectar.
 *
 * Se probo rompiendolo: volviendo a poner `true`, se pone en rojo.
 */
import fs from 'node:fs';
import path from 'node:path';

describe('La pantalla no se recarga al volver la señal', () => {
  it('la configuración de la app no recarga al reconectar', () => {
    const texto = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8');
    expect(texto).toMatch(/reloadOnOnline:\s*false/);
    expect(texto).not.toMatch(/reloadOnOnline:\s*true/);
  });
});
