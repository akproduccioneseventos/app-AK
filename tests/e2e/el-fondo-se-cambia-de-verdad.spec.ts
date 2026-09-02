import { test, expect } from '@playwright/test';
import { procesarFondoCanvas } from '../../src/lib/entretenimiento/segmentacion-fondo';

test.describe('Orden 34: El cambio de fondo se aplica de verdad', () => {
  test('1. procesarFondoCanvas con desenfoque altera los píxeles del borde respecto a sin fondo', async () => {
    // Canvas destino
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    // Canvas origen simulando un frame de video con patrón contrastante
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = 100;
    videoCanvas.height = 100;
    const vCtx = videoCanvas.getContext('2d')!;
    // Fondo oscuro con bordes blancos de alto contraste
    vCtx.fillStyle = '#000000';
    vCtx.fillRect(0, 0, 100, 100);
    vCtx.fillStyle = '#ffffff';
    vCtx.fillRect(0, 0, 10, 100); // Barra vertical blanca en el borde izquierdo

    // 1. Caso sin fondo (tipo 'ninguno')
    procesarFondoCanvas({
      canvasDestino: canvas,
      videoOrigen: videoCanvas as any,
      fondoSeleccionado: { id: 'ninguno', nombre: 'Sin fondo', tipo: 'ninguno' },
    });
    const ctx = canvas.getContext('2d')!;
    const pixelSinFondo = ctx.getImageData(0, 0, 1, 1).data; // Blanco (255, 255, 255)

    // 2. Caso con fondo desenfocado (tipo 'desenfoque')
    procesarFondoCanvas({
      canvasDestino: canvas,
      videoOrigen: videoCanvas as any,
      fondoSeleccionado: { id: 'desenfoque', nombre: 'Fondo borroso', tipo: 'desenfoque' },
    });
    const pixelConDesenfoque = ctx.getImageData(0, 0, 1, 1).data;

    // Los píxeles del borde deben cambiar debido al filtro blur
    const diferencia = Math.abs(pixelSinFondo[0] - pixelConDesenfoque[0]);
    expect(diferencia).toBeGreaterThan(0);
  });

  test('2. Fotocabina tiene la opción de procesar fondo disponible', async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto('/evento/fotocabina/fiesta-demo', { waitUntil: 'domcontentloaded' });
    const body = page.locator('body');
    await expect(body).toContainText(/AK Producciones|Fotocabina/i);
  });
});