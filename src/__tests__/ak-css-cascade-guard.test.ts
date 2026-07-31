import fs from 'fs';
import path from 'path';

/**
 * Guarda de cascada CSS.
 *
 * La app carga varias hojas de estilo globales en el layout raiz. Con esa
 * cantidad de reglas globales y de `!important`, el ORDEN de carga es lo unico
 * que decide que regla gana: reordenarlas, o sumar una hoja nueva al final,
 * cambia como se ve un modulo que nadie toco.
 *
 * Esta prueba fija ese orden. Si falla, el cambio no esta necesariamente mal:
 * significa que hay que mirar el impacto visual a proposito y, si es correcto,
 * actualizar la lista de abajo en el mismo commit.
 */

const LAYOUT = path.join(process.cwd(), 'src/app/layout.tsx');

/** Orden exacto de carga. El ultimo gana ante igual especificidad. */
const ORDEN_ESPERADO = [
  './globals.css',
  './ak-global-premium.css',
  './ak-public-experience.css',
  './ak-motion-effects.css',
  './ak-release-polish.css',
  './ak-internal-experience-polish.css',
  './ak-no-red-experience.css',
  './ak-budget-mobile-fixes.css',
];

function importsDeCssEnLayout(): string[] {
  const src = fs.readFileSync(LAYOUT, 'utf8');
  return Array.from(src.matchAll(/^\s*import\s+['"](\.[^'"]+\.css)['"];/gm)).map((m) => m[1]);
}

describe('guarda de cascada CSS', () => {
  it('mantiene el orden de carga de las hojas globales', () => {
    expect(importsDeCssEnLayout()).toEqual(ORDEN_ESPERADO);
  });

  it('no suma hojas globales nuevas sin revisar el impacto visual', () => {
    expect(importsDeCssEnLayout()).toHaveLength(ORDEN_ESPERADO.length);
  });

  it('todas las hojas declaradas existen en disco', () => {
    for (const rel of ORDEN_ESPERADO) {
      const archivo = path.join(process.cwd(), 'src/app', rel.replace('./', ''));
      expect(fs.existsSync(archivo)).toBe(true);
    }
  });

  it('no reintroduce en ak-global-premium.css los bloques que pisa ak-public-experience.css', () => {
    // Estos dos selectores quedaban definidos dos veces: la copia temprana era
    // inerte porque la posterior redefinia todas sus propiedades. Se elimino la
    // copia temprana; esta prueba evita que vuelva a aparecer.
    const temprano = fs.readFileSync(path.join(process.cwd(), 'src/app/ak-global-premium.css'), 'utf8');
    expect(temprano).not.toMatch(/^\.ak-red-premium-client\s*\{/m);
    expect(temprano).not.toMatch(/^\.ak-red-premium-live\s*\{/m);
  });
});
