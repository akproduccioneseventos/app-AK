import fs from 'fs';
import path from 'path';

/**
 * Pinterest y Google tienen que poder confirmar que el sitio es de la empresa.
 *
 * Por que existe esta prueba: la confirmacion es una etiqueta en el codigo de la
 * pagina. Si alguien reordena los datos de la portada y se la lleva puesta, la
 * cuenta de Pinterest deja de estar verificada y **se pierden las estadisticas y
 * el enlace al sitio en cada foto**, que es justamente lo que trae gente. No se
 * nota mirando la pantalla: hay que controlarlo aca.
 *
 * El valor es publico a proposito, no es una clave.
 */
describe('la verificacion del sitio sigue puesta', () => {
  const layout = fs.readFileSync(path.join(process.cwd(), 'src/app/layout.tsx'), 'utf8');

  it('Pinterest reconoce el dominio', () => {
    expect(layout).toContain('p:domain_verify');
    expect(layout).toContain('63a807fc1e918f1541a865a1794e7852');
  });

  it('Google Search Console sigue enganchado', () => {
    expect(layout).toContain('getSearchConsoleVerification()');
  });
});
