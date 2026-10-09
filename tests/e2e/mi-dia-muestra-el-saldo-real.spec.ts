/**
 * Codex, auditoría 81: el parte de la mañana de "Mi día" restaba del saldo un pago A CONFIRMAR
 * y, armado sin sesión, decía "todo al día". Esta prueba abre "Mi día" con una fiesta en cinco
 * días y mira el saldo que ve el equipo: 100.000 - 30.000 confirmados = 70.000, sin restar los
 * 50.000 que el cliente informó y nadie confirmó (con el código viejo decía 20.000).
 */
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { borrarFiesta, guardarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const FIESTA = 'e2e-mi-dia-saldo';
const PRESUPUESTO = 'e2e-mi-dia-presupuesto';
const ARCHIVOS_PRESUPUESTOS = ['data', path.join('src', 'data')].map((c) => path.join(process.cwd(), c, 'presupuestos.json'));
const CACHES = ['data', path.join('src', 'data')].map((c) => path.join(process.cwd(), c, 'parte-manana-cache.json'));
const anteriores = new Map<string, Buffer | null>();

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T21:00:00`;
}

const borrarCaches = () => CACHES.forEach((f) => fs.rmSync(f, { force: true }));

test.beforeAll(() => {
  for (const archivo of ARCHIVOS_PRESUPUESTOS) {
    anteriores.set(archivo, fs.existsSync(archivo) ? fs.readFileSync(archivo) : null);
    let lista: any[] = [];
    try { lista = JSON.parse(fs.readFileSync(archivo, 'utf8')); } catch { lista = []; }
    if (!Array.isArray(lista)) lista = [];
    lista = lista.filter((p) => p?.id !== PRESUPUESTO);
    lista.push({
      id: PRESUPUESTO,
      clienteNombre: 'Prospecto E2E Mi Dia',
      totalConDescuento: 100_000,
      costoTotalEstimado: 100_000,
      estado: 'Aprobado',
      pagosCliente: [
        { id: 'pg1', monto: 30_000, estadoPago: 'confirmado', fecha: enDias(-10) },
        { id: 'pg2', monto: 50_000, estadoPago: 'pendiente_confirmacion', fecha: enDias(-1) },
      ],
    });
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify(lista, null, 2)}\n`);
  }
  guardarFiesta({
    id: FIESTA,
    presupuestoId: PRESUPUESTO,
    estado: 'Confirmada',
    menuAsignadoId: 'menu-e2e',
    invitados: [{ id: 'i1', nombre: 'Invitado', rsvp: 'Confirmado' }],
    configuracion: { fechaEvento: enDias(5), nombreEvento: 'Fiesta E2E Mi Dia' },
  } as any);
  borrarCaches();
});

test.afterAll(() => {
  for (const [archivo, antes] of anteriores) {
    if (antes === null) fs.rmSync(archivo, { force: true });
    else fs.writeFileSync(archivo, antes);
  }
  borrarFiesta(FIESTA);
  borrarCaches();
});

test('Mi día muestra el saldo sin restar el pago a confirmar', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto('/mi-dia');

  const cobranza = page.getByText('Cobranza de Prospecto E2E Mi Dia').first();
  await expect(cobranza).toBeVisible({ timeout: 30_000 });
  const detalle = page.getByText(/Saldo de \$[\d.]+ para la fiesta/).first();
  await expect(detalle).toContainText('70.000');
  await expect(detalle).not.toContainText('20.000');
  // El parte hablado nombra la cobranza (con el parte armado sin datos decía "todo al día").
  await expect(page.getByText(/Buen día\. Hoy tenemos \d+ puntos? para avanzar: .*cobranza de prospecto e2e mi dia/i)).toHaveCount(1);
});
