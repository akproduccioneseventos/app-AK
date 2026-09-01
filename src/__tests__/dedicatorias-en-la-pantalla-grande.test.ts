import fs from 'node:fs';
import path from 'node:path';

/**
 * Las dedicatorias del invitado tienen que poder salir en la pantalla grande.
 *
 * Estuvieron apagadas con un `false` clavado en el codigo mientras el operador
 * tenia tres formas de encenderlas —el ajuste `showDedications`, el item
 * 'dedicaciones' de la lista de la pantalla, y el boton para forzarlo desde el
 * celular—. Tocaba las tres y no pasaba nada, y el invitado escribia dedicatorias
 * que no veia nadie en la fiesta.
 *
 * Esta prueba no comprueba que se vean: comprueba que **no vuelvan a quedar
 * apagadas a mano**, que es como estuvieron. Si alguien vuelve a poner un `false`
 * delante de ese bloque, esto se pone en rojo.
 */

const PANTALLA = path.join(
  process.cwd(),
  'src/app/evento/muro-en-vivo/[fiestaId]/page.tsx',
);

describe('las dedicatorias no estan apagadas a mano', () => {
  const codigo = fs.readFileSync(PANTALLA, 'utf8');

  it('el bloque de dedicatorias no esta clavado en apagado', () => {
    expect(codigo).not.toMatch(/\{\s*false\s*&&[^}]*type === 'dedicaciones'/);
  });

  it('quien decide es el operador, con el ajuste y la lista de la pantalla', () => {
    const bloque = codigo.slice(codigo.indexOf("activeScreenItem?.type === 'dedicaciones'") - 200);
    expect(bloque).toContain("activeScreenItem?.type === 'dedicaciones'");
    // El ajuste de dedicatorias privadas sigue mandando: si esta puesto, no salen.
    expect(bloque).toContain('privateDedicationsMode');
  });
});
