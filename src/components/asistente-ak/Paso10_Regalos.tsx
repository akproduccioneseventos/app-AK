
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AsistenteData } from '@/app/asistente-ak/page';
import { cn } from '@/lib/utils';
import { CheckCircle, Gift, Ban } from 'lucide-react';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
  handleNext: () => void;
}

const opcionesRegalos = [
  { id: 'si', nombre: 'Sí, quiero una lista de regalos', valor: true, icon: Gift },
  { id: 'no', nombre: 'No, gracias', valor: false, icon: Ban },
];

export const AsistentePaso10_Regalos: React.FC<Props> = ({ data, setData, handleNext }) => {
  const handleSelect = (opcion: typeof opcionesRegalos[0]) => {
    setData(prev => ({ ...prev, listaRegalos: opcion.valor }));
    setTimeout(() => handleNext(), 300);
  };

  return (
    <div className="space-y-4 text-center max-w-lg mx-auto">
      <h2 className="text-2xl font-bold font-headline">¿Te gustaría habilitar una lista de regalos online?</h2>
      <p className="text-muted-foreground">Tus invitados podrán ver tus sugerencias y elegir qué regalarte de forma cómoda y online.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        {opcionesRegalos.map((opcion) => {
            const Icon = opcion.icon;
            return (
              <Card
                key={opcion.id}
                onClick={() => handleSelect(opcion)}
                className={cn(
                  "cursor-pointer group hover:shadow-lg transition-all transform hover:-translate-y-1",
                  data.listaRegalos === opcion.valor ? 'ring-2 ring-primary border-primary' : 'border-border'
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
