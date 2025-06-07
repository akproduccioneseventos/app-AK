'use client';

import type { PresupuestoFormData, ServicioAdicional } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

interface Paso3Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

export default function Paso3Servicios({ formData, setFormData }: Paso3Props) {
  
  const handleServicioToggle = (servicioId: string) => {
    setFormData(prev => {
      const newSelectedIds = new Set(prev.serviciosSeleccionadosIds);
      if (newSelectedIds.has(servicioId)) {
        newSelectedIds.delete(servicioId);
      } else {
        newSelectedIds.add(servicioId);
      }
      return { ...prev, serviciosSeleccionadosIds: newSelectedIds };
    });
  };

  const costoTotalServicios = formData.serviciosDisponibles
    .filter(servicio => formData.serviciosSeleccionadosIds.has(servicio.id))
    .reduce((sum, servicio) => sum + servicio.costo, 0);
  
  return (
    <div className="space-y-6">
      <Label className="text-xl font-semibold">Servicios Adicionales Opcionales</Label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formData.serviciosDisponibles.map((servicio) => (
          <Card key={servicio.id} className={`transition-all hover:shadow-md ${formData.serviciosSeleccionadosIds.has(servicio.id) ? 'ring-2 ring-primary' : 'border-border'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                 <Sparkles className="w-6 h-6 text-primary/70" />
                <div>
                  <Label htmlFor={`servicio-${servicio.id}`} className="text-base font-medium cursor-pointer">{servicio.nombre}</Label>
                  <p className="text-sm text-muted-foreground">Costo: ${servicio.costo.toFixed(2)}</p>
                </div>
              </div>
              <Checkbox
                id={`servicio-${servicio.id}`}
                checked={formData.serviciosSeleccionadosIds.has(servicio.id)}
                onCheckedChange={() => handleServicioToggle(servicio.id)}
                className="w-5 h-5"
              />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t">
        <p className="text-xl font-semibold text-right">
          Costo Total de Servicios Adicionales: ${costoTotalServicios.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
