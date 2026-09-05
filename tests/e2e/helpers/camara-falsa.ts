import type { Page } from '@playwright/test';

/**
 * Una cámara de mentira para las estaciones.
 *
 * **Sin esto, la fotocabina y las demás estaciones muestran el cartel de "no se
 * puede usar la cámara" y TODO el panel del operador desaparece**: los stickers,
 * los marcos y los fondos sólo se dibujan cuando la cámara arrancó bien. Una
 * prueba sin cámara falsa no está probando la estación: está probando el cartel
 * de error.
 *
 * Vivía copiada palabra por palabra en tres archivos de prueba y a una cuarta se
 * le olvidó ponerla, y esa falló sin que se entendiera por qué. Ahora vive acá.
 */
export async function enchufarCamaraFalsa(page: Page) {
  await page.addInitScript(() => {
    const armar = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 640;
      lienzo.height = 480;
      const ctx = lienzo.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      }
      return lienzo.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armar(),
        enumerateDevices: async () => [
          { deviceId: 'cam', kind: 'videoinput', label: 'Camara', groupId: 'g' },
        ],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}
