

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AsistenteData } from '@/app/asistente-ak/page';
import { cn } from '@/lib/utils';
import { Gift, Ban, Loader2 } from 'lucide-react';
import { getAsistenteAkConfig } from '@/app/actions/asistente-ak';
import type { AsistentePasoOpcion } from '@/types/fiesta';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
  handleNext: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
    si: Gift,
    no: Ban,
};

export const AsistentePaso10_Regalos: React.FC<Props> = ({ data, setData, handleNext }) => {
  const [opciones, setOpciones] = useState<AsistentePasoOpcion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pregunta, setPregunta] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const config = await getAsistenteAkConfig();
        const { regalos } = config.pasos;
        setOpciones(regalos.opciones);
        setPregunta(regalos.pregunta);
        setDescripcion(regalos.descripcion);
      } catch (error) {
        console.error("Failed to load assistant config", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSelect = (opcion: AsistentePasoOpcion) => {
    setData(prev => ({ ...prev, listaRegalos: opcion.valor ?? null }));
    setTimeout(() => handleNext(), 300);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 text-center max-w-lg mx-auto">
      <h2 className="text-2xl font-bold font-headline">{pregunta}</h2>
      <p className="text-muted-foreground">{descripcion}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {opciones.map((opcion) => {
            const Icon = iconMap[opcion.id] || Gift;
            const isSelected = data.listaRegalos === opcion.valor;
            return (
              <Card
                key={opcion.id}
                onClick={() => handleSelect(opcion)}
                className={cn(
                  "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1",
                  isSelected ? 'ring-2 ring-primary border-primary' : 'border-border'
                )}
              >
                <CardContent className="p-6 text-center flex flex-col items-center justify-center gap-3">
                   <Icon className="w-10 h-10 text-primary"/>
                   <p className="font-semibold text-lg">{opcion.nombre}</p>
                </CardContent>
              </Card>
            )
        })}
      </div>
    </div>
  );
};
