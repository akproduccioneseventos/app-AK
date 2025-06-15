
'use client';

import type { PresupuestoFormData, TipoEvento } from '@/types/presupuesto';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerDemo } from '@/components/date-picker-demo'; 
import type { Dispatch, SetStateAction } from 'react';
import { ALL_TIPOS_EVENTO } from '@/types/presupuesto';
import React from 'react';

interface Paso1Props {
  formData: PresupuestoFormData;
  setFormData: Dispatch<SetStateAction<PresupuestoFormData>>;
}

export default function Paso1DatosEvento({ formData, setFormData }: Paso1Props) {
  
  const handleChange = (field: keyof PresupuestoFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, eventoFecha: date }));
  };
  
  // This local state will hold the value for the Select component.
  // It's "Otro" if formData.eventoTipo is custom, otherwise it's formData.eventoTipo.
  const selectValueForTipoEvento = 
    formData.eventoTipo && ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento) 
    ? formData.eventoTipo 
    : (formData.eventoTipo ? "Otro" : ""); // If eventoTipo is not empty and not predefined, it means "Otro" was implicitly selected. If empty, show placeholder.


  const handleSelectTipoEventoChange = (value: string) => {
    if (value === "Otro") {
      // User selected "Otro", clear eventoTipo to allow custom input, and clear specific name fields
      setFormData(prev => ({ 
        ...prev, 
        eventoTipo: "", // Clear eventoTipo, custom input will fill it
        nombreEmpresa: '',
      }));
    } else {
      // User selected a predefined type, clear specific name fields
      setFormData(prev => ({ 
        ...prev, 
        eventoTipo: value as TipoEvento,
        nombreEmpresa: '',
      }));
    }
  };
  
  const handleCustomTipoEventoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This updates formData.eventoTipo directly with the custom text
    // This is for when the Select is "Otro" and user types in the Input
    setFormData(prev => ({ ...prev, eventoTipo: e.target.value }));
  };
  
  // Determine visibility for conditional name fields based on the *final* eventoTipo
  const finalEventoTipoTrimmed = formData.eventoTipo.trim();
  const showEmpresaField = finalEventoTipoTrimmed === 'Evento corporativo';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="clienteNombre" className="text-base">Nombre del Cliente *</Label>
          <Input 
            id="clienteNombre" 
            placeholder="Ej: Ana Pérez" 
            value={formData.clienteNombre}
            onChange={(e) => handleChange('clienteNombre', e.target.value)}
            className="text-base p-3"
            required
          />
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

      <div className="space-y-2">
        <Label htmlFor="eventoTipoSelect" className="text-base">Tipo de Evento *</Label>
        <Select 
          value={selectValueForTipoEvento} 
          onValueChange={handleSelectTipoEventoChange}
        >
          <SelectTrigger id="eventoTipoSelect" className="text-base p-3 h-auto">
            <SelectValue placeholder="Seleccioná un tipo" />
          </SelectTrigger>
          <SelectContent>
            {ALL_TIPOS_EVENTO.map(tipo => (
              <SelectItem key={tipo} value={tipo} className="text-base">{tipo}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Show custom input if "Otro" is selected OR if formData.eventoTipo is already a custom value */}
        {(selectValueForTipoEvento === "Otro" || (formData.eventoTipo && !ALL_TIPOS_EVENTO.includes(formData.eventoTipo as TipoEvento))) && (
           <Input 
              id="eventoTipoOtroInput" 
              placeholder="Especificá el tipo de evento *" 
              value={formData.eventoTipo} // Bind to formData.eventoTipo, which holds the custom value
              onChange={handleCustomTipoEventoInputChange}
              className="text-base p-3 mt-2"
              required={!formData.eventoTipo.trim()}
          />
        )}
      </div>

      {showEmpresaField && (
         <div className="space-y-2">
          <Label htmlFor="nombreEmpresa" className="text-base">Nombre de la Empresa *</Label>
          <Input 
            id="nombreEmpresa" 
            placeholder="Ej: Empresa S.A." 
            value={formData.nombreEmpresa}
            onChange={(e) => handleChange('nombreEmpresa', e.target.value)}
            className="text-base p-3"
            required={showEmpresaField}
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="eventoFecha" className="text-base">Fecha del Evento *</Label>
          <DatePickerDemo 
            selectedDate={formData.eventoFecha}
            onDateChange={handleDateChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invitadosCantidad" className="text-base">Cantidad Estimada de Invitados *</Label>
          <Input 
            id="invitadosCantidad" 
            type="number" 
            placeholder="Ej: 50"
            value={formData.invitadosCantidad ?? ''}
            onChange={(e) => handleChange('invitadosCantidad', e.target.value ? parseInt(e.target.value) : null)}
            min="1"
            className="text-base p-3"
            required
          />
        </div>
      </div>
    </div>
  );
}
