import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

/**
 * A Google no se le declara un precio que nadie puso.
 *
 * **Paso de verdad.** La ficha de servicio de bodas y quince declaraba una oferta de
 * `price: "1000"` en **dolares**, un valor por defecto que ninguna pagina pasaba. Google
 * puede mostrar ese numero en los resultados: una boda de AK "desde USD 1000", un precio
 * que el dueno nunca puso y en una moneda que no usa.
 *
 * Dos reglas del proyecto en una sola linea de codigo: **se trabaja solo en pesos
 * uruguayos**, y **ninguna pantalla afirma algo que no comprobo**.
 *
 * Una fiesta no tiene precio de lista: depende de los invitados, la fecha, el salon y los
 * servicios. Por eso se cotiza.
 */
describe('Google no ve precios inventados', () => {
  it('la ficha de servicio no declara ninguna oferta con precio', () => {
    const fuente = leer('src/components/seo/ServiceJsonLd.tsx');
    const codigo = fuente
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');

    expect(codigo).not.toMatch(/"offers"/);
    expect(codigo).not.toMatch(/priceCurrency/);
    expect(codigo).not.toMatch(/"price"/);
  });

  it('ninguna ficha para Google declara precios en dolares', () => {
    for (const archivo of [
      'src/components/seo/ServiceJsonLd.tsx',
      'src/components/seo/LocalBusinessJsonLd.tsx',
      'src/components/public/LocalBusinessSchema.tsx',
    ]) {
      const codigo = leer(archivo)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      expect(codigo).not.toMatch(/"USD"/);
    }
  });
});
