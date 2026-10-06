import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, leerFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * Orden 120 (Codex, auditoría 70, PLAN01): guardar el plan de cuotas con la versión que se abrió
 * NO deshace una cuota que otro marcó pagada entretanto. La pantalla pide recargar.
 *
 * Se probó rompiéndola: sin `versionLeida` en la pantalla, el guardado pisa y la cuota vuelve a
 * pendiente.
 */
const fiesta = crearFiestaDeEstaNoche({ id: `e2e_plan_cuotas_${Date.now()}` });
const cuota = (id: string, extra: Record<string, unknown> = {}) => ({
  id, descripcion: `Cuota ${id}`, monto: 1000, fechaVencimiento: '2026-12-01', estado: 'pendiente', ...extra,
});

test.beforeAll(() => {
  (fiesta as any).planDePagos = {
    id: 'plan_e2e', fiestaId: fiesta.id, notas: '', createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    cuotas: [cuota('c1', { estado: 'pagado', montoPagado: 1000 }), cuota('c2')],
  };
  guardarFiesta(fiesta);
});
test.afterAll(() => borrarFiesta(fiesta.id));

test('guardar un plan abierto antes de un cobro pide recargar y no deshace el cobro', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto(`/fiestas/nueva/plan-pagos?fiestaId=${fiesta.id}`, { waitUntil: 'domcontentloaded' });
  const guardar = page.getByRole('button', { name: /Guardar Plan de Pagos/ });
  await expect(guardar).toBeVisible({ timeout: 30_000 });

  // Mientras la pantalla está abierta, otra persona marca la cuota 2 como pagada.
  const otra = leerFiesta(fiesta.id);
  otra.planDePagos.cuotas[1] = { ...otra.planDePagos.cuotas[1], estado: 'pagado', montoPagado: 1000 };
  otra.planDePagos.updatedAt = '2026-10-06T12:00:00.000Z';
  guardarFiesta(otra);

  await guardar.click();
  await expect(page.getByText(/Recargá la pantalla/).first()).toBeVisible({ timeout: 20_000 });
  const guardada = leerFiesta(fiesta.id);
  expect(guardada.planDePagos.cuotas[1].estado).toBe('pagado');
  expect(guardada.planDePagos.cuotas[1].montoPagado).toBe(1000);
});
