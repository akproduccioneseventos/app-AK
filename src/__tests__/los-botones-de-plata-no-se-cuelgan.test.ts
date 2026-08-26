import { readFileSync } from 'fs';
import { join } from 'path';

const RAIZ = process.cwd();
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), 'utf-8');

/**
 * Los botones que confirman o guardan cambios nunca se quedan girando para siempre.
 */
describe('Los botones de mutación y plata no se cuelgan', () => {
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

  it('guardar y resolver incidentes tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/incidentes/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(createIncidente(');
    expect(fuente).toContain('conTopeDeEspera(resolverIncidente(');
  });

  it('guardar módulos de fiesta tiene tope de espera', () => {
    const fuente = leer('src/app/(app)/fiestas/nueva/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(updateModulosContratadosFiestaActual(');
  });

  it('guardar menú y repostería maestra tienen tope de espera', () => {
    const fuente = leer('src/app/(app)/empresa/menus/page.tsx');

    expect(fuente).toContain('conTopeDeEspera(saveReposteriaMasterTemplate(');
  });

  it('el aviso dice que no se guardo nada, para que nadie apriete dos veces', () => {
    const fuente = leer('src/lib/ui/tope-de-espera.ts');

    expect(fuente).toMatch(/No se guardo nada/i);
    // El tope es largo a proposito: el servidor se duerme y la primera operacion del dia
    // tarda. Cortar antes seria peor que no tener tope.
    expect(fuente).toContain('25_000');
  });
});
