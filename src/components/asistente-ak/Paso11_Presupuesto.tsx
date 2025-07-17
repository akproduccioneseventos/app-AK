
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AsistenteData, formatCurrency } from '@/app/asistente-ak/page';
import { Slider } from '@/components/ui/slider';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
}

export const AsistentePaso11_Presupuesto: React.FC<Props> = ({ data, setData }) => {
  
  const handlePresupuestoChange = (valor: string) => {
    const numValor = Number(valor);
    if (!isNaN(numValor) && numValor >= 0) {
      setData(prev => ({ ...prev, presupuestoCliente: numValor }));
    }
  };
  
  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Cuál es tu presupuesto aproximado?</h2>
      <p className="text-muted-foreground">Esto nos ayuda a darte las mejores recomendaciones. Puedes ajustar el control deslizante o escribir el monto.</p>
      
      <div className="pt-4 space-y-4">
        <div className="text-4xl font-bold text-primary">
            {formatCurrency(data.presupuestoCliente)}
        </div>
         <Slider
            value={[data.presupuestoCliente]}
            onValueChange={(value) => handlePresupuestoChange(String(value[0]))}
            min={10000}
            max={500000}
            step={5000}
            className="my-6"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatCurrency(10000)}</span>
            <span>{formatCurrency(500000)}</span>
        </div>
      </div>
    </div>
  );
};
