/**
 * Extractor Facial Oficial para Búsqueda por Selfie e Indexación de Galería
 * Utiliza @vladmandic/face-api para generar los 128 descriptores de rostro reales.
 */

import type { VectorDeCara } from '@/lib/caras/agrupar-caras';

let modelosCargados: Promise<boolean> | null = null;

export async function asegurarModelosFaciales(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!modelosCargados) {
    modelosCargados = (async () => {
      try {
        const faceapi = await import(/* webpackMode: "eager" */ '@vladmandic/face-api');
        const tf = faceapi.tf as any;
        if (typeof tf?.ready === 'function') {
          await Promise.race([
            tf.ready(),
            new Promise<void>((_, reject) => setTimeout(() => reject(new Error('tf.ready timeout')), 2500)),
          ]).catch(() => {});
        }
        const ruta = '/models/caras';
        const cargaPromesa = Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(ruta),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(ruta),
          faceapi.nets.faceRecognitionNet.loadFromUri(ruta),
        ]);
        const timeoutPromesa = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar modelos')), 6000)
        );
        await Promise.race([cargaPromesa, timeoutPromesa]);
        return true;
      } catch (err) {
        console.warn('[ExtractorFacial] No se pudieron cargar modelos de face-api:', err);
        modelosCargados = null;
        return false;
      }
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
    if (!elemento) return null;
    let entrada: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement = elemento;
    if (typeof HTMLVideoElement !== 'undefined' && elemento instanceof HTMLVideoElement) {
      if (
        (elemento.readyState < 2 && elemento.videoWidth === 0) ||
        elemento.videoWidth === 0 ||
        elemento.videoHeight === 0
      ) {
        return null;
      }
      try {
        const canvas = document.createElement('canvas');
        canvas.width = elemento.videoWidth;
        canvas.height = elemento.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(elemento, 0, 0);
        entrada = canvas;
      } catch {
        return null;
      }
    }
    const ok = await asegurarModelosFaciales();
    if (!ok) return null;

    const faceapi = await import(/* webpackMode: "eager" */ '@vladmandic/face-api');

    const inferencia = (async () => {
      const deteccion = await faceapi
        .detectSingleFace(entrada, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!deteccion?.descriptor) return null;
      return Array.from(deteccion.descriptor);
    })();

    const timeoutInferencia = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 2500)
    );

    return await Promise.race([inferencia, timeoutInferencia]);
  } catch (err) {
    console.warn('[ExtractorFacial] No se pudo extraer descriptor con face-api:', err);
    return null;
  }
}
