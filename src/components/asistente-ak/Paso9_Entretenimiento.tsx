
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

const opcionesEntretenimiento = [
  { id: 'photobooth', nombre: 'Cabina de Fotos', costoBase: 15000, img: 'https://placehold.co/400x300.png', hint: 'photo booth' },
  { id: 'show_vivo', nombre: 'Show en Vivo', costoBase: 35000, img: 'https://placehold.co/400x300.png', hint: 'live show' },
  { id: 'animacion', nombre: 'Animación Infantil', costoBase: 10000, img: 'https://placehold.co/400x300.png', hint: 'kids entertainer' },
  { id: 'ninguno', nombre: 'Sin entretenimiento extra', costoBase: 0, img: 'https://placehold.co/400x300.png', hint: 'no sign' },
];

export const AsistentePaso9_Entretenimiento: React.FC<Props> = ({ data, setData, handleNext }) => {
  const handleSelect = (opcion: typeof opcionesEntretenimiento[0]) => {
    setData(prev => ({ ...prev, entretenimiento: opcion }));
    setTimeout(() => handleNext(), 300);
  };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Añadimos entretenimiento extra?</h2>
      <p className="text-muted-foreground">Sorprende a tus invitados con una actividad especial.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {opcionesEntretenimiento.map((opcion) => (
          <Card
            key={opcion.id}
            onClick={() => handleSelect(opcion)}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden",
              data.entretenimiento?.id === opcion.id ? 'ring-2 ring-primary border-primary' : 'border-border'
            )}
          >
            <CardContent className="p-0 relative">
              <div className="relative aspect-video">
                <NextImage
                  src={opcion.img}
                  alt={opcion.nombre}
                  layout="fill"
                  objectFit="cover"
                  className="group-hover:scale-105 transition-transform duration-300"
                  data-ai-hint={opcion.hint}
                />
                 {data.entretenimiento?.id === opcion.id && (
                    <div className="absolute inset-0 bg-primary/70 flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-white"/>
                    </div>
                )}
              </div>
              <div className="p-4 bg-background">
                <p className="font-semibold text-lg">{opcion.nombre}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
