
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AsistenteData } from '@/app/asistente-ak/page';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
  handleNext: () => void;
}

const tiposDeFiesta = [
  { id: 'boda', nombre: 'Boda', costoBase: 80000, img: 'https://placehold.co/400x300.png', hint: 'wedding couple' },
  { id: 'quince', nombre: 'Quince Años', costoBase: 60000, img: 'https://placehold.co/400x300.png', hint: 'quinceanera dress' },
  { id: 'infantil', nombre: 'Cumpleaños Infantil', costoBase: 30000, img: 'https://placehold.co/400x300.png', hint: 'kids party' },
  { id: 'corporativo', nombre: 'Evento Corporativo', costoBase: 90000, img: 'https://placehold.co/400x300.png', hint: 'corporate meeting' },
  { id: 'otro', nombre: 'Otro Tipo de Evento', costoBase: 40000, img: 'https://placehold.co/400x300.png', hint: 'event celebration' },
];

export const AsistentePaso1_TipoFiesta: React.FC<Props> = ({ data, setData, handleNext }) => {
  const handleSelect = (tipo: typeof tiposDeFiesta[0]) => {
    setData(prev => ({ ...prev, tipoFiesta: tipo }));
    // Automatically go to next step after selection
    setTimeout(() => handleNext(), 300); 
  };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Qué tipo de evento estás planeando?</h2>
      <p className="text-muted-foreground">Selecciona una opción para empezar.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {tiposDeFiesta.map((tipo) => (
          <Card
            key={tipo.id}
            onClick={() => handleSelect(tipo)}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden",
              data.tipoFiesta?.id === tipo.id ? 'ring-2 ring-primary border-primary' : 'border-border'
            )}
          >
            <CardContent className="p-0 relative">
              <div className="relative aspect-video">
                <NextImage
                  src={tipo.img}
                  alt={tipo.nombre}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={tipo.hint}
                />
                 {data.tipoFiesta?.id === tipo.id && (
                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white"/>
                    </div>
                )}
              </div>
              <div className="p-4 bg-background">
                <p className="font-semibold text-lg">{tipo.nombre}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
