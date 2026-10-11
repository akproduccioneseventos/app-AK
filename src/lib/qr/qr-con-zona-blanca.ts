/**
 * Devuelve un PNG (data URL) del canvas de un QR con zona blanca alrededor.
 *
 * Por qué: el QR de pantalla va pelado (el blanco que se ve es del DIV, no del canvas) y el lector
 * de la app (html5-qrcode) no lo lee en algunos códigos. Medido (orden 147): el MISMO canvas de
 * 170 px con un borde blanco de 32 px (~19% del ancho por lado), SIN agrandar, sí se lee; agrandarlo
 * 3x no. Redibujarlo a 640 px falló en celular. Por eso se copia 1:1, sin escalar: el canvas de
 * qrcode.react ya viene a size x devicePixelRatio, así que se respeta la densidad del teléfono.
 */
export function qrConZonaBlanca(canvas: HTMLCanvasElement, proporcion = 0.19): string {
  const borde = Math.round(canvas.width * proporcion);
  const salida = document.createElement('canvas');
  salida.width = canvas.width + 2 * borde;
  salida.height = canvas.height + 2 * borde;
  const ctx = salida.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, salida.width, salida.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, borde, borde);
  return salida.toDataURL('image/png');
}
