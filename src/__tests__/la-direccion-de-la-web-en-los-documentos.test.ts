import fs from 'fs';
import path from 'path';

/**
 * Los documentos que ve el cliente llevan la direccion real de la web.
 *
 * Por que existe esta prueba: el presupuesto impreso, el PDF y la pantalla del
 * presupuesto mostraban `www.akproduccioneseventos.com`, que no es el sitio de la
 * empresa. El cliente que la escribia no llegaba a ningun lado, justo en el
 * momento en que estaba mirando el precio y decidiendo. Es de las cosas que
 * hacen perder una venta sin que nadie se entere.
 */
const DOCUMENTOS = [
  'src/components/presupuestos/paso-4-resumen.tsx',
  'src/components/presupuestos/BudgetPrintTemplate.tsx',
  'src/components/budget/BudgetDocument.tsx',
  'src/app/(app)/presupuestos/[id]/ver/page.tsx',
];

describe('la direccion de la web en los documentos del cliente', () => {
  it.each(DOCUMENTOS)('%s muestra el sitio real', (archivo) => {
    const fuente = fs.readFileSync(path.join(process.cwd(), archivo), 'utf8');

    expect(fuente).toContain('www.akproducciones.uy');
    expect(fuente).not.toContain('akproduccioneseventos.com');
  });
});
