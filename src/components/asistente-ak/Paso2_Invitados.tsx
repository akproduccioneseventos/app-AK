
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AsistenteData } from '@/app/asistente-ak/page';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
}

export const AsistentePaso2_Invitados: React.FC<Props> = ({ data, setData }) => {
  
  const handleInvitadosChange = (tipo: 'adultos' | 'adolescentes' | 'ninos', valor: string) => {
    const numValor = Number(valor);
    if (numValor >= 0) {
      setData(prev => ({
        ...prev,
        invitados: {
          ...prev.invitados,
          [tipo]: numValor
        }
      }));
    }
  };
  
  const totalInvitados = data.invitados.adultos + data.invitados.adolescentes + data.invitados.ninos;

  return (
    <div className="max-w-md mx-auto space-y-6 text-center">
      <h2 className="text-2xl font-bold font-headline">¿Cuántas personas asistirán?</h2>
      <p className="text-muted-foreground">Indica una cantidad aproximada para cada grupo de edad. Esto nos ayuda a estimar mejor los costos.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-left">
        <div className="space-y-2">
            <Label htmlFor="adultos" className="text-base">Adultos</Label>
            <Input id="adultos" type="number" min="0" value={data.invitados.adultos} onChange={(e) => handleInvitadosChange('adultos', e.target.value)} className="text-lg p-3 text-center"/>
        </div>
         <div className="space-y-2">
            <Label htmlFor="adolescentes" className="text-base">Adolescentes</Label>
            <Input id="adolescentes" type="number" min="0" value={data.invitados.adolescentes} onChange={(e) => handleInvitadosChange('adolescentes', e.target.value)} className="text-lg p-3 text-center"/>
        </div>
         <div className="space-y-2">
            <Label htmlFor="ninos" className="text-base">Niños</Label>
            <Input id="ninos" type="number" min="0" value={data.invitados.ninos} onChange={(e) => handleInvitadosChange('ninos', e.target.value)} className="text-lg p-3 text-center"/>
        </div>
      </div>
      
      <div className="pt-4">
        <p className="text-lg font-semibold">Total de Invitados: <span className="text-primary">{totalInvitados}</span></p>
      </div>
    </div>
  );
};
