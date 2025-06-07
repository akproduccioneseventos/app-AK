
'use client';

import type { PresupuestoFormData } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import type { Dispatch, SetStateAction } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Paso2Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

export default function Paso2Menu({ formData, setFormData }: Paso2Props) {
  
  const handlePlatoToggle = (platoId: string) => {
    setFormData(prev => {
      const newSelectedIds = new Set(prev.platosSeleccionadosIds);
      if (newSelectedIds.has(platoId)) {
        newSelectedIds.delete(platoId);
      } else {
        newSelectedIds.add(platoId);
      }
      return { ...prev, platosSeleccionadosIds: newSelectedIds };
    });
  };

  const costoTotalPlatos = formData.platosDisponibles
    .filter(plato => formData.platosSeleccionadosIds.has(plato.id))
    .reduce((sum, plato) => sum + (plato.costoPorPersona * (formData.invitadosCantidad || 0)), 0);

  if (!formData.platosDisponibles || formData.platosDisponibles.length === 0) {
    return <p className="text-muted-foreground">Cargando platos disponibles...</p>;
  }
  
  return (
    <div className="space-y-6">
      <Label className="text-xl font-semibold">Seleccioná los Platos</Label>
      <p className="text-muted-foreground">
        Los costos se calcularán en base a {formData.invitadosCantidad || 0} invitados.
      </p>
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {formData.platosDisponibles.map((plato) => (
            <Card key={plato.id} className={`overflow-hidden transition-all hover:shadow-lg ${formData.platosSeleccionadosIds.has(plato.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="p-0 relative">
                <Image 
                  src={plato.imagenUrl || "https://placehold.co/300x200.png"} 
                  alt={plato.nombre} 
                  width={300} 
                  height={200} 
                  className="w-full h-40 object-cover"
                  data-ai-hint="food gourmet"
                />
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <CardTitle className="text-lg font-medium">{plato.nombre}</CardTitle>
                {plato.descripcion && <p className="text-sm text-muted-foreground h-10 overflow-hidden">{plato.descripcion}</p>}
                <p className="text-lg font-semibold text-primary">${plato.costoPorPersona.toFixed(2)} <span className="text-xs text-muted-foreground">p/persona</span></p>
              </CardContent>
              <CardFooter className="p-4 bg-muted/50">
                <div className="flex items-center space-x-2 w-full">
                  <Checkbox
                    id={`plato-${plato.id}`}
                    checked={formData.platosSeleccionadosIds.has(plato.id)}
                    onCheckedChange={() => handlePlatoToggle(plato.id)}
                  />
                  <Label htmlFor={`plato-${plato.id}`} className="text-sm font-medium cursor-pointer grow">
                    Seleccionar este plato
                  </Label>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
      <div className="mt-6 pt-4 border-t">
        <p className="text-xl font-semibold text-right">
          Costo Total de Platos: ${costoTotalPlatos.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
