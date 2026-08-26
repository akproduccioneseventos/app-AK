import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

/**
 * Los botones que mueven plata nunca se quedan girando para siempre.
 *
 * De donde sale esto: el boton de ingreso quedaba en "Ingresando..." sin fin, sin error
 * y sin poder reintentar. **No era un error de programacion**: todos los caminos de error
 * existian, pero ninguno se alcanzaba nunca, porque la llamada al servidor no tenia tope.
 * Si el servidor se esta despertando o la conexion se corta sin avisar, la promesa no se
 * resuelve ni falla: se queda. Y con ella, el `finally` que devolvia el boton.
 *
 * Con plata es peor que con el ingreso: alguien aprieta "confirmar pago" y se queda sin
 * saber si el cobro entro. Lo mas probable es que apriete de nuevo.
 */
describe('Los botones de plata no se cuelgan', () => {
  it('confirmar y rechazar un pago tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/pagos-rapidos/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(confirmPagoCliente(');
    expect(fuente).toContain('conTopeDeEspera(rejectPagoCliente(');
  });

  it('guardar un presupuesto tiene tope de espera', () => {
    const fuente = leer('src/app/(app)/presupuestos/nuevo/crear/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(updatePresupuesto(');
    expect(fuente).toContain('conTopeDeEspera(savePresupuesto(');
  });

  it('el aviso dice que no se guardo nada, para que nadie apriete dos veces', () => {
    const fuente = leer('src/lib/ui/tope-de-espera.ts');

    expect(fuente).toMatch(/No se guardo nada/i);
    // El tope es largo a proposito: el servidor se duerme y la primera operacion del dia
    // tarda. Cortar antes seria peor que no tener tope.
    expect(fuente).toContain('25_000');
  });
});
