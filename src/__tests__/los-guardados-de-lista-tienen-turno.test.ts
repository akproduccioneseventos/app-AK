/** @jest-environment node */
/**
 * LO QUE REESCRIBE UNA LISTA ENTERA TIENE QUE TENER TURNO.
 *
 * **Salio de la pregunta quince del metodo, el 17 de septiembre de 2026:** "¿que pasa cuando la
 * lista se hace larga y dos guardan a la vez?".
 *
 * Esta app guarda listas completas: para cambiar un renglon, lee todo y escribe todo. Sin turno,
 * dos personas guardando casi al mismo tiempo hacen que **el segundo escriba encima de la lista
 * vieja y el cambio del primero desaparezca**, con las dos pantallas diciendo "guardado". No hay
 * error, no hay aviso, no queda rastro: el ingrediente, el menu o el ajuste de precio
 * sencillamente no esta.
 *
 * **Lo que esta prueba mira:** que cada una de estas acciones pase por un turno. No mira que el
 * turno funcione —eso lo prueba `src/lib/mutex.ts` y las pruebas de cobros—, mira que este
 * puesto, que es lo que se olvida.
 */
import fs from 'fs';
import path from 'path';

const DEBEN_TENER_TURNO: Array<{ archivo: string; funciones: string[] }> = [
  { archivo: 'src/app/actions/insumos.ts', funciones: ['saveInsumo', 'deleteInsumo', 'adjustAllInsumoCosts'] },
  { archivo: 'src/app/actions/menus-catering.ts', funciones: ['saveMenu', 'deleteMenu', 'adjustAllDishMargins'] },
  { archivo: 'src/app/actions/price-adjustments.ts', funciones: ['applyPriceAdjustment', 'revertPriceAdjustment'] },
  { archivo: 'src/app/actions/settings.ts', funciones: ['saveCompanyInfo', 'saveInvoiceTemplateSettings'] },
  { archivo: 'src/app/actions/feedback.ts', funciones: ['saveFeedback'] },
];

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf-8');
}

describe('Los guardados que reescriben una lista entera pasan por un turno', () => {
  it.each(DEBEN_TENER_TURNO)('$archivo', ({ archivo, funciones }) => {
    const codigo = leer(archivo);
    expect(codigo).toContain('AsyncMutex');

    for (const funcion of funciones) {
      // Se mira SOLO el cuerpo de esa funcion exportada, hasta donde empieza la siguiente. Si se
      // mirara el archivo entero, el turno de la funcion de al lado la haria pasar sin tenerlo:
      // asi paso al probar este control rompiendolo, el 17 de septiembre de 2026.
      const arranca = codigo.indexOf(`export async function ${funcion}(`);
      expect(arranca).toBeGreaterThan(-1);
      const resto = codigo.slice(arranca + 10);
      const siguiente = resto.search(/\n(export )?async function /);
      const cuerpo = siguiente === -1 ? resto : resto.slice(0, siguiente);

      expect(cuerpo).toContain('runExclusive');
    }
  });

  it('el presupuesto que se repara de una pasa por el turno de presupuestos', () => {
    const codigo = leer('src/app/actions/presupuestos.ts');
    const reparar = codigo.slice(codigo.indexOf('export async function repairVerifiedBudgetDates'));
    expect(reparar.slice(0, 800)).toContain('presupuestosMutex.runExclusive');
  });
});
