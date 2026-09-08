import { readData } from '@/lib/data-service';
import type { Invoice } from '@/types/invoice';

const INVOICES_FILE = 'invoices.json';

/**
 * LEER LAS FACTURAS SIN GUARDIA, PARA USO INTERNO.
 *
 * **Ojo: esto NO comprueba permisos.** Existe para los calculos internos que ya
 * tienen su propia guardia -el tablero, los reportes, el flujo de caja- y que
 * necesitan las facturas para sumar totales.
 *
 * La entrada que usa una pantalla es `getInvoices()` en
 * `src/app/actions/invoices.ts`, **y esa si pide el permiso de contabilidad**.
 *
 * Se separo el 8 de septiembre de 2026: hasta ese dia `getInvoices` solo miraba
 * que hubiera una sesion abierta, asi que **cualquiera del equipo con sesion
 * -un operador de estacion, por ejemplo- podia leer todas las facturas** llamando
 * a la accion directo. Esconder el boton no alcanza: la guardia va en el servidor.
 */
export async function leerFacturasSinGuardia(): Promise<Invoice[]> {
  const invoices = await readData<Invoice[]>(INVOICES_FILE, []);
  return invoices.map((inv) => ({ ...inv, payments: inv.payments || [] }));
}
