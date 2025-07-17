
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

const opcionesBebidas = [
  { id: 'basico', nombre: 'Bebidas Básicas', costoPorPersona: 500, img: 'https://placehold.co/400x300.png', hint: 'soda drinks' },
  { id: 'barra', nombre: 'Barra de Tragos', costoPorPersona: 1200, img: 'https://placehold.co/400x300.png', hint: 'cocktail bar' },
  { id: 'premium', nombre: 'Vinos y Espumantes', costoPorPersona: 1500, img: 'https://placehold.co/400x300.png', hint: 'wine bottles' },
];

export const AsistentePaso5_Bebidas: React.FC<Props> = ({ data, setData, handleNext }) => {
  const handleSelect = (opcion: typeof opcionesBebidas[0]) => {
    setData(prev => ({ ...prev, bebidas: opcion }));
    setTimeout(() => handleNext(), 300);
  };

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Qué servicio de bebidas te gustaría?</h2>
      <p className="text-muted-foreground">Desde lo esencial hasta una barra completa.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
        {opcionesBebidas.map((opcion) => (
          <Card
            key={opcion.id}
            onClick={() => handleSelect(opcion)}
            className={cn(
              "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1 overflow-hidden",
              data.bebidas?.id === opcion.id ? 'ring-2 ring-primary border-primary' : 'border-border'
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
                 {data.bebidas?.id === opcion.id && (
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
