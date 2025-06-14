
'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo'; 
import type { Dispatch, SetStateAction } from 'react';

interface Paso1Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

const tiposEventoDisponibles: TipoEvento[] = ['Boda', 'XV años', 'Cumpleaños', 'Evento corporativo', 'Cumpleaños infantil', 'Otro'];

export default function Paso1DatosEvento({ formData, setFormData }: Paso1Props) {
  
  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventoFecha: date }));
  };
  
  const handleTipoEventoChange = (value: string) => {
     if (value === "Otro") {
        handleChange('eventoTipo', ''); // Clear it to allow custom input if 'Otro' implies custom text
      } else {
        handleChange('eventoTipo', value as TipoEvento);
      }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente</Label>
          <Input 
            id="clienteNombre" 
            placeholder="Ej: Ana Pérez" 
            value={formData.clienteNombre}
            onChange={(e) => handleChange('clienteNombre', e.target.value)}
            className="text-base p-3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventoTipo" className="text-base">Tipo de Evento</Label>
          <Select 
            value={tiposEventoDisponibles.includes(formData.eventoTipo as TipoEvento) ? formData.eventoTipo : "Otro"}
            onValueChange={handleTipoEventoChange}
          >
            <SelectTrigger id="eventoTipo" className="text-base p-3 h-auto">
              <SelectValue placeholder="Seleccioná un tipo" />
            </SelectTrigger>
            <SelectContent>
              {tiposEventoDisponibles.map(tipo => (
                <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(formData.eventoTipo === '' || (!tiposEventoDisponibles.includes(formData.eventoTipo as TipoEvento) && formData.eventoTipo !== 'Otro')) && (
             <Input 
                id="eventoTipoOtro" 
                placeholder="Especificá el tipo de evento" 
                value={formData.eventoTipo !== "Otro" ? formData.eventoTipo : ""} // Ensure 'Otro' itself is not displayed
                onChange={(e) => handleChange('eventoTipo', e.target.value)}
                className="text-base p-3 mt-2"
            />
          )}
        </div>
      </div>

      {formData.eventoTipo === 'Boda' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="nombreNovio" className="text-base">Nombre del Novio</Label>
            <Input 
              id="nombreNovio" 
              placeholder="Ej: Juan Pérez" 
              value={formData.nombreHomenajeado1}
              onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
              className="text-base p-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombreNovia" className="text-base">Nombre de la Novia</Label>
            <Input 
              id="nombreNovia" 
              placeholder="Ej: María González" 
              value={formData.nombreHomenajeado2}
              onChange={(e) => handleChange('nombreHomenajeado2', e.target.value)}
              className="text-base p-3"
            />
          </div>
        </div>
      )}

      {formData.eventoTipo !== 'Boda' && formData.eventoTipo !== 'Evento corporativo' && (
        <div className="space-y-2">
          <Label htmlFor="nombreHomenajeado" className="text-base">Nombre del Homenajeado/a</Label>
          <Input 
            id="nombreHomenajeado" 
            placeholder="Ej: Sofía (para Cumpleaños, XV años, etc.)" 
            value={formData.nombreHomenajeado1}
            onChange={(e) => handleChange('nombreHomenajeado1', e.target.value)}
            className="text-base p-3"
          />
        </div>
      )}
      
      {formData.eventoTipo === 'Evento corporativo' && (
         <div className="space-y-2">
          <Label htmlFor="nombreEmpresa" className="text-base">Nombre de la Empresa</Label>
          <Input 
            id="nombreEmpresa" 
            placeholder="Ej: Empresa S.A." 
            value={formData.nombreEmpresa}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
          />
        </div>
      )}


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento</Label>
          <DatePickerDemo 
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosCantidad" className="text-base">Cantidad Estimada de Invitados</Label>
          <Input 
            id="invitadosCantidad" 
            type="number" 
            placeholder="Ej: 50"
            value={formData.invitadosCantidad ?? ''}
            onChange={(e) => handleChange('invitadosCantidad', e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            className="text-base p-3"
          />
        </div>
      </div>
       <div className="space-y-2">
          <Label htmlFor="salonFiestas" className="text-base">Salón de Fiestas *</Label>
          <Input 
            id="salonFiestas" 
            placeholder="Ej: Salón El Paraíso" 
            value={formData.salonFiestas}
            onChange={(e) => handleChange('salonFiestas', e.target.value)}
            className="text-base p-3"
            required
          />
        </div>
    </div>
  );
}
