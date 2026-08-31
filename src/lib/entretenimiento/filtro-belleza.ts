/**
 * Filtro de belleza ("Glam" / "Belleza") para estaciones de entretenimiento.
 *
 * Suaviza sutilmente las altas frecuencias en los tonos de piel (piel lisa y radiante)
 * preservando los bordes oscuros (ojos, labios, pelo) y mejorando luminosidad/calidez.
 *
 * 100% en canvas local, sin dependencias externas.
 */

export function aplicarFiltroBelleza(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  intensidad: number = 0.5 // 0 a 1
): void {
  const frame = ctx.getImageData(0, 0, ancho, alto);
  const data = frame.data;
  const len = data.length;

  // Paso 1: Leve realce de calidez y luminosidad en tonos piel
  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Detección de tonos piel en espacio RGB
    const esPiel = r > 80 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 15;

    if (esPiel) {
      // Suavizar e iluminar suavemente la piel
      data[i] = Math.min(255, Math.round(r + 8 * intensidad)); // Toque cálido
      data[i + 1] = Math.min(255, Math.round(g + 4 * intensidad));
      data[i + 2] = Math.min(255, Math.round(b + 2 * intensidad));
    }
  }

  ctx.putImageData(frame, 0, 0);

  // Paso 2: Capa suave de desenfoque de altas frecuencias (soft-focus glam)
  const auxCanvas = document.createElement('canvas');
  auxCanvas.width = ancho;
  auxCanvas.height = alto;
  const auxCtx = auxCanvas.getContext('2d');
  if (auxCtx) {
    auxCtx.filter = `blur(${Math.max(2, Math.round(4 * intensidad))}px) brightness(1.05)`;
    auxCtx.drawImage(ctx.canvas, 0, 0);

    ctx.save();
    ctx.globalAlpha = 0.35 * intensidad;
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(auxCanvas, 0, 0);
    ctx.restore();
  }
}
