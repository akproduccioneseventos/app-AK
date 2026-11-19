/**
 * Auditoría del 18/11/2026, N26: con un menú asignado y SIN presupuesto, la lista de compras salía vacía. El arreglo
 * del 17/11 sumaba el menú adentro del bloque que sólo corre con presupuesto, y su prueba buscaba el nombre del campo
 * en el archivo: daba verde con la lista vacía.
 */
import fs from 'node:fs';
import path from 'node:path';
import { comprasDelMenuAsignado } from '@/lib/compras/compras-del-menu-asignado';

const menu = {
  items: [
    { id: 'dish_1', name: 'Pollo al horno', ingredients: [{ name: 'Pechuga de pollo', quantityPerPerson: 0.3, unit: 'kg', costoUnitario: 200, origenId: 'ins_1' }] },
    { id: 'dish_2', name: 'Ensalada', ingredients: [] },
  ],
};

it('sin presupuesto, el menú asignado trae sus compras', () => {
  const { compras, sinIngredientes } = comprasDelMenuAsignado(menu, new Set(), 50, [{ id: 'ins_1', valorUnitarioEstimado: 180, proveedor: 'Carnicería' }]);
  expect(compras).toEqual([expect.objectContaining({ nombre: 'Pechuga de pollo', cantidadNecesaria: 15, costoUnitario: 180, proveedor: 'Carnicería' })]);
  expect(sinIngredientes).toEqual(['Ensalada']);
});

it('un plato que ya trae el presupuesto no se compra dos veces', () => {
  expect(comprasDelMenuAsignado(menu, new Set(['dish_1']), 50, []).compras).toHaveLength(0);
});

it('la pantalla lo llama fuera del bloque del presupuesto', () => {
  const fuente = fs.readFileSync(path.resolve(__dirname, '../components/panels/catering--lista-compras.tsx'), 'utf8');
  const llamada = fuente.split('\n').find(l => l.includes('comprasDelMenuAsignado('));
  // Seis espacios: el nivel del cuerpo de la carga, no el de adentro del `if (presupuestoData)`.
  expect(llamada).toMatch(/^ {6}const delMenu = comprasDelMenuAsignado\(/);
});
