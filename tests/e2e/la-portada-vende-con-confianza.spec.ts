import { expect, test } from '@playwright/test';

test.describe('Orden 245: La portada vende con confianza', () => {
  test('la portada no contiene frases viejas ni promesas de cuotas fijas', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Frases prohibidas
    await expect(page.locator('body')).not.toContainText('cuotas fijas');
    await expect(page.locator('body')).not.toContainText('diseñamos tu tranquilidad');
    await expect(page.locator('body')).not.toContainText('Cero sorpresas');
    for (const selector of ['#landing-hero', '#landing-difference', '#landing-testimonials', '#tecnologia', 'footer']) {
      const el = page.locator(selector).first();
      if ((await el.count()) > 0) {
        await expect(el).not.toContainText(/gourmet/i);
      }
    }

    // Frase nueva en la sección de diferencia
    await expect(page.locator('body')).toContainText('Vos disfrutás la fiesta. Nosotros coordinamos los detalles.');
  });

  test('la sección de testimonios está antes que la de tecnología', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const testimonios = page.locator('#landing-testimonials');
    const tecnologia = page.locator('#landing-technology');

    await expect(testimonios).toBeAttached();
    await expect(tecnologia).toBeAttached();

    const boxTestimonios = await testimonios.boundingBox();
    const boxTecnologia = await tecnologia.boundingBox();

    expect(boxTestimonios).not.toBeNull();
    expect(boxTecnologia).not.toBeNull();

    if (boxTestimonios && boxTecnologia) {
      expect(boxTestimonios.y).toBeLessThan(boxTecnologia.y);
    }
  });

  test('tocar Coordinar una entrevista gratuita abre el panel con la agenda', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const botonEntrevista = page.getByRole('button', { name: /Coordinar una entrevista gratuita/i }).first();
    await expect(botonEntrevista).toBeVisible();
    await botonEntrevista.click();

    // El modal debe estar visible
    const modal = page.getByRole('dialog', { name: /Coordinar una entrevista gratuita/i });
    await expect(modal).toBeVisible();

    // Pide nombre y contacto
    const inputNombre = page.locator('#entrevista-nombre');
    const inputContacto = page.locator('#entrevista-contacto');
    await expect(inputNombre).toBeVisible();
    await expect(inputContacto).toBeVisible();

    await inputNombre.fill('Cliente Prueba');
    await inputContacto.fill('099123456');

    // Avanza a la agenda interactiva
    const botonAvanzar = modal.getByRole('button', { name: /Elegir fecha y horario/i });
    await botonAvanzar.click();

    // Se muestra la agenda del simulador
    await expect(modal.getByText(/Entrevista para:/i)).toBeVisible();
  });

  test('/bodas no contiene Mariana S. ni Experiencias Verificadas', async ({ page }) => {
    await page.goto('/bodas', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).not.toContainText('Mariana S.');
    await expect(page.locator('body')).not.toContainText('Experiencias Verificadas');
    await expect(page.locator('body')).toContainText('Lo que dicen nuestros clientes');
  });

  test('/cumpleanos no contiene barra libre', async ({ page }) => {
    await page.goto('/cumpleanos', { waitUntil: 'domcontentloaded' });
    const content = await page.textContent('body');
    expect(content?.toLowerCase()).not.toContain('barra libre');
    await expect(page.locator('body')).toContainText('Barra de Tragos');
  });
});
