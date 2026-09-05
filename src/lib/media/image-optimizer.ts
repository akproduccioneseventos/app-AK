/**
 * Optimizador de imágenes para subidas a Firebase Storage.
 *
 * Reduce fotos gigantes de celulares (de 10-15MB en 4K/8K) a un tamaño óptimo
 * para web (máx 1920px de ancho/alto y calidad 82% WebP o JPEG) en el propio navegador
 * antes de transmitirlas.
 *
 * Ventajas:
 * 1. Ahorra 90% de datos en la conexión móvil del salón.
 * 2. La subida tarda menos de 1 segundo en lugar de 10 segundos.
 * 3. Ahorra almacenamiento en Firebase Storage.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

const DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  format: 'image/webp',
};

/**
 * Optimiza un archivo de imagen en el navegador antes de subirlo.
 * Si el navegador no soporta Canvas o falla la decodificación, devuelve el archivo original intacto.
 */
export async function optimizeImageForUpload(
  file: File,
  options?: ImageOptimizationOptions
): Promise<File> {
  // Solo procesar imágenes
  if (!file.type.startsWith('image/') || typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  // Si ya es un SVG o GIF animado, no procesar por Canvas para no romper la animación
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // Si el archivo ya pesa menos de 300KB, devolver directo
  if (file.size < 300 * 1024) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;

        // Calcular escala manteniendo la proporción
        if (width > opts.maxWidth || height > opts.maxHeight) {
          const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Suavizado de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob WebP o JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Si por alguna razón el comprimido quedó más grande, usar el original
              return resolve(file);
            }

            const ext = opts.format === 'image/webp' ? '.webp' : '.jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const optimizedFile = new File([blob], `${baseName}${ext}`, {
              type: opts.format,
              lastModified: Date.now(),
            });

            resolve(optimizedFile);
          },
          opts.format,
          opts.quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };

      img.src = objectUrl;
    } catch {
      resolve(file);
    }
  });
}
