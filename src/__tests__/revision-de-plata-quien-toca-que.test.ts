/**
 * MATAFUEGO — Revisión de plata y simulador del 6/10/2026, pedida por el dueño ("asegurá cero
 * errores contables y del simulador").
 *
 * Pasando por cada acción de plata la pregunta 35 (¿pide el permiso del perfil o sólo sesión?) y
 * la 36 (¿el mismo número se calcula igual en todos lados?), aparecieron: presupuestos que se
 * armaban, aceptaban, facturaban o archivaban con sólo sesión; el catálogo de precios y el ajuste
 * masivo de precios, igual; los pagos a proveedores, el reporte de ganancias, el flujo de caja, los
 * avisos de pago al cliente y "cuánto me deben" del asistente, igual. Y dos saldos sin el ajuste
 * anual: la pantalla del cliente antes de firmar y la lista de deudores del asistente.
 *
 * Se probó rompiéndolo: sacando el control de cualquiera de estas funciones, su línea da rojo.
 */
import fs from 'fs';
import path from 'path';

const leer = (f: string) => fs.readFileSync(path.join(process.cwd(), f), 'utf-8');
function cuerpo(archivo: string, nombre: string): string {
  const texto = leer(archivo);
  const desde = texto.indexOf(`export async function ${nombre}(`);
  if (desde === -1) throw new Error(`No encontré ${nombre} en ${archivo}`);
  const resto = texto.slice(desde + 10);
  const hasta = resto.search(/\nexport (async )?function /);
  return hasta === -1 ? resto : resto.slice(0, hasta);
}

const CASOS: Array<[string, string, RegExp]> = [
  ['src/app/actions/presupuestos.ts', 'savePresupuesto', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD, PERMISOS\.CRM, PERMISOS\.ORGANIZACION\)/],
  ['src/app/actions/presupuestos.ts', 'importarPresupuestoDesdeTexto', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD, PERMISOS\.CRM\)/],
  ['src/app/actions/presupuestos.ts', 'approvePresupuesto', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/presupuestos.ts', 'markPresupuestoAsFacturado', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/presupuestos.ts', 'createFiestaFromPresupuesto', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD, PERMISOS\.ORGANIZACION\)/],
  ['src/app/actions/presupuestos.ts', 'archivePresupuesto', /verifySessionConPermiso\(PERMISOS\.CONTABILIDAD, PERMISOS\.CRM\)/],
  ['src/app/actions/servicios-empresa.ts', 'saveServicioEmpresa', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD, PERMISOS\.INSUMOS\)/],
  ['src/app/actions/servicios-empresa.ts', 'deleteServicioEmpresa', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD, PERMISOS\.INSUMOS\)/],
  ['src/app/actions/servicios-empresa.ts', 'adjustAllServicePrices', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/fiesta/pagos.actions.ts', 'updatePagosProveedores', /requireEventPermission\(fiestaId, PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/reportes.ts', 'getProfitAndLossData', /requirePermisoAlguno\(PERMISOS\.GANANCIAS\)/],
  ['src/app/actions/dashboard.ts', 'getCashFlowProjection', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/google-workspace-extended.ts', 'notifyClientPaymentApproved', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/google-workspace-extended.ts', 'notifyPresupuestoPaymentRegistered', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/fiesta/fiesta.actions.ts', 'addInvoiceId', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/fiesta/fiesta.actions.ts', 'updateFiestaPresupuestoId', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
  ['src/app/actions/marketing-ads.ts', 'actualizarTopePublicidad', /requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/],
];

describe('Cada acción de plata pide el perfil, no sólo la sesión', () => {
  it.each(CASOS)('%s → %s', (archivo, nombre, control) => {
    expect(cuerpo(archivo, nombre)).toMatch(control);
  });

  it('el ajuste de precios de venta pide contabilidad', () => {
    expect(leer('src/app/actions/price-adjustments.ts')).toMatch(/requireAppSession = \(\) => requirePermisoAlguno\(PERMISOS\.CONTABILIDAD\)/);
  });

  it('"cuánto me deben" del asistente pide contabilidad', () => {
    const t = leer('src/app/actions/multiagent.ts');
    const tramo = t.slice(t.indexOf("if (accion === 'cuanto_me_deben')"), t.indexOf("if (accion === 'cuanto_me_deben')") + 400);
    expect(tramo).toMatch(/requirePermiso\(PERMISOS\.CONTABILIDAD\)/);
  });
});

describe('Pregunta 36: el saldo es el mismo en todos lados', () => {
  it('la pantalla del cliente antes de firmar usa el total con ajuste anual', () => {
    expect(cuerpo('src/app/actions/fiesta/documentos.actions.ts', 'getContractSigningSummary')).toMatch(/getBudgetCollectibleTotal\(presupuesto\)/);
  });

  it('la lista de deudores del asistente usa el resumen de cobro con ajuste y sólo presupuestos aceptados', () => {
    // La cuenta vive en un solo lugar (calcularDeudas) y la comparten cuanto_me_deben y el contexto
    // del asistente: así los dos dicen el mismo número.
    const t = leer('src/app/actions/multiagent.ts');
    const cuenta = leer('src/lib/multiagent/contexto-negocio.ts');
    expect(t).toMatch(/calcularDeudas\(presupuestos\)/);
    expect(cuenta).toMatch(/getBudgetPaymentSummary\(p, \{ includeAnnualAdjustment: true \}\)\.balance/);
    expect(cuenta).toMatch(/p\.estado !== 'Aceptado' && p\.estado !== 'Facturado'/);
    expect(t).not.toMatch(/p\.totalFinal \|\| p\.total/);
  });
});
