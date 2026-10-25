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
          setTimeout(() => reject(new Error('Tiempo de espera agotado al cargar modelos')), 1500)
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
    if (typeof HTMLVideoElement !== 'undefined' && elemento instanceof HTMLVideoElement) {
      if (
        (elemento.readyState < 2 && elemento.videoWidth === 0) ||
        elemento.videoWidth === 0 ||
        elemento.videoHeight === 0
      ) {
        return null;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(elemento, 0, 0, 160, 160);

    const data = ctx.getImageData(0, 0, 160, 160).data;
    let minLuma = 255;
    let maxLuma = 0;
    for (let i = 0; i < data.length; i += 256) {
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
    }

    if (maxLuma - minLuma < 8) {
      return null;
    }

    const ok = await asegurarModelosFaciales();
    if (!ok) return null;

    const faceapi = await import(/* webpackMode: "eager" */ '@vladmandic/face-api');

    const inferencia = (async () => {
      const deteccion = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      if (!deteccion?.descriptor) return null;
      return Array.from(deteccion.descriptor);
    })();

    const timeoutInferencia = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1000)
    );

    return await Promise.race([inferencia, timeoutInferencia]);
  } catch (err) {
    console.warn('[ExtractorFacial] No se pudo extraer descriptor con face-api:', err);
    return null;
  }
}
