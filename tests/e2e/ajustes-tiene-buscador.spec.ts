import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

test.describe('Ajustes tiene buscador (Orden 283)', () => {
  test('escribir "seña" en el buscador de Ajustes deja visible la sección de seña y oculta las demás', async ({ page, context, baseURL }) => {
    await ponerSesionDelEquipo(context, baseURL);
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Secciones de la pantalla
    const seccionSena = page.getByTestId('seccion-sena-y-promociones');
    const seccionEmpresa = page.getByTestId('seccion-empresa-y-presupuesto');
    const seccionWhatsapp = page.getByTestId('seccion-whatsapp-y-conexiones');
    const seccionTareas = page.getByTestId('seccion-tareas-automaticas');
    const seccionContrato = page.getByTestId('seccion-contrato');
    const seccionAsistente = page.getByTestId('seccion-asistente-ia');
    const seccionSeguridad = page.getByTestId('seccion-seguridad-y-usuarios');
    const seccionFotos = page.getByTestId('seccion-estilo-de-fotos');
    const seccionAvanzado = page.getByTestId('seccion-avanzado');

    // Inicialmente las secciones principales están visibles
    await expect(seccionSena).toBeVisible();
    await expect(seccionEmpresa).toBeVisible();

    // Escribir "seña" en el buscador
    const buscador = page.getByPlaceholder('¿qué querés cambiar?');
    await expect(buscador).toBeVisible();
    await buscador.fill('seña');

    // La sección de seña debe quedar visible
    await expect(seccionSena).toBeVisible();
    await expect(page.getByText('Política de Señas y Reservas')).toBeVisible();

    // Todas las demás secciones deben quedar ocultas
    await expect(seccionEmpresa).toBeHidden();
    await expect(seccionWhatsapp).toBeHidden();
    await expect(seccionTareas).toBeHidden();
    await expect(seccionContrato).toBeHidden();
    await expect(seccionAsistente).toBeHidden();
    await expect(seccionSeguridad).toBeHidden();
    await expect(seccionFotos).toBeHidden();
    await expect(seccionAvanzado).toBeHidden();
  });
});
