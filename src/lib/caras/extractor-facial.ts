/**
 * Extractor Facial Oficial para Búsqueda por Selfie e Indexación de Galería
 * Utiliza @vladmandic/face-api para generar los 128 descriptores de rostro reales.
 */

import type { VectorDeCara } from '@/lib/caras/agrupar-caras';

let modelosCargados: Promise<void> | null = null;

export async function asegurarModelosFaciales(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!modelosCargados) {
    modelosCargados = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      const ruta = '/models/caras';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(ruta),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(ruta),
        faceapi.nets.faceRecognitionNet.loadFromUri(ruta),
      ]);
    })();
  }
  return modelosCargados;
}

/**
 * Extrae el vector de 128 números de una imagen o video HTML en el navegador.
 */
export async function extraerDescriptorFacial(
  elemento: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<VectorDeCara | null> {
  try {
    const faceapi = await import('@vladmandic/face-api');
    await asegurarModelosFaciales();

    const deteccion = await faceapi
      .detectSingleFace(elemento, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!deteccion?.descriptor) return null;
    return Array.from(deteccion.descriptor);
  } catch (err) {
    console.warn('[ExtractorFacial] No se pudo extraer descriptor con face-api:', err);
    return null;
  }
}
