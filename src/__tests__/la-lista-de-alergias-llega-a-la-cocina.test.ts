/**
 * MATAFUEGO — La lista de alergias y celiacos LLEGA a la cocina, aunque el navegador bloquee
 * el portapapeles.
 *
 * Pantalla: /fiestas/nueva/alergias (`src/app/(app)/fiestas/nueva/alergias/page.tsx`).
 *
 * Antes decia "✅ Reporte copiado" pase lo que pase. Con el portapapeles bloqueado, la lista
 * de quien es celiaco o alergico no estaba en ningun lado y el encargado creia haberla mandado.
 * Es comida: un error ahi le puede hacer mal a un invitado.
 *
 * Ahora se espera la copia; si falla, **se baja el reporte como archivo** y se avisa.
 *
 * Se probo rompiendolo a proposito: volviendo al cartel sin esperar, se pone en rojo.
 */
import fs from 'fs';
import path from 'path';

const PANTALLA = fs.readFileSync(
  path.join(process.cwd(), 'src', 'app', '(app)', 'fiestas', 'nueva', 'alergias', 'page.tsx'),
  'utf-8',
);

describe('La lista de alergias llega a la cocina', () => {
  const inicio = PANTALLA.indexOf('navigator.clipboard.writeText(lines.join');
  const bloque = PANTALLA.slice(inicio, PANTALLA.indexOf('\n  };', inicio));

  it('el cartel de copiado sale SOLO si la copia funciono', () => {
    expect(bloque).toMatch(/writeText\(lines\.join\('\\n'\)\)\.then\(/);
    expect(bloque.indexOf('.then(')).toBeLessThan(bloque.indexOf('Reporte copiado'));
  });

  it('si la copia falla, baja el reporte como archivo y lo dice', () => {
    expect(bloque).toContain('a.download');
    expect(bloque).toContain('No se pudo copiar');
  });
});
