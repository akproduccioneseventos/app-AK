'use client';

import { useState, useCallback } from 'react';
import { Scan, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { guardarCarasDeFiesta } from '@/app/actions/social-gallery';
import type { CaraEnFoto, VectorDeCara } from '@/lib/caras/agrupar-caras';

interface Props {
  fiestaId: string;
  fotosAprobadas: { id: string; imageUrl: string }[];
  onListo?: () => void;
}

/**
 * **Los modelos se cargan una sola vez, y desde nuestro propio servidor.**
 *
 * Vienen adentro del paquete y se copian a `public/models/caras`, asi que **no
 * se baja nada de ningun servicio de afuera y no se paga por foto**, que es la
 * condicion del dueno. Pesan 6,5 megas entre los tres y el navegador los deja
 * guardados despues de la primera vez.
 */
let modelosListos: Promise<void> | null = null;

async function cargarModelos(): Promise<void> {
  if (!modelosListos) {
    modelosListos = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      const ruta = '/models/caras';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(ruta),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(ruta),
        faceapi.nets.faceRecognitionNet.loadFromUri(ruta),
      ]);
    })();
  }
  return modelosListos;
}

/**
 * Saca de una foto los numeros que **identifican a la persona**.
 *
 * **ANTES ESTO MEDIA LUZ Y NO CARAS**, y por eso se freno el 3 de septiembre de
 * 2026: partia la foto en 128 franjas y guardaba el brillo promedio de cada
 * una. Eso describe **como esta iluminada la foto**, no quien sale en ella. En
 * una fiesta significaba que **dos personas distintas sacadas con la misma luz
 * daban casi el mismo numero**, y a un invitado le podian aparecer -y bajar-
 * las fotos de otro. Con caras de gente, y muchas veces de menores, eso no se
 * entrega.
 *
 * Ahora usa `faceRecognitionNet`, que devuelve **los 128 numeros de verdad**:
 * describen la forma de la cara y **no cambian con la luz ni con el angulo**.
 * Son los que esperan `agrupar-caras.ts` y sus umbrales.
 *
 * **De cada foto se toma la cara mas grande**, que es la que se reconoce mejor.
 * Si no se encuentra ninguna cara, la foto se saltea: **es preferible que a
 * alguien le falte una foto a que le aparezca la de otro.**
 */
async function extraerVector(
  img: HTMLImageElement,
): Promise<{ vector: VectorDeCara; tamano: number } | null> {
  try {
    const faceapi = await import('@vladmandic/face-api');
    await cargarModelos();

    const deteccion = await faceapi
      .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!deteccion?.descriptor) return null;

    const caja = deteccion.detection.box;
    const areaFoto = (img.naturalWidth || img.width) * (img.naturalHeight || img.height) || 1;
    const tamano = Math.min(1, (caja.width * caja.height) / areaFoto);

    return { vector: Array.from(deteccion.descriptor), tamano };
  } catch {
    return null;
  }
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

type Estado = 'idle' | 'corriendo' | 'listo' | 'error';

export function PrepararGrillaDeCara({ fiestaId, fotosAprobadas, onListo }: Props) {
  const [estado, setEstado] = useState<Estado>('idle');
  const [progreso, setProgreso] = useState(0);
  const [procesadas, setProcesadas] = useState(0);
  const [carasEncontradas, setCarasEncontradas] = useState(0);
  const [mensajeError, setMensajeError] = useState('');

  const iniciar = useCallback(async () => {
    if (fotosAprobadas.length === 0) return;
    setEstado('corriendo');
    setProgreso(0);
    setProcesadas(0);
    setCarasEncontradas(0);

    const caras: CaraEnFoto[] = [];
    const total = fotosAprobadas.length;

    for (let i = 0; i < total; i++) {
      const foto = fotosAprobadas[i];
      try {
        const img = await cargarImagen(foto.imageUrl);
        const resultado = await extraerVector(img);
        if (resultado) {
          caras.push({ fotoId: foto.id, vector: resultado.vector, tamano: resultado.tamano });
          setCarasEncontradas((c) => c + 1);
        }
      } catch {
        // foto que no carga: se saltea sin frenar todo
      }
      setProcesadas(i + 1);
      setProgreso(Math.round(((i + 1) / total) * 100));
    }

    const { ok } = await guardarCarasDeFiesta(fiestaId, caras);
    if (ok) {
      setEstado('listo');
      onListo?.();
    } else {
      setEstado('error');
      setMensajeError('No se pudieron guardar los datos. Revisa la conexion e intenta de nuevo.');
    }
  }, [fiestaId, fotosAprobadas, onListo]);

  if (fotosAprobadas.length === 0) return null;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Scan className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Preparar grilla de caras</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Procesa las {fotosAprobadas.length} fotos aprobadas en este browser para activar la
            {' '}grilla de caras de los invitados. Corre aca mismo: ninguna foto sale del equipo.
            {' '}La primera vez tarda unos segundos mas mientras se prepara.
          </p>
        </div>
      </div>

      {estado === 'idle' && (
        <Button size="sm" onClick={iniciar} className="w-full">
          <Scan className="w-4 h-4 mr-2" />
          Preparar grilla ({fotosAprobadas.length} fotos)
        </Button>
      )}

      {estado === 'corriendo' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>
              Procesando {procesadas} de {fotosAprobadas.length}...{' '}
              {carasEncontradas} con datos
            </span>
          </div>
          <Progress value={progreso} className="h-2" />
        </div>
      )}

      {estado === 'listo' && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          Listo. {carasEncontradas} fotos indexadas: la grilla esta activa para los invitados.
        </div>
      )}

      {estado === 'error' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4" />
            {mensajeError}
          </div>
          <Button size="sm" variant="outline" onClick={iniciar} className="w-full">
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}