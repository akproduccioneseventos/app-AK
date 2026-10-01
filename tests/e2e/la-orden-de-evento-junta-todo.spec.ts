import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  ponerSesionDelEquipo,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  leerFiesta,
} from './helpers/fiesta-de-prueba';
import { readData, writeData } from '@/lib/data-service';

const FIESTA_ID = `e2e_orden_evento_${process.pid}_${Date.now()}`;
const EMPLEADO_NOMBRE = 'Gonzalo DJ Operativo';
const PROGRAMA_TITULO = 'Ingreso de los novios con fuegos fríos';

test.describe('Orden 95: La orden de evento junta todo en una hoja sin precios', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Boda Operativa Demo';
    fiesta.programa = [
      {
        hora: '22:00',
        actividad: PROGRAMA_TITULO,
        responsable: 'DJ',
      } as any,
    ];

    // Asignar personal
    fiesta.personalAsignado = [
      {
        empleadoId: 'emp_gonzalo_dj',
        rolId: 'rol_dj',
        eventSalary: 5000, // No debe figurar en pantalla
      } as any,
    ];

    guardarFiesta(fiesta);

    // Sembrar empleado en empleados.json
    try {
      const empleados = await readData<any[]>('empleados.json', []);
      if (!empleados.some((e) => e.id === 'emp_gonzalo_dj')) {
        empleados.push({
          id: 'emp_gonzalo_dj',
          nombre: EMPLEADO_NOMBRE,
          role: 'DJ',
        });
        await writeData('empleados.json', empleados);
      }
    } catch {}
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
    // Limpiar el empleado de prueba para no dejar datos sucios
    try {
      const empleados = await readData<any[]>('empleados.json', []);
      const sin = empleados.filter((e) => e.id !== 'emp_gonzalo_dj');
      if (sin.length !== empleados.length) {
        await writeData('empleados.json', sin);
      }
    } catch {}
  });

  test('la hoja muestra el programa y el empleado sin ningún signo $', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(90_000);

    if (!leerFiesta(FIESTA_ID)) {
      throw new Error(`la fiesta de prueba no está en disco: ${FIESTA_ID}`);
    }

    await ponerSesionDelEquipo(context, baseURL);

    await page.addInitScript(() => {
      try {
        localStorage.setItem('ak_session', 'true');
        sessionStorage.setItem('ak_session', 'true');
      } catch {}
    });

    // 1. Visitar la pantalla de orden de evento
    await page.goto(`/fiestas/nueva/orden-de-evento?fiestaId=${FIESTA_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    // 2. Verificar que el título del programa y el nombre del empleado aparezcan en la hoja
    const textoPrograma = page.getByText(PROGRAMA_TITULO);
    await expect(textoPrograma).toContainText(PROGRAMA_TITULO);

    const textoEmpleado = page.getByText(EMPLEADO_NOMBRE);
    await expect(textoEmpleado).toContainText(EMPLEADO_NOMBRE);

    // 3. Comprobar que en toda la página NO aparezca ningún signo $
    const contenidoCompleto = await page.content();
    // Quitamos posibles tags o scripts para verificar texto visible
    const textoVisible = await page.innerText('body');
    expect(textoVisible).not.toContain('$');
  });
});
