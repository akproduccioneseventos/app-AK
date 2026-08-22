/**
 * El despertador tiene que llamar a una puerta que exista.
 *
 * Por que existe esta prueba: el despertador se entrego llamando a
 * `/api/cron/despachador` cuando la puerta vivia en `/api/cron-despachador`.
 * Una barra donde iba un guion. Cada 15 minutos iba a golpear una puerta que no
 * esta, el error quedaba anotado en un registro que nadie mira, y la app se
 * quedaba tan dormida como antes **sin que nada lo avisara**.
 *
 * Los cuatro controles pasaron igual: compilaba, los tipos daban cero y las 2095
 * pruebas estaban en verde. Compilar no es andar.
 *
 * Si esta prueba se pone en rojo: la direccion a la que llama el despertador no
 * corresponde a ninguna ruta de la aplicacion. Corregi una de las dos.
 */
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();
const DESPERTADOR = path.join(RAIZ, 'functions/src/index.ts');

describe('El despertador llama a una puerta que existe', () => {
  it('cada direccion del sitio que llama el despertador corresponde a una ruta real', () => {
    const codigo = readFileSync(DESPERTADOR, 'utf8');

    // Las direcciones se arman como `${appUrl}/api/...`
    const llamadas = [...codigo.matchAll(/\$\{appUrl\}(\/api\/[a-zA-Z0-9\-_/]*)/g)]
      .map((m) => m[1])
      .filter((ruta, i, todas) => todas.indexOf(ruta) === i);

    expect(llamadas.length).toBeGreaterThan(0);

    const inventadas = llamadas.filter((ruta) => {
      const carpeta = path.join(RAIZ, 'src/app', ruta.replace(/^\//, ''));
      return !existsSync(path.join(carpeta, 'route.ts')) && !existsSync(path.join(carpeta, 'route.tsx'));
    });

    expect(inventadas).toEqual([]);
  });

  it('el despertador esta programado y no quedo apagado', () => {
    const codigo = readFileSync(DESPERTADOR, 'utf8');
    expect(codigo).toMatch(/pubsub\s*\n?\s*\.schedule\(|\.schedule\(/);
    expect(codigo).toContain('every 15 minutes');
  });
});
