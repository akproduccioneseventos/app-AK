/**
 * MATAFUEGO de los cinco defectos contables del 8 de septiembre de 2026.
 *
 * Los cinco tenian la misma forma: **la app decia que si y no habia pasado nada**.
 * Un cobro que se perdia, una cuota que se anunciaba cobrada sin guardarse, una
 * conciliacion que fallaba en silencio, un flujo de caja en cero falso, y las
 * facturas de la empresa legibles por cualquiera del equipo con sesion.
 *
 * Cada comprobacion de este archivo se probo **rompiendola a proposito**: al volver
 * el codigo a como estaba, se pone en rojo.
 */
import fs from 'node:fs';
import path from 'node:path';

function leer(rel: string) {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

describe('La contabilidad no dice que si sin haberlo hecho', () => {
  describe('CON-05: las facturas piden el permiso de contabilidad, no solo sesion', () => {
    const fuente = leer('src/app/actions/invoices.ts');

    it('la entrada que usan las pantallas exige el permiso de contabilidad', () => {
      const entrada = fuente.slice(
        fuente.indexOf('export async function getInvoices('),
        fuente.indexOf('export async function getInvoiceById('),
      );
      expect(entrada).toContain('requirePermiso(PERMISOS.CONTABILIDAD)');
      // Y no alcanza con mirar que haya sesion abierta.
      expect(entrada).not.toContain('verifySession()');
    });

    it('leer una factura suelta tambien lo exige', () => {
      const entrada = fuente.slice(fuente.indexOf('export async function getInvoiceById('));
      expect(entrada.slice(0, 400)).toContain('requirePermiso(PERMISOS.CONTABILIDAD)');
    });

    it('cargar un cobro en una factura tambien lo exige', () => {
      const entrada = fuente.slice(fuente.indexOf('async function addPaymentToInvoiceInner('));
      expect(entrada.slice(0, 500)).toContain('requirePermiso(PERMISOS.CONTABILIDAD)');
    });

    it('la lectura interna sin guardia vive fuera de las acciones y avisa que no controla nada', () => {
      const interna = leer('src/lib/invoices/leer-facturas.ts');
      expect(interna).not.toContain("'use server'");
      expect(interna).toContain('NO comprueba permisos');
    });
  });

  describe('CON-03 y CON-02: el cobro se lee y se guarda sin soltar el turno', () => {
    const fuente = leer('src/app/actions/presupuestos.ts');
    const alta = fuente.slice(
      fuente.indexOf('export async function addPagoToPresupuesto('),
      fuente.indexOf('export async function deletePagoFromPresupuesto('),
    );

    it('lee el presupuesto adentro del turno, no antes', () => {
      const turno = alta.indexOf('presupuestosMutex.runExclusive');
      const lectura = alta.indexOf('await getPresupuestos(true)');
      expect(turno).toBeGreaterThan(-1);
      expect(lectura).toBeGreaterThan(turno);
    });

    it('no vuelve a pedir el turno estando adentro: guardaria colgado para siempre', () => {
      expect(alta).toContain('guardarPresupuestoSinTurno');
      expect(alta).not.toContain('await updatePresupuesto(');
    });

    it('si falla la conciliacion con la factura, NO contesta que salio bien', () => {
      expect(alta).toContain('if (!reclamo.success)');
    });

    it('un cobro que la factura trae confirmado deja de estar pendiente en el presupuesto', () => {
      expect(alta).toContain("existente.estadoPago === 'pendiente_confirmacion'");
      expect(alta).toContain("estadoPago: 'confirmado' as const");
    });

    it('el guardado sin turno no se puede llamar desde afuera', () => {
      expect(fuente).toContain('async function guardarPresupuestoSinTurno(');
      expect(fuente).not.toContain('export async function guardarPresupuestoSinTurno(');
    });
  });

  describe('CON-01: una cuota no se anuncia cobrada si no se guardo', () => {
    const fuente = leer('src/app/actions/payment-plans.ts');

    it('mira el resultado de guardar antes de contestar', () => {
      const accion = fuente.slice(fuente.indexOf('export async function updateCuotaEstado('));
      const guardado = accion.indexOf('const guardado = await saveFiesta(');
      const aviso = accion.indexOf('notifyClientPaymentApproved');
      expect(guardado).toBeGreaterThan(-1);
      expect(accion).toContain('if (!guardado.success)');
      // El aviso al cliente va DESPUES de comprobar que quedo guardado.
      expect(aviso).toBeGreaterThan(guardado);
    });

    it('rechaza una cuota que no existe en el plan', () => {
      expect(fuente).toContain('La cuota no existe en este plan.');
    });

    it('no le manda dos veces el mismo aviso al cliente', () => {
      expect(fuente).toContain("cuotaOriginal.estado !== 'pagado'");
    });

    it('guardar el plan tambien mira si se guardo', () => {
      const accion = fuente.slice(0, fuente.indexOf('export async function updateCuotaEstado('));
      expect(accion).toContain('const guardado = await saveFiesta(');
      expect(accion).toContain('if (!guardado.success)');
    });
  });

  describe('CON-04: el flujo de caja distingue cero de no-se-pudo-leer', () => {
    it('si fallan todas las fuentes, no devuelve seis meses en cero', () => {
      const fuente = leer('src/app/actions/dashboard.ts');
      const accion = fuente.slice(fuente.indexOf('export async function getCashFlowProjection('));
      expect(accion).toContain('fuentesCaidas');
      expect(accion).toContain('Los ceros que se ven no son reales');
      expect(accion).not.toContain('CashFlow getInvoices failed');
    });

    it('la pantalla muestra el error en vez de los ceros', () => {
      const pantalla = leer('src/app/(app)/empresa/contabilidad/flujo-caja/page.tsx');
      expect(pantalla).toContain('No se pudo calcular el flujo de caja');
      expect(pantalla).toContain('fuentesCaidas');
    });
  });
});
