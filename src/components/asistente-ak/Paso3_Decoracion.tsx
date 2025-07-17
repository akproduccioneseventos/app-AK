

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AsistenteData } from '@/app/asistente-ak/page';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getAsistenteAkConfig } from '@/app/actions/asistente-ak';
import type { AsistentePasoOpcion } from '@/types/fiesta';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
  handleNext: () => void;
}

export const AsistentePaso3_Decoracion: React.FC<Props> = ({ data, setData, handleNext }) => {
  const [opciones, setOpciones] = useState<AsistentePasoOpcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pregunta, setPregunta] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const config = await getAsistenteAkConfig();
        const { decoracion } = config.pasos;
        setOpciones(decoracion.opciones);
        setPregunta(decoracion.pregunta);
        setDescripcion(decoracion.descripcion);
      } catch (error) {
        console.error("Failed to load assistant config", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSelect = (estilo: AsistentePasoOpcion) => {
    const { costoBase, ...restOfEstilo } = estilo;
    setData(prev => ({ ...prev, estiloDecoracion: { ...restOfEstilo, multiplicadorCosto: estilo.multiplicadorCosto || 1 } }));
    setTimeout(() => handleNext(), 300);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold font-headline">{pregunta}</h2>
      <p className="text-muted-foreground">{descripcion}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {opciones.map((estilo) => (
          <Card
            key={estilo.id}
            onClick={() => handleSelect(estilo)}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden",
              data.estiloDecoracion?.id === estilo.id ? 'ring-2 ring-primary border-primary' : 'border-border'
            )}
          >
            <CardContent className="p-0 relative">
              <div className="relative aspect-[4/3]">
                <NextImage
                  src={estilo.img || 'https://placehold.co/400x300.png'}
                  alt={estilo.nombre}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={estilo.hint}
                />
                 {data.estiloDecoracion?.id === estilo.id && (
                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white"/>
                    </div>
                )}
              </div>
              <div className="p-4 bg-background">
                <p className="font-semibold text-base">{estilo.nombre}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
