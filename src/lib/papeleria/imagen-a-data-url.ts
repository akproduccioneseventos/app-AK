/**
 * Utilidades cliente para normalizar y convertir imágenes a data URL o File
 * compatibles con jsPDF y subidas de respaldo.
 */

export function asegurarDataUrl(valor: string, mimeType = 'image/png'): string {
  const limpio = String(valor || '').trim();
  if (!limpio) return '';
  if (/^(data:|https?:\/\/|blob:|\/)/i.test(limpio)) return limpio;
  return `data:${mimeType};base64,${limpio}`;
}

export function dataUrlAFile(dataUrl: string, nombreArchivo = 'imagen.png'): File | null {
  try {
    const match = String(dataUrl || '').match(/^data:([^;]+);base64,(.+)$/i);
    if (!match) return null;
    const mime = match[1] || 'image/png';
    const bin = atob(match[2]);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }
    return new File([bytes], nombreArchivo, { type: mime });
  } catch {
    return null;
  }
}

export async function imagenUrlADataUrl(url: string): Promise<string> {
  const limpia = String(url || '').trim();
  if (!limpia) {
    throw new Error('Falta la URL de la imagen para convertir.');
  }

  if (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(limpia)) {
    return limpia;
  }

  if (typeof window === 'undefined') {
    throw new Error('La conversión de imágenes a PDF sólo funciona en el navegador.');
  }

  try {
    const respuesta = await fetch(limpia);
    if (respuesta.ok) {
      const blob = await respuesta.blob();
      if (blob.type.startsWith('image/') && !blob.type.includes('svg')) {
        const leida = await new Promise<string | null>((resolve) => {
          const lector = new FileReader();
          lector.onloadend = () =>
            resolve(typeof lector.result === 'string' ? lector.result : null);
          lector.onerror = () => resolve(null);
          lector.readAsDataURL(blob);
        });
        if (leida && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(leida)) {
          return leida;
        }
      }
    }
  } catch {
    // Seguimos con el intento via Image + Canvas.
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx || canvas.width === 0 || canvas.height === 0) {
          reject(new Error('No se pudo dibujar la imagen en el lienzo para PDF.'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('No se pudo exportar la imagen a PDF.'));
      }
    };
    img.onerror = () => reject(new Error('No se pudo descargar la imagen para armar el PDF.'));
    img.src = limpia;
  });
}
