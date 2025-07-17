
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

const opcionesReposteria = [
  { id: 'torta', nombre: 'Torta Principal', costoBase: 8000, costoPorPersona: 50, img: 'https://placehold.co/400x300.png', hint: 'wedding cake' },
  { id: 'candy_bar', nombre: 'Candy Bar Temático', costoBase: 12000, costoPorPersona: 150, img: 'https://placehold.co/400x300.png', hint: 'candy bar' },
  { id: 'mesa_postres', nombre: 'Mesa de Postres', costoBase: 15000, costoPorPersona: 200, img: 'https://placehold.co/400x300.png', hint: 'dessert table' },
  { id: 'ninguno', nombre: 'Sin repostería extra', costoBase: 0, costoPorPersona: 0, img: 'https://placehold.co/400x300.png', hint: 'no sign' },
];

export const AsistentePaso8_Reposteria: React.FC<Props> = ({ data, setData, handleNext }) => {
  const handleSelect = (opcion: typeof opcionesReposteria[0]) => {
    setData(prev => ({ ...prev, reposteria: opcion }));
    setTimeout(() => handleNext(), 300);
  };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Y para el momento dulce?</h2>
      <p className="text-muted-foreground">Elige las opciones de repostería para tu evento.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {opcionesReposteria.map((opcion) => (
          <Card
            key={opcion.id}
            onClick={() => handleSelect(opcion)}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden",
              data.reposteria?.id === opcion.id ? 'ring-2 ring-primary border-primary' : 'border-border'
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
                 {data.reposteria?.id === opcion.id && (
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
