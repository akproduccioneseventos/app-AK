import fs from 'node:fs';
import path from 'node:path';

/**
 * Las dos cosas de Firebase que ahorran plata, y que quedan vigiladas.
 *
 * **1. La cache en el navegador.** Firebase cobra por lectura. Sin cache, la
 * misma pantalla abierta veinte veces en una noche se lee veinte veces; con
 * 200 invitados mirando el muro, eso se ve en la factura. Y ademas: **si se
 * corta internet en el salon, la app sigue mostrando lo ultimo que leyo** en vez
 * de quedarse en blanco.
 *
 * **2. El portero (App Check).** Sin el, cualquiera que descubra la direccion
 * del muro puede escribir un programita que suba mil fotos falsas o lea datos, y
 * **eso tambien se paga**.
 *
 * Se comprueba mirando el codigo, a proposito: las dos son cosas que se
 * configuran una vez y se **desenganchan sin querer** al tocar la conexion o el
 * armazon. Si alguien las saca, esto se pone en rojo.
 */

const CONFIG = path.join(process.cwd(), 'src/lib/firebase/config.ts');
const ARMAZON = path.join(process.cwd(), 'src/components/app-shell.tsx');

describe('lo de Firebase que ahorra plata', () => {
  it('la base guarda cache en el navegador, para leer menos y aguantar sin internet', () => {
    const codigo = fs.readFileSync(CONFIG, 'utf8');
    expect(codigo).toContain('persistentLocalCache');
    // Varias pestanas a la vez: el operador abre el tablero, la estacion y el
    // muro. Sin esto se pelean por la cache y una queda sin funcionar.
    expect(codigo).toContain('persistentMultipleTabManager');
  });

  it('si el navegador no deja usar la cache, la app sigue andando igual', () => {
    const codigo = fs.readFileSync(CONFIG, 'utf8');
    // En ventana privada la cache falla: tiene que caer a la conexion normal,
    // no romperse.
    expect(codigo).toMatch(/catch\s*\{[\s\S]{0,120}getFirestore\(app\)/);
  });

  it('el portero de la base se prende en TODAS las pantallas, tambien las publicas', () => {
    const codigo = fs.readFileSync(ARMAZON, 'utf8');
    expect(codigo).toContain('app-check');

    // Lo que de verdad importa: que se prenda ANTES del corte que hace el
    // armazon para las pantallas publicas. Las publicas —el muro, las
    // estaciones, el simulador— son justo las que un robot puede golpear.
    const dondeSePrende = codigo.indexOf('app-check');
    const dondeCorta = codigo.indexOf('if (isSpecialRender)');
    expect(dondeSePrende).toBeGreaterThan(-1);
    expect(dondeCorta).toBeGreaterThan(-1);
    expect(dondeSePrende).toBeLessThan(dondeCorta);
  });
});
