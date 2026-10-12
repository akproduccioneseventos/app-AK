import type { Html5Qrcode } from 'html5-qrcode';

const lectoresPreparados = new WeakSet<object>();

async function girarImagen(file: File, grados: number): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    const intercambia = grados % 180 !== 0;
    canvas.width = intercambia ? image.naturalHeight : image.naturalWidth;
    canvas.height = intercambia ? image.naturalWidth : image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No se pudo leer la imagen del QR.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = false;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(grados * Math.PI / 180);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => result ? resolve(result) : reject(new Error('No se pudo leer la imagen del QR.')), 'image/png');
    });
    return new File([blob], file.name, { type: 'image/png' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** El decoder falla con algunos patrones validos; girarlos conserva token y modulos. */
export function habilitarReintentoQrGirado(lector: { prototype: Pick<Html5Qrcode, 'scanFileV2'> }): void {
  if (lectoresPreparados.has(lector.prototype)) return;
  const leerOriginal = lector.prototype.scanFileV2;
  lector.prototype.scanFileV2 = async function (file, showImage) {
    let errorOriginal: unknown;
    try {
      return await leerOriginal.call(this, file, showImage);
    } catch (error) {
      errorOriginal = error;
    }
    for (const grados of [90, 180, 270]) {
      try {
        return await leerOriginal.call(this, await girarImagen(file, grados), showImage);
      } catch {
        // Ningun intento concede acceso: solo la accion autenticada valida el texto leido.
      }
    }
    throw errorOriginal;
  };
  lectoresPreparados.add(lector.prototype);
}
