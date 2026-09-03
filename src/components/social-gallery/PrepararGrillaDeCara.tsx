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

async function extraerVector(
  img: HTMLImageElement,
  usarFaceDetector: boolean,
): Promise<{ vector: VectorDeCara; tamano: number } | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    let tamano = 1;

    if (usarFaceDetector && 'FaceDetector' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).FaceDetector({ fastMode: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const carasDetectadas: any[] = await detector.detect(img).catch(() => []);
      if (carasDetectadas.length === 0) return null;

      const box = carasDetectadas[0].boundingBox;
      tamano = (box.width * box.height) / (img.naturalWidth * img.naturalHeight);
      ctx.drawImage(img, box.x, box.y, box.width, box.height, 0, 0, 160, 160);
    } else {
      ctx.drawImage(img, 0, 0, 160, 160);
    }

    const imgData = ctx.getImageData(0, 0, 160, 160);
    const data = imgData.data;
    const vector = new Array(128).fill(0);
    const blockSize = Math.floor((data.length / 4) / 128);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      const start = i * blockSize * 4;
      const end = Math.min(start + blockSize * 4, data.length);
      for (let j = start; j < end; j += 4) {
        sum += 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
      }
      const count = (end - start) / 4 || 1;
      vector[i] = (sum / count) / 255;
    }
    const norma = Math.sqrt(vector.reduce((acc, v) => acc + v * v, 0)) || 1;
    return { vector: vector.map((v) => v / norma), tamano };
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

    const usarFaceDetector = 'FaceDetector' in window;
    const caras: CaraEnFoto[] = [];
    const total = fotosAprobadas.length;

    for (let i = 0; i < total; i++) {
      const foto = fotosAprobadas[i];
      try {
        const img = await cargarImagen(foto.imageUrl);
        const resultado = await extraerVector(img, usarFaceDetector);
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