
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AsistenteData } from '@/app/asistente-ak/page';
import { getAsistenteAkConfig } from '@/app/actions/asistente-ak';
import type { AsistenteAkConfig, AsistentePasoOpcion } from '@/types/fiesta';
import { Loader2 } from 'lucide-react';
import { AsistentePaso2_Invitados } from './Paso2_Invitados';

interface Props {
  data: AsistenteData;
  setData: React.Dispatch<React.SetStateAction<AsistenteData>>;
}

export const AsistenteModoRapido: React.FC<Props> = ({ data, setData }) => {
  const [config, setConfig] = useState<AsistenteAkConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const loadedConfig = await getAsistenteAkConfig();
        setConfig(loadedConfig);
      } catch (error) {
        console.error("Failed to load assistant config", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSelectChange = (
    stepKey: keyof Omit<AsistenteData, 'invitados' | 'presupuestoCliente' | 'listaRegalos'>,
    opcionId: string
  ) => {
    if (!config) return;

    // Find the correct step config
    const stepConfig = Object.values(config.pasos).find(paso => 
        paso.opciones.some(opt => opt.id === opcionId)
    );
    
    if(!stepConfig) {
      setData(prev => ({...prev, [stepKey]: null }));
      return;
    }

    const selectedOption = stepConfig.opciones.find(opt => opt.id === opcionId);
    if (!selectedOption) {
      setData(prev => ({...prev, [stepKey]: null }));
      return;
    }

    // Determine payload based on option properties
    let payload;
    if (selectedOption.costoPorPersona !== undefined) {
      payload = { ...selectedOption, costoPorPersona: selectedOption.costoPorPersona };
    } else if (selectedOption.multiplicadorCosto !== undefined) {
      payload = { ...selectedOption, multiplicadorCosto: selectedOption.multiplicadorCosto };
    } else {
      payload = { ...selectedOption, costoBase: selectedOption.costoBase || 0 };
    }
    
    setData(prev => ({ ...prev, [stepKey]: payload }));
  };

  if (isLoading || !config) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const stepsToRender: (keyof AsistenteAkConfig['pasos'])[] = [
    'tipoFiesta', 'decoracion', 'catering', 'bebidas', 
    'fotoVideo', 'musica', 'reposteria', 'entretenimiento'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold font-headline">Armado Rápido</h2>
        <p className="text-muted-foreground mt-2">Selecciona los servicios que deseas y ajusta la cantidad de invitados.</p>
      </div>

      <AsistentePaso2_Invitados data={data} setData={setData} />

      <Card>
        <CardHeader>
            <CardTitle>Selección de Servicios</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stepsToRender.map(stepKey => {
                const stepConfig = config.pasos[stepKey];
                if (!stepConfig) return null;
                
                const dataKey = stepKey === 'tipoFiesta' ? 'tipoFiesta' :
                                stepKey === 'decoracion' ? 'estiloDecoracion' :
                                stepKey as keyof Omit<AsistenteData, 'invitados' | 'presupuestoCliente' | 'listaRegalos'>;

                return (
                    <div key={stepKey} className="space-y-2">
                        <Label htmlFor={`select-${stepKey}`} className="text-base">{stepConfig.pregunta}</Label>
                        <Select
                            value={data[dataKey]?.id || 'ninguno'}
                            onValueChange={(value) => handleSelectChange(dataKey, value)}
                        >
                            <SelectTrigger id={`select-${stepKey}`}><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ninguno">Ninguno</SelectItem>
                                {stepConfig.opciones.map(opt => (
                                    <SelectItem key={opt.id} value={opt.id}>{opt.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            })}
        </CardContent>
      </Card>
    </div>
  );
};
